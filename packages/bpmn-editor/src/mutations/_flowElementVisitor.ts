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

import { BPMN20__tDefinitions, BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { Normalized } from "../normalization/normalize";

export type FoundFlowElement<F> = {
  owner: FlowElementOwner;
  flowElement: F;
  index: number;
};

type FlowElementOwner = Normalized<
  | ElementFilter<Unpacked<NonNullable<BPMN20__tDefinitions["rootElement"]>>, "process">
  | ElementFilter<
      Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
      "subProcess" | "adHocSubProcess" | "transaction"
    >
>;

type FlowElementVisitorArgs = {
  flowElement: Normalized<Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>>;
  index: number;
  owner: FlowElementOwner;
};

export function visitFlowElements(
  process: Normalized<ElementFilter<Unpacked<NonNullable<BPMN20__tDefinitions["rootElement"]>>, "process">>,
  visitor: (args: FlowElementVisitorArgs) => void
) {
  for (let i = 0; i < (process.flowElement ?? []).length; i++) {
    const flowElement = process.flowElement![i];
    visitor({ flowElement, index: i, owner: process });
    if (
      flowElement.__$$element === "subProcess" ||
      flowElement.__$$element === "adHocSubProcess" ||
      flowElement.__$$element === "transaction"
    ) {
      for (let j = 0; j < (flowElement.flowElement ?? []).length; j++) {
        const nestedFlowElement = flowElement.flowElement![j];
        visitor({ flowElement: nestedFlowElement, index: j, owner: flowElement });
      }
    }
  }
}
