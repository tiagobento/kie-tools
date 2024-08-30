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
import { ElementExclusion } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { Normalized } from "../normalization/normalize";
import { State } from "../store/Store";
import { addOrGetProcessAndDiagramElements } from "./addOrGetProcessAndDiagramElements";

export function deleteNodesFromSubProcess({
  definitions,
  __readonly_subProcessId,
  __readonly_nodeIds,
}: {
  definitions: State["bpmn"]["model"]["definitions"];
  __readonly_subProcessId: string | undefined;
  __readonly_nodeIds: string[];
}) {
  const { process } = addOrGetProcessAndDiagramElements({ definitions });

  const flowElementsToMove: Normalized<
    ElementExclusion<Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>, "sequenceFlow">
  >[] = [];
  const artifactsToMove: Normalized<
    ElementExclusion<Unpacked<NonNullable<BPMN20__tProcess["artifact"]>>, "association">
  >[] = [];

  const subProcess = process.flowElement?.find((s) => s["@_id"] === __readonly_subProcessId);
  if (
    !(
      subProcess?.__$$element === "subProcess" ||
      subProcess?.__$$element === "adHocSubProcess" ||
      subProcess?.__$$element === "transaction"
    )
  ) {
    // Throw new error();
    return;
  }

  for (const nodeId of __readonly_nodeIds) {
    flowElementsToMove.push(
      ...((subProcess.flowElement?.splice(
        subProcess.flowElement?.findIndex((f) => f["@_id"] === nodeId),
        1
      ) ?? []) as typeof flowElementsToMove)
    );

    artifactsToMove.push(
      ...((subProcess.artifact?.splice(
        subProcess.artifact?.findIndex((f) => f["@_id"] === nodeId),
        1
      ) ?? []) as typeof artifactsToMove)
    );
  }

  process.flowElement ??= [];
  process.flowElement.push(...flowElementsToMove);
  process.artifact ??= [];
  process.artifact.push(...artifactsToMove);
}
