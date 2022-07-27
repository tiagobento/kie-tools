/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { WorkspaceEdit } from "../api";

export interface WorkspaceChannelApi {
  kogitoWorkspace_onNewEdit(edit: WorkspaceEdit): void;
  kogitoWorkspace_openFile(path: string): void;
  kogitoWorkspace_requestContent(path: string): Promise<Uint8Array | undefined>;
  kogitoWorkspace_findPaths(globPattern: string, opts?: FindPathsOpts): Promise<string[]>;
}

export type FindPathsOpts = {
  searchType: SearchType;
};

export enum SearchType {
  TRAVERSAL = "traversal",
  ASSET_FOLDER = "asset-folder",
}
