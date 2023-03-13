/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
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

import * as React from "react";
import { useCallback, useMemo } from "react";
import { WorkspaceFile } from "@kie-tools-core/workspaces-git-fs/dist/context/WorkspacesContext";
import {
  DmnRunnerPersistenceService,
  deepCopyPersistenceJson,
  DEFAULT_DMN_RUNNER_PERSISTENCE_JSON,
  DmnRunnerPersistenceJson,
  generateUuid,
} from "./DmnRunnerPersistenceService";
import { DmnRunnerPersistenceDispatchContext } from "./DmnRunnerPersistenceDispatchContext";
import { decoder } from "@kie-tools-core/workspaces-git-fs/dist/encoderdecoder/EncoderDecoder";
import { useSyncedCompanionFs } from "../companionFs/CompanionFsHooks";

export function DmnRunnerPersistenceDispatchContextProvider(props: React.PropsWithChildren<{}>) {
  const dmnRunnerPersistenceService = useMemo(() => {
    return new DmnRunnerPersistenceService();
  }, []);

  useSyncedCompanionFs(dmnRunnerPersistenceService.companionFsService);

  const deletePersistenceJson = useCallback(
    async (previousDmnRunnerPersisnteceJson: DmnRunnerPersistenceJson, workspaceFile: WorkspaceFile) => {
      await dmnRunnerPersistenceService.companionFsService.delete({
        workspaceId: workspaceFile.workspaceId,
        workspaceFileRelativePath: workspaceFile.relativePath,
      });

      const newPersistenceJson = deepCopyPersistenceJson(DEFAULT_DMN_RUNNER_PERSISTENCE_JSON);
      newPersistenceJson.configs.mode = previousDmnRunnerPersisnteceJson.configs.mode;
      newPersistenceJson.inputs = [{ id: generateUuid() }];

      return dmnRunnerPersistenceService.companionFsService.createOrOverwrite(
        { workspaceId: workspaceFile.workspaceId, workspaceFileRelativePath: workspaceFile.relativePath },
        JSON.stringify(newPersistenceJson)
      );
    },
    [dmnRunnerPersistenceService]
  );

  const getPersistenceJsonForDownload = useCallback(
    async (workspaceFile: WorkspaceFile) => {
      const persistenceJson = await dmnRunnerPersistenceService.companionFsService.get({
        workspaceId: workspaceFile.workspaceId,
        workspaceFileRelativePath: workspaceFile.relativePath,
      });
      return await persistenceJson
        ?.getFileContents()
        .then((content) => new Blob([content], { type: "application/json" }));
    },
    [dmnRunnerPersistenceService]
  );

  const uploadPersistenceJson = useCallback(
    async (workspaceFile: WorkspaceFile, file: File) => {
      const content = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => res(decoder.decode(event.target?.result as ArrayBuffer));
        reader.readAsArrayBuffer(file);
      });
      await dmnRunnerPersistenceService.companionFsService.createOrOverwrite(
        { workspaceId: workspaceFile.workspaceId, workspaceFileRelativePath: workspaceFile.relativePath },
        content
      );
    },
    [dmnRunnerPersistenceService]
  );

  return (
    <DmnRunnerPersistenceDispatchContext.Provider
      value={{
        dmnRunnerPersistenceService,
        deletePersistenceJson,
        getPersistenceJsonForDownload,
        uploadPersistenceJson,
      }}
    >
      {props.children}
    </DmnRunnerPersistenceDispatchContext.Provider>
  );
}
