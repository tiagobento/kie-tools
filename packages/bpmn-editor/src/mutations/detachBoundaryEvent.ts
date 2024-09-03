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
import { addOrGetProcessAndDiagramElements } from "./addOrGetProcessAndDiagramElements";
import { FoundFlowElement, visitFlowElements } from "./_flowElementVisitor";

export function detachBoundaryEvent({
  definitions,
  __readonly_eventId,
}: {
  definitions: State["bpmn"]["model"]["definitions"];
  __readonly_eventId: string | undefined;
}) {
  const { process } = addOrGetProcessAndDiagramElements({ definitions });

  if (__readonly_eventId === undefined) {
    throw new Error("Event needs to have an ID.");
  }

  let boundaryEvent:
    | undefined
    | FoundFlowElement<
        Normalized<ElementFilter<Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>, "boundaryEvent">>
      >;

  let activity:
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
      if (flowElement.__$$element === "boundaryEvent") {
        boundaryEvent = { owner, index, flowElement };
      } else {
        throw new Error("Provided id is not associated with a Boundary Event.");
      }
    }
  });

  if (!boundaryEvent) {
    throw new Error("Boundary Event not found. Aborting.");
  }

  visitFlowElements(process, ({ flowElement, index, owner }) => {
    if (flowElement["@_id"] === boundaryEvent?.flowElement["@_attachedToRef"]) {
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
        activity = { owner, index, flowElement };
      } else {
        throw new Error("'attachedToRef' is not associated with an Activity.");
      }
    }
  });

  if (!activity) {
    throw new Error("Target Activity not found. Aborting.");
  }

  boundaryEvent.owner.flowElement?.splice(boundaryEvent.index, 1);

  process.flowElement?.push({
    "@_id": boundaryEvent.flowElement["@_id"],
    __$$element: "intermediateCatchEvent",
    eventDefinition: boundaryEvent.flowElement.eventDefinition,
  });
}
