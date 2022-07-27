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

import * as path from "path";
import { VsCodeNodeWorkspaceChannelFsServiceImpl } from "@kie-tools-core/workspace/dist/vscode/VsCodeNodeWorkspaceChannelFsServiceImpl";

const testWorkspacePath = path.resolve(__dirname, "test-workspace");

describe("VsCodeNodeWorkspaceChannelFsServiceImpl", () => {
  test("Test list", async () => {
    const txtPattern = "*.txt";
    const workspaceFsService = new VsCodeNodeWorkspaceChannelFsServiceImpl(testWorkspacePath + path.sep);

    const resourcesListWithAssets = await workspaceFsService.findPaths(txtPattern);
    expect(resourcesListWithAssets).toHaveLength(2);
    expect(resourcesListWithAssets).toContain(path.join(testWorkspacePath, "resource1.txt"));
    expect(resourcesListWithAssets).toContain(path.join(testWorkspacePath, "resource2.txt"));

    const pdfPattern = "*.pdf";
    const resourcesListEmpty = await workspaceFsService.findPaths(pdfPattern);
    expect(resourcesListEmpty).toHaveLength(0);
  });

  test("Test list with errors", async () => {
    const workspaceFsService = new VsCodeNodeWorkspaceChannelFsServiceImpl("/probably/an/nonexistent/path/");

    const pattern = "*.txt";
    const resourcesList = await workspaceFsService.findPaths(pattern);
    expect(resourcesList).toHaveLength(0);
  });

  test("Test get", async () => {
    const workspaceFsService = new VsCodeNodeWorkspaceChannelFsServiceImpl(testWorkspacePath + path.sep);

    const resource1Path = "resource1.txt";
    const resource1Content = await workspaceFsService.requestContent(resource1Path);
    expect(resource1Content).toStrictEqual(new Buffer("content for resource 1"));

    const resource2Path = "resource2.txt";
    const resource2Content = await workspaceFsService.requestContent(resource2Path);
    expect(resource2Content).not.toBeNull();

    const iconPath = "icon.png";
    const iconContent = await workspaceFsService.requestContent(iconPath);
    expect(iconContent).not.toBeNull();
  });

  test("Test get with errors", async () => {
    const workspaceFsService = new VsCodeNodeWorkspaceChannelFsServiceImpl("/probably/an/nonexistent/path/");

    const txtResourcePath = "resource1.txt";
    const txtResourceContent = await workspaceFsService.requestContent(txtResourcePath);
    expect(txtResourceContent).toBe(undefined);

    const binaryPath = "icon.png";
    const binaryContent = await workspaceFsService.requestContent(binaryPath);
    expect(binaryContent).toBe(undefined);
  });
});
