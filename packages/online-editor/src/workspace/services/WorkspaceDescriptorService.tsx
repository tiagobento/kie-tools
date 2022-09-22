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

import { NEW_WORKSPACE_DEFAULT_NAME, WorkspaceDescriptor } from "../worker/api/WorkspaceDescriptor";
import { v4 as uuid } from "uuid";
import { StorageFile, StorageService } from "./StorageService";
import { decoder, encoder } from "../encoderdecoder/EncoderDecoder";
import { WorkspaceKind, WorkspaceOrigin } from "../worker/api/WorkspaceOrigin";
import { GIST_DEFAULT_BRANCH, GIT_DEFAULT_BRANCH } from "../constants/GitConstants";
import { KieSandboxWorkspacesFs } from "./KieSandboxWorkspaceFs";
import { WorkspaceDescriptorFsService } from "./WorkspaceDescriptorFsService";
import { join } from "path";

export class WorkspaceDescriptorService {
  constructor(
    private readonly descriptorFsService: WorkspaceDescriptorFsService,
    private readonly storageService: StorageService
  ) {}

  public async listAll(fs: KieSandboxWorkspacesFs): Promise<WorkspaceDescriptor[]> {
    const workspaceDescriptorsFilePaths = await this.storageService.walk({
      fs: fs,
      startFromDirPath: this.getAbsolutePath(""),
      shouldExcludeDir: () => false,
      onVisit: async ({ absolutePath }) => absolutePath,
    });

    return Promise.all(
      workspaceDescriptorsFilePaths.map(async (p) => {
        const content = await this.storageService.getFileContent(fs, p);
        return JSON.parse(decoder.decode(content));
      })
    );
  }

  public async bumpLastUpdatedDate(fs: KieSandboxWorkspacesFs, workspaceId: string): Promise<void> {
    const file = this.toStorageFile({
      ...(await this.get(fs, workspaceId)),
      lastUpdatedDateISO: new Date().toISOString(),
    });
    await this.storageService.updateFile(fs, file.path, file.getFileContents);
  }

  public async get(fs: KieSandboxWorkspacesFs, workspaceId: string): Promise<WorkspaceDescriptor> {
    const workspaceDescriptorFile = await this.storageService.getFile(fs, this.getAbsolutePath(workspaceId));

    if (!workspaceDescriptorFile) {
      throw new Error(`Workspace not found (${workspaceId})`);
    }

    return JSON.parse(decoder.decode(await workspaceDescriptorFile.getFileContents()));
  }

  public async create(args: { fs: KieSandboxWorkspacesFs; origin: WorkspaceOrigin; preferredName?: string }) {
    const workspace: WorkspaceDescriptor = {
      workspaceId: this.newWorkspaceId(),
      name: args.preferredName?.trim() || NEW_WORKSPACE_DEFAULT_NAME,
      origin: args.origin,
      createdDateISO: new Date().toISOString(),
      lastUpdatedDateISO: new Date().toISOString(),
    };
    await this.storageService.createOrOverwriteFile(args.fs, this.toStorageFile(workspace));
    return workspace;
  }

  public async delete(fs: KieSandboxWorkspacesFs, workspaceId: string) {
    await this.storageService.deleteFile(fs, this.getAbsolutePath(workspaceId));
  }

  public async rename(fs: KieSandboxWorkspacesFs, workspaceId: string, newName: string) {
    const file = this.toStorageFile({
      ...(await this.get(fs, workspaceId)),
      name: newName,
    });
    await this.storageService.updateFile(fs, file.path, file.getFileContents);
  }

  public async turnIntoGist(fs: KieSandboxWorkspacesFs, workspaceId: string, gistUrl: URL) {
    const file = this.toStorageFile({
      ...(await this.get(fs, workspaceId)),
      origin: {
        kind: WorkspaceKind.GITHUB_GIST,
        url: gistUrl.toString(),
        branch: GIST_DEFAULT_BRANCH,
      },
    });
    await this.storageService.updateFile(fs, file.path, file.getFileContents);
  }

  public async turnIntoGit(fs: KieSandboxWorkspacesFs, workspaceId: string, url: URL) {
    const file = this.toStorageFile({
      ...(await this.get(fs, workspaceId)),
      origin: {
        kind: WorkspaceKind.GIT,
        url: url.toString(),
        branch: GIT_DEFAULT_BRANCH,
      },
    });
    await this.storageService.updateFile(fs, file.path, file.getFileContents);
  }

  private getAbsolutePath(relativePath: string) {
    return join("/", this.descriptorFsService.getMountPoint(), relativePath ?? "");
  }

  private toStorageFile(descriptor: WorkspaceDescriptor) {
    return new StorageFile({
      path: this.getAbsolutePath(descriptor.workspaceId),
      getFileContents: () => Promise.resolve(encoder.encode(JSON.stringify(descriptor))),
    });
  }

  public newWorkspaceId(): string {
    return uuid();
  }
}
