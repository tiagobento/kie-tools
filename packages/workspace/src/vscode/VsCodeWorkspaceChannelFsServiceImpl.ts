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

import { FindPathsOpts, WorkspaceChannelFsService, SearchType } from "../api";

import * as vscode from "vscode";
import { RelativePattern } from "vscode";
import * as __path from "path";

/**
 * Implementation of a WorkspaceChannelFsService using the vscode apis to list/get assets.
 */
export class VsCodeWorkspaceChannelFsServiceImpl implements WorkspaceChannelFsService {
  private readonly currentAssetFolder: string;

  constructor(currentAssetFolder: string) {
    this.currentAssetFolder = currentAssetFolder;
  }

  public async findPaths(pattern: string, opts?: FindPathsOpts): Promise<string[]> {
    const workspaceFolderPath = vscode.workspace.workspaceFolders![0].uri.fsPath + __path.sep;
    const basePath =
      opts?.searchType === SearchType.ASSET_FOLDER
        ? workspaceFolderPath + this.currentAssetFolder
        : workspaceFolderPath;
    const relativePattern = new RelativePattern(basePath, pattern);
    const files = await vscode.workspace.findFiles(relativePattern);
    return files.map((uri) => vscode.workspace.asRelativePath(uri));
  }

  public async requestContent(path: string): Promise<Uint8Array | undefined> {
    const filePath = resolvePath(path);
    if (!filePath) {
      return undefined;
    }

    try {
      await vscode.workspace.fs.stat(vscode.Uri.parse(filePath));
    } catch (e) {
      console.warn(`Error checking file ${path}: ${e}`);
      return undefined;
    }

    return vscode.workspace.fs.readFile(vscode.Uri.parse(filePath));
  }
}

function resolvePath(uri: string) {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    return undefined;
  }

  const rootPath = folders[0].uri.path;
  if (!uri.startsWith(__path.sep)) {
    uri = __path.sep + uri;
  }
  return rootPath + uri;
}
