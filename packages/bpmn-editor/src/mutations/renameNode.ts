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

import { BPMN20__tDefinitions } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Normalized } from "../normalization/normalize";
import { addOrGetProcessAndDiagramElements } from "./addOrGetProcessAndDiagramElements";
import { visitFlowElementsAndArtifacts } from "./_elementVisitor";

export function renameFlowElement({
  definitions,
  newName,
  id,
}: {
  definitions: Normalized<BPMN20__tDefinitions>;
  newName: string;
  id: string;
}) {
  const { process } = addOrGetProcessAndDiagramElements({ definitions });

  visitFlowElementsAndArtifacts(process, ({ element }) => {
    if (element["@_id"] === id) {
      if (
        element.__$$element === "association" ||
        element.__$$element === "group" ||
        element.__$$element === "textAnnotation"
      ) {
        throw new Error(
          `BPMN MUTATION: Element with id ${id} is not a flowElement, but rather a ${element.__$$element}`
        );
      }

      const trimmedNewName = newName.trim();
      element["@_name"] = trimmedNewName;
      return false; // Will stop visiting.
    }
  });
}

export function renameLane({
  definitions,
  newName,
  id,
}: {
  definitions: Normalized<BPMN20__tDefinitions>;
  newName: string;
  id: string;
}) {
  const { process } = addOrGetProcessAndDiagramElements({ definitions });

  const trimmedNewName = newName.trim();

  for (let i = 0; i < (process.laneSet ?? []).length; i++) {
    const laneSet = process.laneSet![i];

    for (let j = 0; j < (laneSet.lane ?? []).length; j++) {
      const lane = laneSet.lane![i];
      if (lane["@_id"] === id) {
        lane["@_name"] = trimmedNewName;
        break;
      }

      for (let j = 0; j < (lane.childLaneSet?.lane ?? []).length; j++) {
        const childLane = lane.childLaneSet!.lane![i];
        if (childLane["@_id"] === id) {
          childLane["@_name"] = trimmedNewName;
          break;
        }
      }
    }
  }
}

export function updateTextAnnotation({
  definitions,
  newText,
  id,
}: {
  definitions: Normalized<BPMN20__tDefinitions>;
  newText: string;
  id: string;
}) {
  const { process } = addOrGetProcessAndDiagramElements({ definitions });

  visitFlowElementsAndArtifacts(process, ({ element }) => {
    if (element["@_id"] === id) {
      if (element.__$$element !== "textAnnotation") {
        throw new Error(
          `BPMN MUTATION: Element with id ${id} is not a textAnnotation, but rather a ${element.__$$element}`
        );
      }

      element.text = { __$$text: newText };
      return false; // Will stop visiting.
    }
  });
}
