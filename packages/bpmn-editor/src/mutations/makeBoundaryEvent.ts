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
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { Normalized } from "../normalization/normalize";
import { State } from "../store/Store";
import { FoundFlowElement, visitFlowElements } from "./_flowElementVisitor";
import { addOrGetProcessAndDiagramElements } from "./addOrGetProcessAndDiagramElements";

export function makeBoundaryEvent({
  definitions,
  __readonly_targetActivityId,
  __readonly_eventId,
}: {
  definitions: State["bpmn"]["model"]["definitions"];
  __readonly_targetActivityId: string | undefined;
  __readonly_eventId: string | undefined;
}) {
  const { process } = addOrGetProcessAndDiagramElements({ definitions });

  if (__readonly_targetActivityId === undefined || __readonly_eventId === undefined) {
    throw new Error("Event or Target Activity need to have an ID.");
  }

  let intermediateCatchEvent:
    | undefined
    | FoundFlowElement<
        Normalized<ElementFilter<Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>, "intermediateCatchEvent">>
      >;

  let targetActivity:
    | undefined
    | FoundFlowElement<
        Normalized<
          ElementFilter<
            Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
            | "task"
            | "businessRuleTask"
            | "userTask"
            | "scriptTask"
            | "serviceTask"
            | "subProcess"
            | "adHocSubProcess"
            | "transaction"
          >
        >
      >;

  visitFlowElements(process, ({ flowElement, index, owner }) => {
    if (flowElement["@_id"] === __readonly_eventId) {
      if (flowElement.__$$element === "intermediateCatchEvent") {
        intermediateCatchEvent = { owner, index, flowElement };
      } else {
        throw new Error("Provided id is not associated with an Intermediate Catch Event");
      }
    }

    if (flowElement["@_id"] === __readonly_targetActivityId) {
      if (
        flowElement.__$$element === "task" ||
        flowElement.__$$element === "businessRuleTask" ||
        flowElement.__$$element === "userTask" ||
        flowElement.__$$element === "scriptTask" ||
        flowElement.__$$element === "serviceTask" ||
        flowElement.__$$element === "subProcess" ||
        flowElement.__$$element === "adHocSubProcess" ||
        flowElement.__$$element === "transaction"
      ) {
        targetActivity = { owner, index, flowElement };
      } else {
        throw new Error("Provided id is not associated with an Activity.");
      }
    }
  });

  if (!targetActivity) {
    throw new Error("Target Activity not found. Aborting.");
  }

  if (!intermediateCatchEvent) {
    throw new Error("Can't find Intermediate Catch Event to transform into a Boundary Event. Aborting.");
  }

  // If we found an intermediate catch event, we need to "transform" it into a boundary event.
  intermediateCatchEvent.owner.flowElement?.splice(intermediateCatchEvent.index, 1);
  targetActivity.owner.flowElement?.push({
    __$$element: "boundaryEvent",
    "@_id": intermediateCatchEvent.flowElement["@_id"],
    "@_attachedToRef": targetActivity.flowElement["@_id"],
    eventDefinition: intermediateCatchEvent.flowElement.eventDefinition,
  });
}
