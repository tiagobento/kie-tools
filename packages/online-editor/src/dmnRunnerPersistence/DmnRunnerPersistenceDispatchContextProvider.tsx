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
import { useCallback, useMemo, useReducer } from "react";
import { WorkspaceFile } from "@kie-tools-core/workspaces-git-fs/dist/context/WorkspacesContext";
import {
  DmnRunnerPersistenceService,
  DmnRunnerPersistenceJson,
  getNewDefaultDmnRunnerPersistenceJson,
} from "./DmnRunnerPersistenceService";
import {
  DmnRunnerPersistenceDispatchContext,
  DmnRunnerPersistenceReducerActionType,
  DmnRunnerPersistenceReducerAction,
} from "./DmnRunnerPersistenceDispatchContext";
import { decoder } from "@kie-tools-core/workspaces-git-fs/dist/encoderdecoder/EncoderDecoder";
import { useSyncedCompanionFs } from "../companionFs/CompanionFsHooks";
import isEqual from "lodash/isEqual";
import { DmnRunnerPersistenceQueue } from "./DmnRunnerPersistenceQueue";

// Update the state and update the FS;
function dmnRunnerPersistenceJsonReducer(
  persistenceJson: DmnRunnerPersistenceJson,
  action: DmnRunnerPersistenceReducerAction
) {
  if (action.type === DmnRunnerPersistenceReducerActionType.PREVIOUS) {
    const newPersistenceJson = action.newPersistenceJson(persistenceJson);
    // Check for changes before update;
    if (isEqual(persistenceJson, newPersistenceJson)) {
      return persistenceJson;
    }

    // update FS;
    action.dmnRunnerPersistenceQueue.post({
      method: action.dmnRunnerPersistenceQueue.companionFsService.update,
      args: [
        {
          workspaceId: action.workspaceId,
          workspaceFileRelativePath: action.workspaceFileRelativePath,
        },
        JSON.stringify(newPersistenceJson),
      ],
    });
    return newPersistenceJson;
  }

  // Check for changes before update;
  if (isEqual(persistenceJson, action.newPersistenceJson)) {
    return persistenceJson;
  }

  // update FS;
  action.dmnRunnerPersistenceQueue.post({
    method: action.dmnRunnerPersistenceQueue.companionFsService.update,
    args: [
      {
        workspaceId: action.workspaceId,
        workspaceFileRelativePath: action.workspaceFileRelativePath,
      },
      JSON.stringify(action.newPersistenceJson),
    ],
  });
  return action.newPersistenceJson;
}

const initialDmnRunnerPersistenceJson = getNewDefaultDmnRunnerPersistenceJson();

export function DmnRunnerPersistenceDispatchContextProvider(props: React.PropsWithChildren<{}>) {
  const dmnRunnerPersistenceService = useMemo(() => {
    return new DmnRunnerPersistenceService();
  }, []);
  const dmnRunnerPersistenceQueue = useMemo(() => {
    return new DmnRunnerPersistenceQueue(dmnRunnerPersistenceService.companionFsService);
  }, [dmnRunnerPersistenceService.companionFsService]);

  const [dmnRunnerPersistenceJson, dispatchDmnRunnerPersistenceJson] = useReducer(
    dmnRunnerPersistenceJsonReducer,
    initialDmnRunnerPersistenceJson
  );

  useSyncedCompanionFs(dmnRunnerPersistenceService.companionFsService);

  const deletePersistenceJson = useCallback(
    (previousDmnRunnerPersisnteceJson: DmnRunnerPersistenceJson, workspaceFile: WorkspaceFile) => {
      // overwrite the current persistenceJson with a new one;
      const newPersistenceJson = getNewDefaultDmnRunnerPersistenceJson();
      // keep current mode;
      newPersistenceJson.configs.mode = previousDmnRunnerPersisnteceJson.configs.mode;

      dispatchDmnRunnerPersistenceJson({
        dmnRunnerPersistenceQueue,
        workspaceId: workspaceFile.workspaceId,
        workspaceFileRelativePath: workspaceFile.relativePath,
        type: DmnRunnerPersistenceReducerActionType.DEFAULT,
        newPersistenceJson,
      });
    },
    [dmnRunnerPersistenceQueue]
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
        dmnRunnerPersistenceJson,
        dispatchDmnRunnerPersistenceJson,
      }}
    >
      {props.children}
    </DmnRunnerPersistenceDispatchContext.Provider>
  );
}
