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

import { BPMN20__tTextAnnotation } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import * as React from "react";
import { updateTextAnnotation } from "../../mutations/renameNode";
import { Normalized } from "../../normalization/normalize";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea";
import { ClipboardCopy } from "@patternfly/react-core/dist/js/components/ClipboardCopy";
import { PropertiesPanelHeaderFormSection } from "./_PropertiesPanelHeaderFormSection";
import { TextAnnotationIcon } from "../../diagram/nodes/NodeIcons";

export function TextAnnotationProperties({
  textAnnotation,
}: {
  textAnnotation: Normalized<BPMN20__tTextAnnotation> & { __$$element: "textAnnotation" };
}) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const settings = useBpmnEditorStore((s) => s.settings);

  return (
    <PropertiesPanelHeaderFormSection title={"Text Annotation"} icon={<TextAnnotationIcon />}>
      <FormGroup label="Format">
        <TextInput
          aria-label={"Format"}
          type={"text"}
          isDisabled={settings.isReadOnly}
          value={textAnnotation["@_textFormat"]}
          placeholder={"Enter a text format..."}
          onChange={(newTextFormat) => {
            bpmnEditorStoreApi.setState((s) => {
              updateTextAnnotation({
                definitions: s.bpmn.model.definitions,
                newTextAnnotation: { "@_textFormat": newTextFormat },
                id: textAnnotation["@_id"]!,
              });
            });
          }}
        />
      </FormGroup>

      <FormGroup label="Text">
        <TextArea
          aria-label={"Text"}
          type={"text"}
          isDisabled={settings.isReadOnly}
          value={textAnnotation.text?.__$$text}
          onChange={(newText) => {
            bpmnEditorStoreApi.setState((s) => {
              updateTextAnnotation({
                definitions: s.bpmn.model.definitions,
                newTextAnnotation: { text: { __$$text: newText } },
                id: textAnnotation["@_id"]!,
              });
            });
          }}
          placeholder={"Enter text..."}
          style={{ resize: "vertical", minHeight: "40px" }}
          rows={3}
        />
      </FormGroup>

      <FormGroup label="ID">
        <ClipboardCopy
          isReadOnly={settings.isReadOnly}
          hoverTip="Copy"
          clickTip="Copied"
          onChange={(newId: string) => {
            bpmnEditorStoreApi.setState((s) => {
              updateTextAnnotation({
                definitions: s.bpmn.model.definitions,
                newTextAnnotation: { "@_id": newId },
                id: textAnnotation["@_id"]!,
              });
            });
          }}
        >
          {textAnnotation["@_id"]}
        </ClipboardCopy>
      </FormGroup>
    </PropertiesPanelHeaderFormSection>
  );
}
