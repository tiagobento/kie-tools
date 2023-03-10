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
import { useCallback, useEffect, useState } from "react";
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
} from "./DmnRunnerPersistenceService";
import isEqual from "lodash/isEqual";
import { DEFAULT_DMN_RUNNER_PERSISTENCE_JSON } from "./DmnRunnerPersistenceService";

interface DmnRunnerPersistenceHook {
  dmnRunnerPersistenceJson: DmnRunnerPersistenceJson;
  setDmnRunnerPersistenceJson: React.Dispatch<React.SetStateAction<DmnRunnerPersistenceJson>>;
}

export function useDmnRunnerPersistence(workspaceFile: WorkspaceFile): DmnRunnerPersistenceHook {
  const [dmnRunnerPersistenceJson, setDmnRunnerPersistenceJson] = useState<DmnRunnerPersistenceJson>(
    EMPTY_DMN_RUNNER_PERSISTANCE_JSON
  );
  const { dmnRunnerPersistenceService } = useDmnRunnerPersistenceDispatch();

  // When another TAB updates the FS, it should sync up
  useCancelableEffect(
    useCallback(
      ({ canceled }) => {
        if (!workspaceFile.relativePath || !workspaceFile.workspaceId) {
          return;
        }

        const dmnRunnerPersistenceJsonFileUniqueId =
          dmnRunnerPersistenceService.companionFsService.getUniqueFileIdentifier({
            workspaceId: workspaceFile.workspaceId,
            workspaceFileRelativePath: workspaceFile.relativePath,
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
            setDmnRunnerPersistenceJson((previousDmnRunnerPersistenceJson) => {
              // Triggered by the tab; shouldn't update; safe comparison;
              if (isEqual(JSON.parse(companionEvent.content), previousDmnRunnerPersistenceJson)) {
                return previousDmnRunnerPersistenceJson;
              }
              // Triggered by the other tab; should update;
              return dmnRunnerPersistenceService.parseDmnRunnerPersistenceJson(companionEvent.content);
            });
          }
        };

        return () => {
          console.debug(`Unsubscribing to ${dmnRunnerPersistenceJsonFileUniqueId}`);
          broadcastChannel.close();
        };
      },
      [dmnRunnerPersistenceService, workspaceFile, setDmnRunnerPersistenceJson]
    )
  );

  // On first render load the persistence json;
  useCancelableEffect(
    useCallback(
      ({ canceled }) => {
        if (!workspaceFile || !dmnRunnerPersistenceService) {
          return;
        }

        dmnRunnerPersistenceService.companionFsService
          .get({ workspaceId: workspaceFile.workspaceId, workspaceFileRelativePath: workspaceFile.relativePath })
          .then((persistenceJson) => {
            if (canceled.get()) {
              return;
            }
            // If persistence doesn't exist, create then.
            if (!persistenceJson) {
              const newDmnRunnerPersistenceJson = deepCopyPersistenceJson(DEFAULT_DMN_RUNNER_PERSISTENCE_JSON);
              newDmnRunnerPersistenceJson.inputs = [{ id: generateUuid() }];
              dmnRunnerPersistenceService.companionFsService.createOrOverwrite(
                { workspaceId: workspaceFile.workspaceId, workspaceFileRelativePath: workspaceFile.relativePath },
                JSON.stringify(newDmnRunnerPersistenceJson)
              );
              return;
            }

            persistenceJson.getFileContents().then((content) => {
              if (canceled.get()) {
                return;
              }
              const dmnRunnerJson = decoder.decode(content);
              setDmnRunnerPersistenceJson(dmnRunnerPersistenceService.parseDmnRunnerPersistenceJson(dmnRunnerJson));
            });
          });
      },
      [dmnRunnerPersistenceService, workspaceFile, setDmnRunnerPersistenceJson]
    )
  );

  // Updating the dmnRunnerPersistenceJson should update the FS
  useEffect(() => {
    if (!workspaceFile.relativePath || !workspaceFile.workspaceId) {
      return;
    }

    // safe comparison, it compares to an array with an empty object;
    // first render;
    if (JSON.stringify(dmnRunnerPersistenceJson) === JSON.stringify(EMPTY_DMN_RUNNER_PERSISTANCE_JSON)) {
      return;
    }

    dmnRunnerPersistenceService.companionFsService.update(
      {
        workspaceId: workspaceFile.workspaceId,
        workspaceFileRelativePath: workspaceFile.relativePath,
      },
      JSON.stringify(dmnRunnerPersistenceJson)
    );
  }, [dmnRunnerPersistenceService, workspaceFile.workspaceId, workspaceFile.relativePath, dmnRunnerPersistenceJson]);

  return {
    dmnRunnerPersistenceJson,
    setDmnRunnerPersistenceJson,
  };
}
