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
import { useCallback, useReducer } from "react";
import { useCancelableEffect } from "@kie-tools-core/react-hooks/dist/useCancelableEffect";
import { WorkspaceFile } from "@kie-tools-core/workspaces-git-fs/dist/context/WorkspacesContext";
import { useDmnRunnerPersistenceDispatch } from "./DmnRunnerPersistenceDispatchContext";
import { decoder } from "@kie-tools-core/workspaces-git-fs/dist/encoderdecoder/EncoderDecoder";
import { CompanionFsServiceBroadcastEvents } from "../companionFs/CompanionFsService";
import {
  DmnRunnerPersistenceJson,
  EMPTY_DMN_RUNNER_PERSISTANCE_JSON,
  deepCopyPersistenceJson,
  generateUuid,
  DmnRunnerPersistenceService,
} from "./DmnRunnerPersistenceService";
import isEqual from "lodash/isEqual";
import { DEFAULT_DMN_RUNNER_PERSISTENCE_JSON } from "./DmnRunnerPersistenceService";

export enum DmnRunnerPersistenceReducerActionType {
  DEFAULT,
  PREVIOUS,
}

export interface DmnRunnerPersistenceReducerActionPrevious {
  type: DmnRunnerPersistenceReducerActionType.PREVIOUS;
  newPersistenceJson: (previous: DmnRunnerPersistenceJson) => DmnRunnerPersistenceJson;
}

export interface DmnRunnerPersistenceReducerActionDefault {
  type: DmnRunnerPersistenceReducerActionType.DEFAULT;
  newPersistenceJson: DmnRunnerPersistenceJson;
}

type DmnRunnerPersistenceReducerAction = {
  dmnRunnerPersistenceService: DmnRunnerPersistenceService;
  workspaceFileRelativePath: string;
  workspaceId: string;
} & (DmnRunnerPersistenceReducerActionDefault | DmnRunnerPersistenceReducerActionPrevious);

interface DmnRunnerPersistenceHook {
  dmnRunnerPersistenceJson: DmnRunnerPersistenceJson;
  dispatchDmnRunnerPersistenceJson: React.Dispatch<DmnRunnerPersistenceReducerAction>;
}

function reducer(persistenceJson: DmnRunnerPersistenceJson, action: DmnRunnerPersistenceReducerAction) {
  if (action.type === DmnRunnerPersistenceReducerActionType.PREVIOUS) {
    const newPersistenceJson = action.newPersistenceJson(persistenceJson);

    // Check before update;
    if (isEqual(persistenceJson, newPersistenceJson)) {
      return persistenceJson;
    }

    action.dmnRunnerPersistenceService.companionFsService.update(
      {
        workspaceId: action.workspaceId,
        workspaceFileRelativePath: action.workspaceFileRelativePath,
      },
      JSON.stringify(newPersistenceJson)
    );
    return newPersistenceJson;
  }

  // Check before update;
  if (isEqual(persistenceJson, action.newPersistenceJson)) {
    return persistenceJson;
  }

  // update FS; it's a async function;
  action.dmnRunnerPersistenceService.companionFsService.update(
    {
      workspaceId: action.workspaceId,
      workspaceFileRelativePath: action.workspaceFileRelativePath,
    },
    JSON.stringify(action.newPersistenceJson)
  );
  return action.newPersistenceJson;
}

export function useDmnRunnerPersistence(
  workspaceId?: string,
  workspaceFileRelativePath?: string
): DmnRunnerPersistenceHook {
  const { dmnRunnerPersistenceService } = useDmnRunnerPersistenceDispatch();

  const [dmnRunnerPersistenceJson, dispatchDmnRunnerPersistenceJson] = useReducer(
    reducer,
    DEFAULT_DMN_RUNNER_PERSISTENCE_JSON
  );

  // When another TAB updates the FS, it should sync up
  useCancelableEffect(
    useCallback(
      ({ canceled }) => {
        if (!workspaceFileRelativePath || !workspaceId) {
          return;
        }

        const dmnRunnerPersistenceJsonFileUniqueId =
          dmnRunnerPersistenceService.companionFsService.getUniqueFileIdentifier({
            workspaceId: workspaceId,
            workspaceFileRelativePath: workspaceFileRelativePath,
          });

        console.debug(`Subscribing to ${dmnRunnerPersistenceJsonFileUniqueId}`);
        const broadcastChannel = new BroadcastChannel(dmnRunnerPersistenceJsonFileUniqueId);
        broadcastChannel.onmessage = ({ data: companionEvent }: MessageEvent<CompanionFsServiceBroadcastEvents>) => {
          if (canceled.get()) {
            return;
          }
          console.debug(`EVENT::WORKSPACE_FILE: ${JSON.stringify(companionEvent)}`);
          if (companionEvent.type === "CFSF_MOVE" || companionEvent.type == "CFSF_RENAME") {
            // Ignore, as content remains the same.
          } else if (
            companionEvent.type === "CFSF_UPDATE" ||
            companionEvent.type === "CFSF_ADD" ||
            companionEvent.type === "CFSF_DELETE"
          ) {
            const dmnRunnerPersistenceJson: DmnRunnerPersistenceJson =
              dmnRunnerPersistenceService.parseDmnRunnerPersistenceJson(companionEvent.content);
            dispatchDmnRunnerPersistenceJson({
              dmnRunnerPersistenceService,
              workspaceId: workspaceId,
              workspaceFileRelativePath: workspaceFileRelativePath,
              type: DmnRunnerPersistenceReducerActionType.DEFAULT,
              newPersistenceJson: dmnRunnerPersistenceJson,
            });
          }
        };

        return () => {
          console.debug(`Unsubscribing to ${dmnRunnerPersistenceJsonFileUniqueId}`);
          broadcastChannel.close();
        };
      },
      [dmnRunnerPersistenceService, workspaceId, workspaceFileRelativePath]
    )
  );

  // On first render load the persistence json;
  useCancelableEffect(
    useCallback(
      ({ canceled }) => {
        if (!workspaceId || !workspaceFileRelativePath || !dmnRunnerPersistenceService) {
          return;
        }

        dmnRunnerPersistenceService.companionFsService
          .get({ workspaceId: workspaceId, workspaceFileRelativePath: workspaceFileRelativePath })
          .then((persistenceJson) => {
            if (canceled.get()) {
              return;
            }
            // If persistence doesn't exist, create then.
            if (!persistenceJson) {
              const newDmnRunnerPersistenceJson = deepCopyPersistenceJson(DEFAULT_DMN_RUNNER_PERSISTENCE_JSON);
              newDmnRunnerPersistenceJson.inputs = [{ id: generateUuid() }];
              dmnRunnerPersistenceService.companionFsService.createOrOverwrite(
                { workspaceId: workspaceId, workspaceFileRelativePath: workspaceFileRelativePath },
                JSON.stringify(newDmnRunnerPersistenceJson)
              );
              return;
            }

            persistenceJson.getFileContents().then((content) => {
              if (canceled.get()) {
                return;
              }
              const dmnRunnerPersistenceJson = dmnRunnerPersistenceService.parseDmnRunnerPersistenceJson(
                decoder.decode(content)
              );
              dispatchDmnRunnerPersistenceJson({
                dmnRunnerPersistenceService,
                workspaceId: workspaceId,
                workspaceFileRelativePath: workspaceFileRelativePath,
                type: DmnRunnerPersistenceReducerActionType.DEFAULT,
                newPersistenceJson: dmnRunnerPersistenceJson,
              });
            });
          });
      },
      [dmnRunnerPersistenceService, workspaceId, workspaceFileRelativePath]
    )
  );

  return {
    dmnRunnerPersistenceJson,
    dispatchDmnRunnerPersistenceJson,
  };
}
