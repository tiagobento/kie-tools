/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
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

import { FindPathsOpts, WorkspaceChannelFsService, WorkspaceChannelApi, WorkspaceEdit } from "../api";
import * as vscode from "vscode";
import { VsCodeWorkspaceChannelFsServiceImpl } from "./VsCodeWorkspaceChannelFsServiceImpl";
import { VsCodeNodeWorkspaceChannelFsServiceImpl } from "./VsCodeNodeWorkspaceChannelFsServiceImpl";
import * as __path from "path";

export class VsCodeWorkspaceChannelApiImpl implements WorkspaceChannelApi {
  private readonly service: WorkspaceChannelFsService;

  constructor(private readonly args: { path: string; workspacePath: string }) {
    if (this.isAssetInWorkspace(args.path)) {
      this.service = new VsCodeWorkspaceChannelFsServiceImpl(getParentFolder(args.workspacePath));
    } else {
      this.service = new VsCodeNodeWorkspaceChannelFsServiceImpl(getParentFolder(args.path));
    }
  }
  public kogitoWorkspace_openFile(path: string) {
    try {
      vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(path));
    } catch (e) {
      throw new Error(`Cannot open file at: ${path}.`);
    }
  }

  public async kogitoWorkspace_requestContent(path: string): Promise<Uint8Array | undefined> {
    return this.service.requestContent(path);
  }

  public async kogitoWorkspace_onNewEdit(edit: WorkspaceEdit) {
    throw new Error("This is not implemented yet.");
  }

  public async kogitoWorkspace_findPaths(globPattern: string, opts?: FindPathsOpts): Promise<string[]> {
    return this.service.findPaths(globPattern, opts);
  }

  private isAssetInWorkspace(path: string): boolean {
    return vscode.workspace.workspaceFolders?.map((f) => f.uri.fsPath).find((p) => path.startsWith(p)) !== undefined;
  }
}

function getParentFolder(assetPath: string) {
  if (assetPath.includes(__path.sep)) {
    return assetPath.substring(0, assetPath.lastIndexOf(__path.sep) + 1);
  }
  return "";
}
