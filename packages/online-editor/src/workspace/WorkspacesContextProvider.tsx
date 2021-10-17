/*
 * Copyright 2021 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  ContentType,
  ResourceContent,
  ResourceContentOptions,
  ResourcesList,
} from "@kie-tooling-core/workspace/dist/api";
import * as React from "react";
import { useCallback, useMemo } from "react";
import { WorkspaceDescriptor } from "./model/WorkspaceDescriptor";
import { GitService } from "./services/GitService";
import { StorageFile, StorageService } from "./services/StorageService";
import { WorkspaceService } from "./services/WorkspaceService";
import { SUPPORTED_FILES, SUPPORTED_FILES_EDITABLE } from "./SupportedFiles";
import { decoder, encoder, LocalFile, WorkspaceFile, WorkspacesContext } from "./WorkspacesContext";
import { SupportedFileExtensions } from "../common/GlobalContext";
import { extractFileExtension } from "../common/utils";
import { emptyTemplates } from "./FileTemplates";
import { join } from "path";
import git from "isomorphic-git";
import { WorkspaceEvents } from "./hooks/WorkspaceHooks";
import { Buffer } from "buffer";
import LightningFS from "@isomorphic-git/lightning-fs";
import { WorkspaceDescriptorService } from "./services/WorkspaceDescriptorService";

const GIT_CORS_PROXY = "https://cors.isomorphic-git.org"; // TODO CAPONETTO: Deploy our own proxy (https://github.com/isomorphic-git/cors-proxy)

const MAX_NEW_FILE_INDEX_ATTEMPTS = 10;
const NEW_FILE_DEFAULT_NAME = "Untitled";

interface Props {
  children: React.ReactNode;
}

export function WorkspacesContextProvider(props: Props) {
  const storageService = useMemo(() => {
    const instance = new StorageService();
    // FIXME: easy access to git in the window object.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (window as any).fs = () => instance;
    return instance;
  }, []);

  const workspaceDescriptorService = useMemo(() => {
    return new WorkspaceDescriptorService(storageService);
  }, [storageService]);

  const workspaceService = useMemo(() => {
    return new WorkspaceService(storageService, workspaceDescriptorService);
  }, [storageService, workspaceDescriptorService]);

  const gitService = useMemo(() => {
    const instance = new GitService(GIT_CORS_PROXY);
    // FIXME: easy access to git in the window object.
    (window as any).git = async (workspaceId: string, prop: unknown, args: any) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return git[prop]({ fs: await workspaceService.getWorkspaceFs(workspaceId), ...args });
    };
    return instance;
  }, [workspaceService]);

  const getAbsolutePath = useCallback(
    (args: { workspaceId: string; relativePath: string }) => workspaceService.getAbsolutePath(args),
    [workspaceService]
  );

  const createWorkspace = useCallback(
    async (storeFiles: (fs: LightningFS, workspace: WorkspaceDescriptor) => Promise<WorkspaceFile[]>) => {
      const { workspace, files } = await workspaceService.create(storeFiles, { broadcast: true });
      if (files.length <= 0) {
        return { workspace, suggestedFirstFile: undefined };
      }

      const suggestedFirstFile = files
        .filter((file) => SUPPORTED_FILES_EDITABLE.includes(file.extension))
        .sort((a, b) => a.relativePath.localeCompare(b.relativePath))[0];
      return {
        workspace,
        suggestedFirstFile,
      };
    },
    [workspaceService]
  );

  const isModified = useCallback(
    async (workspaceId: string) => {
      return await gitService.isModified({
        fs: workspaceService.getWorkspaceFs(workspaceId),
        dir: workspaceService.getAbsolutePath({ workspaceId, relativePath: "" }),
      });
    },
    [gitService, workspaceService]
  );

  const createSavePoint = useCallback(
    async (workspaceId: string) => {
      const fs = workspaceService.getWorkspaceFs(workspaceId);
      const filePaths = await gitService.unstagedModifiedFileRelativePaths({
        fs,
        dir: await workspaceService.resolveRootPath(fs, workspaceId),
      });

      await gitService.commit({
        fs,
        filePaths,
        dir: workspaceService.getAbsolutePath({ workspaceId, relativePath: "" }),
        targetBranch: "main",
        message: "Save point",
        authInfo: {
          name: "Tiago",
          email: "tfernand+dev@redhat.com", //FIXME: Change this.
        },
      });
      const broadcastChannel = new BroadcastChannel(workspaceId);
      const workspaceEvent: WorkspaceEvents = { type: "CREATE_SAVE_POINT", workspaceId };
      broadcastChannel.postMessage(workspaceEvent);
    },
    [gitService, workspaceService]
  );

  const createWorkspaceFromLocal = useCallback(
    async (localFiles: LocalFile[]) => {
      return await createWorkspace(async (fs: LightningFS, workspace: WorkspaceDescriptor) => {
        const files = localFiles
          .filter((f) => SUPPORTED_FILES.includes(extractFileExtension(f.path)!))
          .map((localFile) => {
            const path = workspaceService.getAbsolutePath({
              workspaceId: workspace.workspaceId,
              relativePath: localFile.path.substring(localFile.path.indexOf("/") + 1),
            });

            return new StorageFile({
              path,
              getFileContents: localFile.getFileContents,
            });
          });

        console.time("create files");
        await storageService.createFiles(fs, files);
        console.timeEnd("create files");

        const gitRoot = await workspaceService.resolveRootPath(fs, workspace.workspaceId);
        await gitService.init({
          fs: fs,
          dir: gitRoot,
        });

        await gitService.add({
          fs: fs,
          dir: gitRoot,
          relativePath: ".",
        });

        await gitService.commit({
          fs: fs,
          filePaths: [],
          dir: gitRoot,
          message: "Initial",
          targetBranch: "main",
          authInfo: {
            name: "Tiago",
            email: "tfernand+dev@redhat.com", //FIXME: Change this.
          },
        });

        return workspaceService.getFilesLazy(fs, workspace.workspaceId);
      });
    },
    [createWorkspace, gitService, storageService, workspaceService]
  );

  // const createWorkspaceFromGitHubRepository = useCallback(
  //   async (
  //     repositoryUrl: URL,
  //     sourceBranch: string,
  //     githubSettings: { user: { login: string; email: string; name: string }; token: string }
  //   ) => {
  //     if (!githubSettings.user) {
  //       throw new Error("User not authenticated on GitHub");
  //     }
  //
  //     const descriptor: WorkspaceDescriptor = {
  //       workspaceId: workspaceService.newWorkspaceId(),
  //       name: NEW_WORKSPACE_DEFAULT_NAME,
  //       origin: { url: repositoryUrl, branch: sourceBranch, kind: WorkspaceKind.GITHUB_REPOSITORY },
  //       createdDateISO: new Date().toISOString(),
  //       lastUpdatedDateISO: new Date().toISOString(),
  //     };
  //
  //     const authInfo = {
  //       name: githubSettings.user.name,
  //       email: githubSettings.user.email,
  //       onAuth: () => ({
  //         username: githubSettings.user.login,
  //         password: githubSettings.token,
  //       }),
  //     };
  //
  //     const fileHandler = new GitRepositoryFileHandler({
  //       authInfo: authInfo,
  //       repositoryUrl: repositoryUrl,
  //       sourceBranch: sourceBranch,
  //       gitService: gitService,
  //       workspaceService: workspaceService,
  //     });
  //     await createWorkspace(descriptor, fileHandler);
  //     return descriptor;
  //   },
  //   [workspaceService, gitService, createWorkspace]
  // );

  const renameFile = useCallback(
    async (file: WorkspaceFile, newFileName: string) => {
      return workspaceService.renameFile(file, newFileName, { broadcast: true });
    },
    [workspaceService]
  );

  const getFiles = useCallback(
    async (workspaceId: string) => {
      return workspaceService.getFilesLazy(workspaceService.getWorkspaceFs(workspaceId), workspaceId);
    },
    [workspaceService]
  );

  const getFile = useCallback(
    async (args: { workspaceId: string; relativePath: string }) => {
      return workspaceService.getFile(args);
    },
    [workspaceService]
  );

  const deleteFile = useCallback(
    async (file: WorkspaceFile) => {
      await workspaceService.deleteFile(file, { broadcast: true });
    },
    [workspaceService]
  );

  const updateFile = useCallback(
    async (file: WorkspaceFile, getNewContents: () => Promise<string>) => {
      await workspaceService.updateFile(file, getNewContents, { broadcast: true });
    },
    [workspaceService]
  );

  const addEmptyFile = useCallback(
    async (args: { workspaceId: string; destinationDirRelativePath: string; extension: SupportedFileExtensions }) => {
      for (let i = 0; i < MAX_NEW_FILE_INDEX_ATTEMPTS; i++) {
        const index = i === 0 ? "" : `-${i}`;
        const fileName = `${NEW_FILE_DEFAULT_NAME}${index}.${args.extension}`;
        const relativePath = join(args.destinationDirRelativePath, fileName);
        if (
          await workspaceService.existsFile({
            fs: workspaceService.getWorkspaceFs(args.workspaceId),
            workspaceId: args.workspaceId,
            relativePath,
          })
        ) {
          continue;
        }

        const contents = args.extension in emptyTemplates ? emptyTemplates[args.extension] : emptyTemplates.default;
        const newEmptyFile = new WorkspaceFile({
          workspaceId: args.workspaceId,
          getFileContents: () => Promise.resolve(encoder.encode(contents)),
          relativePath,
        });
        await workspaceService.createFile(newEmptyFile, { broadcast: true });
        return newEmptyFile;
      }

      throw new Error("Max attempts of new empty file exceeded.");
    },
    [workspaceService]
  );

  const prepareZip = useCallback((workspaceId: string) => workspaceService.prepareZip(workspaceId), [workspaceService]);

  // const syncWorkspace = useCallback(async () => {
  //   if (!active) {
  //     throw new Error("No active workspace");
  //   }
  //
  //   if (active.descriptor.origin.kind === WorkspaceKind.GITHUB_REPOSITORY) {
  //     const origin = active.descriptor.origin as GitHubRepositoryOrigin;
  //     const fileHandler = new GitRepositoryFileHandler({
  //       authInfo: authInfo,
  //       repositoryUrl: origin.url,
  //       sourceBranch: origin.branch,
  //       gitService: gitService,
  //       workspaceService: workspaceService,
  //       storageService: storageService,
  //     });
  //     await fileHandler.sync(active.descriptor);
  //   }
  // }, [active, authInfo, gitService, storageService, workspaceService]);

  const resourceContentGet = useCallback(
    async (args: { workspaceId: string; relativePath: string; opts?: ResourceContentOptions }) => {
      const file = await workspaceService.getFile(args);
      if (!file) {
        throw new Error(`File '${args.relativePath}' not found in Workspace ${args.workspaceId}`);
      }

      console.info("Reading " + args.relativePath);

      try {
        const content = await file.getFileContents();
        if (args.opts?.type === "binary") {
          return new ResourceContent(args.relativePath, Buffer.from(content).toString("base64"), ContentType.BINARY);
        }

        // "text" is the default
        return new ResourceContent(args.relativePath, decoder.decode(content), ContentType.TEXT);
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    [workspaceService]
  );

  const resourceContentList = useCallback(
    async (args: { workspaceId: string; globPattern: string }) => {
      const files = await workspaceService.getFilesLazy(
        workspaceService.getWorkspaceFs(args.workspaceId),
        args.workspaceId,
        args.globPattern
      );
      const matchingPaths = files.map((file) => file.relativePath);
      return new ResourcesList(args.globPattern, matchingPaths);
    },
    [workspaceService]
  );

  return (
    <WorkspacesContext.Provider
      value={{
        workspaceService,
        workspaceDescriptorService,
        resourceContentGet,
        resourceContentList,
        //
        createWorkspaceFromLocal,
        prepareZip,
        getAbsolutePath,
        createSavePoint,
        getFiles,
        isModified,
        //
        addEmptyFile,
        renameFile,
        updateFile,
        deleteFile,
        getFile,
      }}
    >
      {props.children}
    </WorkspacesContext.Provider>
  );
}
