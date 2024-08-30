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

import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { Normalized } from "../normalization/normalize";
import { State } from "../store/Store";
import { addOrGetProcessAndDiagramElements } from "./addOrGetProcessAndDiagramElements";
import { ElementExclusion, ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { BPMN20__tDefinitions, BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";

type Owner = Normalized<
  | ElementFilter<Unpacked<NonNullable<BPMN20__tDefinitions["rootElement"]>>, "process">
  | ElementFilter<
      Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
      "subProcess" | "adHocSubProcess" | "transaction"
    >
>;

type FoundElement<F> = {
  owner: Owner;
  flowElement: F;
  index: number;
};

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
    | FoundElement<
        Normalized<ElementFilter<Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>, "intermediateCatchEvent">>
      >;

  let boundaryEvent:
    | undefined
    | FoundElement<Normalized<ElementFilter<Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>, "boundaryEvent">>>;

  let targetActivity:
    | undefined
    | FoundElement<
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

  function findTargetActivityAndEvent({
    flowElement,
    index,
    owner,
  }: {
    flowElement: Normalized<Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>>;
    index: number;
    owner: Owner;
  }) {
    if (flowElement["@_id"] === __readonly_eventId) {
      if (flowElement.__$$element === "intermediateCatchEvent") {
        intermediateCatchEvent = { owner, index, flowElement };
      } else if (flowElement.__$$element === "boundaryEvent") {
        boundaryEvent = { owner, index, flowElement };
      } else {
        throw new Error("Provided id is not associated with an Intermediate Catch Event nor Boundary Event.");
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
  }

  for (let i = 0; i < (process.flowElement ?? []).length; i++) {
    const flowElement = process.flowElement![i];
    findTargetActivityAndEvent({ flowElement, index: i, owner: process });
    if (
      flowElement.__$$element === "subProcess" ||
      flowElement.__$$element === "adHocSubProcess" ||
      flowElement.__$$element === "transaction"
    ) {
      for (let j = 0; j < (flowElement.flowElement ?? []).length; j++) {
        const nestedFlowElement = flowElement.flowElement![j];
        findTargetActivityAndEvent({ flowElement: nestedFlowElement, index: i, owner: flowElement });
      }
    }
  }

  if (!targetActivity) {
    throw new Error("Target Activity not found. Aborting.");
  }

  // Only one of those are allowed.
  if ((!boundaryEvent && !intermediateCatchEvent) || (boundaryEvent && intermediateCatchEvent)) {
    throw new Error("Two or none events found. Aborting.");
  }

  if (boundaryEvent) {
    boundaryEvent.flowElement["@_attachedToRef"] = targetActivity.flowElement["@_id"];

    // Only delete and add if different, to avoid unnecessary changes.
    if (boundaryEvent.owner !== targetActivity.owner) {
      boundaryEvent.owner.flowElement?.splice(boundaryEvent.index, 1);
      targetActivity.owner.flowElement?.push(boundaryEvent.flowElement);
    }
  }

  // If we found an intermediate catch event, we need to "transform" it into a boundary event.
  else if (intermediateCatchEvent) {
    intermediateCatchEvent.owner.flowElement?.splice(intermediateCatchEvent.index, 1);
    targetActivity.owner.flowElement?.push({
      __$$element: "boundaryEvent",
      "@_id": intermediateCatchEvent.flowElement["@_id"],
      "@_attachedToRef": targetActivity.flowElement["@_id"],
      eventDefinition: intermediateCatchEvent.flowElement.eventDefinition,
    });
  } else {
    throw new Error("No event found. Aborting.");
  }
}
