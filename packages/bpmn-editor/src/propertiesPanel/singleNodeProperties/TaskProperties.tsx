/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { BPMN20__tTask } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { ClipboardCopy } from "@patternfly/react-core/dist/js/components/ClipboardCopy";
import { FormGroup, FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import * as React from "react";
import { updateFlowElement } from "../../mutations/renameNode";
import { Normalized } from "../../normalization/normalize";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";

export function TaskProperties({ task }: { task: Normalized<BPMN20__tTask> & { __$$element: "task" } }) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const settings = useBpmnEditorStore((s) => s.settings);

  const onNameChanged = React.useCallback(
    (newName: string) => {
      bpmnEditorStoreApi.setState((s) => {
        updateFlowElement({
          definitions: s.bpmn.model.definitions,
          newFlowElement: { "@_name": newName.trim() },
          id: task["@_id"],
        });
      });
    },
    [task, bpmnEditorStoreApi]
  );

  return (
    <FormSection>
      <FormGroup label="Name">
        <TextInput
          isDisabled={settings.isReadOnly}
          id={task["@_id"]}
          name={task["@_name"]}
          value={task["@_name"]}
          onChange={(newName) => {
            bpmnEditorStoreApi.setState((state) => {
              updateFlowElement({
                definitions: state.bpmn.model.definitions,
                id: task["@_id"],
                newFlowElement: {
                  "@_name": newName,
                },
              });
            });
          }}
        />
      </FormGroup>

      <FormGroup label="Documentation">
        <TextArea
          aria-label={"Documentation"}
          type={"text"}
          isDisabled={settings.isReadOnly}
          value={""} // FIXME: Tiago
          onChange={(newDocumentation) => {
            bpmnEditorStoreApi.setState((state) => {
              updateFlowElement({
                definitions: state.bpmn.model.definitions,
                id: task["@_id"],
                newFlowElement: {
                  /** FIXME: Tiago */
                },
              });
            });
          }}
          placeholder={"Enter documentation..."}
          style={{ resize: "vertical", minHeight: "40px" }}
          rows={6}
        />
      </FormGroup>

      <FormGroup label="ID">
        <ClipboardCopy isReadOnly={settings.isReadOnly} hoverTip="Copy" clickTip="Copied">
          {task["@_id"]}
        </ClipboardCopy>
      </FormGroup>
    </FormSection>
  );
}
