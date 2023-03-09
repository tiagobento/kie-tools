/*
 * Copyright 2021 Red Hat, Inc. and/or its affiliates.
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
import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspaces, WorkspaceFile } from "@kie-tools-core/workspaces-git-fs/dist/context/WorkspacesContext";
import { DmnRunnerMode, DmnRunnerStatus } from "./DmnRunnerStatus";
import { DmnRunnerDispatchContext, DmnRunnerStateContext } from "./DmnRunnerContext";
import { KieSandboxExtendedServicesModelPayload } from "../../kieSandboxExtendedServices/KieSandboxExtendedServicesClient";
import { KieSandboxExtendedServicesStatus } from "../../kieSandboxExtendedServices/KieSandboxExtendedServicesStatus";
import { usePrevious } from "@kie-tools-core/react-hooks/dist/usePrevious";
import { useExtendedServices } from "../../kieSandboxExtendedServices/KieSandboxExtendedServicesContext";
import { DmnSchema, InputRow } from "@kie-tools/form-dmn";
import { useDmnRunnerPersistence } from "../../dmnRunnerPersistence/DmnRunnerPersistenceHook";
import { DmnLanguageService } from "@kie-tools/dmn-language-service";
import { decoder } from "@kie-tools-core/workspaces-git-fs/dist/encoderdecoder/EncoderDecoder";
import { EMPTY_DMN_RUNNER_INPUTS } from "../../dmnRunnerPersistence/DmnRunnerPersistenceService";
import {
  generateUuid,
  DEFAULT_DMN_RUNNER_CONFIG_INPUT,
  deepCopyPersistenceJson,
} from "../../dmnRunnerPersistence/DmnRunnerPersistenceService";

interface Props {
  isEditorReady?: boolean;
  workspaceFile: WorkspaceFile;
  dmnLanguageService?: DmnLanguageService;
}

export function DmnRunnerProvider(props: PropsWithChildren<Props>) {
  const extendedServices = useExtendedServices();
  const workspaces = useWorkspaces();

  const [isVisible, setVisible] = useState<boolean>(false);
  useEffect(() => {
    if (props.isEditorReady) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [props.isEditorReady]);

  const { dmnRunnerPersistenceJson, setDmnRunnerPersistenceJson } = useDmnRunnerPersistence(props.workspaceFile);
  const [error, setError] = useState(false);
  const [jsonSchema, setJsonSchema] = useState<DmnSchema | undefined>(undefined);
  const [isExpanded, setExpanded] = useState(false);
  const [currentInputRowIndex, setCurrentInputRowIndex] = useState<number>(0);

  const status = useMemo(() => {
    return isExpanded ? DmnRunnerStatus.AVAILABLE : DmnRunnerStatus.UNAVAILABLE;
  }, [isExpanded]);

  const preparePayload = useCallback(
    async (formData?: InputRow) => {
      const fileContent = await workspaces.getFileContent({
        workspaceId: props.workspaceFile.workspaceId,
        relativePath: props.workspaceFile.relativePath,
      });

      const decodedFileContent = decoder.decode(fileContent);
      const importedModelsResources =
        (await props.dmnLanguageService?.getAllImportedModelsResources([decodedFileContent])) ?? [];
      const dmnResources = [
        { content: decodedFileContent, relativePath: props.workspaceFile.relativePath },
        ...importedModelsResources,
      ].map((resource) => ({
        URI: resource.relativePath,
        content: resource.content ?? "",
      }));

      return {
        mainURI: props.workspaceFile.relativePath,
        resources: dmnResources,
        context: formData,
      } as KieSandboxExtendedServicesModelPayload;
    },
    [props.workspaceFile, workspaces, props.dmnLanguageService]
  );

  useEffect(() => {
    if (
      props.workspaceFile.extension !== "dmn" ||
      extendedServices.status !== KieSandboxExtendedServicesStatus.RUNNING
    ) {
      setExpanded(false);
      return;
    }

    preparePayload()
      .then((payload) => {
        extendedServices.client.formSchema(payload).then((jsonSchema) => {
          setJsonSchema(jsonSchema);
        });
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, [extendedServices.status, extendedServices.client, props.workspaceFile.extension, preparePayload]);

  const prevKieSandboxExtendedServicesStatus = usePrevious(extendedServices.status);
  useEffect(() => {
    if (props.workspaceFile.extension !== "dmn") {
      return;
    }

    if (
      extendedServices.status === KieSandboxExtendedServicesStatus.STOPPED ||
      extendedServices.status === KieSandboxExtendedServicesStatus.NOT_RUNNING
    ) {
      setExpanded(false);
    }
  }, [prevKieSandboxExtendedServicesStatus, extendedServices.status, props.workspaceFile.extension]);

  const onRowAdded = useCallback(
    (args: { beforeIndex: number }) => {
      setDmnRunnerPersistenceJson((previousDmnRunnerPersistenceJson) => {
        const n = deepCopyPersistenceJson(previousDmnRunnerPersistenceJson);
        // add default value;
        const newInputsRow = Object.entries(n.inputs[args.beforeIndex - 1]).reduce(
          (acc, [key, value]) => {
            if (key === "id") {
              return acc;
            }
            if (typeof value === "string") {
              acc[key] = "";
            } else if (typeof value === "number") {
              acc[key] = 0;
            } else if (typeof value === "boolean") {
              acc[key] = false;
            } else if (Array.isArray(value)) {
              acc[key] = [];
            } else if (typeof value === "object") {
              acc[key] = {};
            }
            return acc;
          },
          { id: generateUuid() } as any
        );

        // add default configs;
        const newConfigInputsRow = Object.entries(n.inputs[args.beforeIndex - 1]).reduce((acc, [key, _]) => {
          if (key === "id") {
            return acc;
          }
          acc[key] = { ...DEFAULT_DMN_RUNNER_CONFIG_INPUT };
          return acc;
        }, {} as any);

        n.inputs.splice(args.beforeIndex, 0, newInputsRow);
        n.configs.inputs.splice(args.beforeIndex, 0, newConfigInputsRow);
        setCurrentInputRowIndex(args.beforeIndex);

        return n;
      });
    },
    [setDmnRunnerPersistenceJson]
  );

  const onRowDuplicated = useCallback(
    (args: { rowIndex: number }) => {
      setDmnRunnerPersistenceJson((previousDmnRunnerPersistenceJson) => {
        const n = deepCopyPersistenceJson(previousDmnRunnerPersistenceJson);

        // duplicate inputs
        n.inputs.splice(args.rowIndex, 0, {
          ...JSON.parse(JSON.stringify(previousDmnRunnerPersistenceJson.inputs[args.rowIndex])),
          id: generateUuid(),
        });

        // duplicate configs
        n.configs.inputs.splice(args.rowIndex, 0, {
          ...JSON.parse(JSON.stringify(previousDmnRunnerPersistenceJson.configs.inputs[args.rowIndex])),
          id: generateUuid(),
        });

        return n;
      });
    },
    [setDmnRunnerPersistenceJson]
  );

  const onRowReset = useCallback(
    (args: { rowIndex: number }) => {
      setDmnRunnerPersistenceJson((previousDmnRunnerPersistenceJson) => {
        const n = deepCopyPersistenceJson(previousDmnRunnerPersistenceJson);

        // reset to defaul values;
        const resetedInputRows = Object.entries(n.inputs[args.rowIndex]).reduce(
          (acc, [key, value]) => {
            if (key === "id") {
              return acc;
            }
            if (typeof value === "string") {
              acc[key] = "";
            } else if (typeof value === "number") {
              acc[key] = 0;
            } else if (typeof value === "boolean") {
              acc[key] = false;
            } else if (Array.isArray(value)) {
              acc[key] = [];
            } else if (value === "object") {
              acc[key] = {};
            }
            return acc;
          },
          { id: generateUuid() } as any
        );

        // reset default configs;
        const newConfigInputsRow = Object.entries(n.inputs[args.rowIndex]).reduce((acc, [key, _]) => {
          if (key === "id") {
            return acc;
          }
          acc[key] = { ...DEFAULT_DMN_RUNNER_CONFIG_INPUT };
          return acc;
        }, {} as any);

        n.inputs[args.rowIndex] = resetedInputRows;
        n.configs.inputs[args.rowIndex] = newConfigInputsRow;

        return n;
      });
    },
    [setDmnRunnerPersistenceJson]
  );

  const onRowDeleted = useCallback(
    (args: { rowIndex: number }) => {
      setDmnRunnerPersistenceJson((previousDmnRunnerPersistenceJson) => {
        const n = deepCopyPersistenceJson(previousDmnRunnerPersistenceJson);

        // delete input row;
        n.inputs.splice(args.rowIndex, 1);

        // re-generate ids for rows above the deleted one
        n.inputs.forEach((e, i, newInputRows) => {
          if (i >= args.rowIndex) {
            newInputRows[i] = { ...e, id: generateUuid() };
          }
        });

        // delete config of input;
        n.configs.inputs.splice(args.rowIndex, 1);

        return n;
      });
    },
    [setDmnRunnerPersistenceJson]
  );

  const dmnRunnerDispatch = useMemo(
    () => ({
      onRowAdded,
      onRowDuplicated,
      onRowReset,
      onRowDeleted,
      preparePayload,
      setCurrentInputRowIndex,
      setError,
      setExpanded,
      setDmnRunnerPersistenceJson,
    }),
    [
      onRowAdded,
      onRowDuplicated,
      onRowReset,
      onRowDeleted,
      preparePayload,
      setCurrentInputRowIndex,
      setError,
      setExpanded,
      setDmnRunnerPersistenceJson,
    ]
  );

  const dmnRunnerState = useMemo(
    () => ({
      currentInputRowIndex,
      error,
      dmnRunnerPersistenceJson,
      inputs: dmnRunnerPersistenceJson?.inputs ?? EMPTY_DMN_RUNNER_INPUTS,
      isExpanded,
      isVisible,
      jsonSchema,
      mode: dmnRunnerPersistenceJson?.configs?.mode ?? DmnRunnerMode.FORM,
      status,
    }),
    [error, currentInputRowIndex, dmnRunnerPersistenceJson, isExpanded, isVisible, jsonSchema, status]
  );

  return (
    <>
      <DmnRunnerStateContext.Provider value={dmnRunnerState}>
        <DmnRunnerDispatchContext.Provider value={dmnRunnerDispatch}>
          {props.children}
        </DmnRunnerDispatchContext.Provider>
      </DmnRunnerStateContext.Provider>
    </>
  );
}
