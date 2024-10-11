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

import { BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import * as React from "react";
import { Normalized } from "../../normalization/normalize";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import {
  parseBpmn20Drools10MetaData,
  setBpmn20Drools10MetaData,
} from "@kie-tools/bpmn-marshaller/dist/drools-extension-metaData";
import { Checkbox } from "@patternfly/react-core/dist/js/components/Checkbox";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { useBpmnEditorStoreApi } from "../../store/StoreContext";
import "./SubProcessProperties.css";
import { SlaDueDateInput } from "../slaDueDate/SlaDueDateInput";

export type WithSubProcessProperties = Normalized<
  ElementFilter<
    Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
    "callActivity" | "subProcess" | "transaction" | "adHocSubProcess"
  >
>;

export function SubProcessProperties({ p }: { p: WithSubProcessProperties }) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  return (
    <>
      <SlaDueDateInput element={p} />

      <FormGroup
        fieldId="kie-bpmn-editor--properties-panel--async"
        // helperText={"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod."} // FIXME: Tiago -> Description
      >
        <Checkbox
          label="Async"
          id="kie-bpmn-editor--properties-panel--async"
          name="is-async"
          aria-label="Async"
          isChecked={(parseBpmn20Drools10MetaData(p).get("customAsync") ?? "false") === "true"}
          onChange={(checked) => {
            bpmnEditorStoreApi.setState((s) => {
              const { process } = addOrGetProcessAndDiagramElements({
                definitions: s.bpmn.model.definitions,
              });
              visitFlowElementsAndArtifacts(process, ({ element }) => {
                if (element["@_id"] === p["@_id"] && element.__$$element === p.__$$element) {
                  setBpmn20Drools10MetaData(element, "customAsync", `${checked}`);
                }
              });
            });
          }}
        />
      </FormGroup>
    </>
  );
}
