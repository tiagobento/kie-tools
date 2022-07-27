/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
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

import { fetchFile } from "../../github/api";
import * as minimatch from "minimatch";
import { RepoInfo } from "./RepoInfo";
import { Octokit } from "@octokit/rest";
import { FindPathsOpts, WorkspaceChannelFsService } from "@kie-tools-core/workspace/dist/api";

class ChromeExtensionWorkspaceChannelFsServiceImpl implements WorkspaceChannelFsService {
  private readonly repoInfo: RepoInfo;
  private readonly octokit: Octokit;

  constructor(octokit: Octokit, repoInfo: RepoInfo) {
    this.octokit = octokit;
    this.repoInfo = repoInfo;
  }

  public requestContent(path: string): Promise<Uint8Array | undefined> {
    return fetchFile(this.octokit, this.repoInfo.owner, this.repoInfo.repo, this.repoInfo.gitref, path)
      .then((content) => (content ? Buffer.from(content) : undefined))
      .catch((e) => {
        console.debug(e);
        console.debug(`Error retrieving content from URI ${path}`);
        return undefined;
      });
  }

  public findPaths(pattern: string, opts?: FindPathsOpts): Promise<string[]> {
    return this.octokit.git
      .getTree({
        recursive: "1",
        tree_sha: this.repoInfo.gitref,
        ...this.repoInfo,
      })
      .then((v) => {
        const filteredPaths = v.data.tree.filter((file) => file.type === "blob").map((file) => file.path!);
        return minimatch.match(filteredPaths, pattern);
      })
      .catch((e) => {
        console.debug(`Error retrieving file list for pattern ${pattern}`);
        return [];
      });
  }
}

export class ChromeExtensionWorkspaceChannelFsServiceFactory {
  public createNew(octokit: Octokit, repoInfo: RepoInfo) {
    return new ChromeExtensionWorkspaceChannelFsServiceImpl(octokit, repoInfo);
  }
}
