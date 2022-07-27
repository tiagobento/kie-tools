/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as minimatch from "minimatch";
import * as vscode from "vscode";
import { FindPathsOpts, WorkspaceChannelFsService } from "../api";

/**
 * Implementation of a WorkspaceChannelFsService using the Node filesystem APIs. This should only be used when the edited
 * asset is not part the opened workspace.
 */
export class VsCodeNodeWorkspaceChannelFsServiceImpl implements WorkspaceChannelFsService {
  private readonly rootFolder: string;

  constructor(rootFolder: string) {
    this.rootFolder = rootFolder;
  }

  public async findPaths(globPattern: string, opts?: FindPathsOpts): Promise<string[]> {
    try {
      const files = await vscode.workspace.fs.readDirectory(vscode.Uri.parse(this.rootFolder));
      return files
        .filter(([name, depth]) => depth === 1 && minimatch(name, globPattern))
        .map(([name]) => this.rootFolder + name);
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  public async requestContent(path: string): Promise<Uint8Array | undefined> {
    try {
      const assetPath = !path.startsWith(this.rootFolder) ? this.rootFolder + path : path;
      return await vscode.workspace.fs.readFile(vscode.Uri.parse(assetPath));
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }
}
