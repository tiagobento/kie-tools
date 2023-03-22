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
import { useCallback, useMemo, useReducer, useRef } from "react";
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
  DmnRunnerUpdatePersistenceJsonDeboucerArgs,
} from "./DmnRunnerPersistenceDispatchContext";
import { decoder } from "@kie-tools-core/workspaces-git-fs/dist/encoderdecoder/EncoderDecoder";
import { useSyncedCompanionFs } from "../companionFs/CompanionFsHooks";
import isEqual from "lodash/isEqual";

export const LOCK = {
  fsUpdate: false,
};

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

    if (LOCK.fsUpdate && !isEqual(persistenceJson, newPersistenceJson)) {
      // update in current tab; happened a FS update;
    }

    // SCENARIO 1
    // type "a"
    // trigger deboucer "a"
    // return "a"
    // type "b" ("ab")
    // execute debouncer "a";
    // trigger debouncer "ab";
    // return "ab";
    // response from debouncer "a" (should be ignored)
    // execute debouncer for "ab";

    // SCENARIO 2 (other tab)
    // ...

    // update FS;
    action.updatePersistenceJsonDebouce({
      workspaceId: action.workspaceId,
      workspaceFileRelativePath: action.workspaceFileRelativePath,
      content: JSON.stringify(newPersistenceJson),
    });

    if (!LOCK.fsUpdate) {
      return newPersistenceJson;
    } else {
      return persistenceJson;
    }
  } else if (action.type === DmnRunnerPersistenceReducerActionType.DEFAULT) {
    // Check for changes before update;
    if (isEqual(persistenceJson, action.newPersistenceJson)) {
      return persistenceJson;
    }

    // update FS;
    if (!LOCK) {
      action.updatePersistenceJsonDebouce({
        workspaceId: action.workspaceId,
        workspaceFileRelativePath: action.workspaceFileRelativePath,
        content: JSON.stringify(action.newPersistenceJson),
      });
    }

    if (!LOCK) {
      return action.newPersistenceJson;
    } else {
      return persistenceJson;
    }
  } else {
    throw new Error("Invalid action for DmnRunnerPersistence reducer");
  }
}

const initialDmnRunnerPersistenceJson = getNewDefaultDmnRunnerPersistenceJson();

export function DmnRunnerPersistenceDispatchContextProvider(props: React.PropsWithChildren<{}>) {
  const timeout = useRef<number | undefined>(undefined);

  const [dmnRunnerPersistenceJson, dmnRunnerPersistenceJsonDispatcher] = useReducer(
    dmnRunnerPersistenceJsonReducer,
    initialDmnRunnerPersistenceJson
  );

  const dmnRunnerPersistenceService = useMemo(() => {
    return new DmnRunnerPersistenceService();
  }, []);

  useSyncedCompanionFs(dmnRunnerPersistenceService.companionFsService);

  const updatePersistenceJsonDebouce = useCallback(
    (args: DmnRunnerUpdatePersistenceJsonDeboucerArgs) => {
      if (timeout.current) {
        window.clearTimeout(timeout.current);
      }

      timeout.current = window.setTimeout(() => {
        LOCK.fsUpdate = true;
        dmnRunnerPersistenceService.companionFsService.update(
          {
            workspaceId: args.workspaceId,
            workspaceFileRelativePath: args.workspaceFileRelativePath,
          },
          args.content
        );
      }, 100);
    },
    [dmnRunnerPersistenceService]
  );

  const deletePersistenceJson = useCallback(
    (previousDmnRunnerPersisnteceJson: DmnRunnerPersistenceJson, workspaceFile: WorkspaceFile) => {
      // overwrite the current persistenceJson with a new one;
      const newPersistenceJson = getNewDefaultDmnRunnerPersistenceJson();
      // keep current mode;
      newPersistenceJson.configs.mode = previousDmnRunnerPersisnteceJson.configs.mode;

      dmnRunnerPersistenceJsonDispatcher({
        updatePersistenceJsonDebouce,
        workspaceId: workspaceFile.workspaceId,
        workspaceFileRelativePath: workspaceFile.relativePath,
        type: DmnRunnerPersistenceReducerActionType.DEFAULT,
        newPersistenceJson,
      });
    },
    [updatePersistenceJsonDebouce]
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
        updatePersistenceJsonDebouce,
        dmnRunnerPersistenceJson,
        dmnRunnerPersistenceJsonDispatcher,
      }}
    >
      {props.children}
    </DmnRunnerPersistenceDispatchContext.Provider>
  );
}
