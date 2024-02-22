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

import { DMN15__tDecisionService } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { parseXmlQName } from "@kie-tools/xml-parser-ts/dist/qNames";
import { DrgEdge } from "../diagram/graph/graph";
import { Computed, State } from "../store/Store";
import { xmlHrefToQName } from "../xml/xmlHrefToQName";
import { buildXmlHref, parseXmlHref } from "../xml/xmlHrefs";
import { NodeNature } from "./NodeNature";
import { addOrGetDrd } from "./addOrGetDrd";
import { NodeDeletionMode, deleteNode } from "./deleteNode";

export function collapseDecisionService({
  definitions,
  drdIndex,
  decisionService,
  thisDmnsNamespace,
  decisionServiceNamespace,
  shapeIndex,
  drgEdges,
  externalDmnsIndex,
}: {
  definitions: State["dmn"]["model"]["definitions"];
  drdIndex: number;
  decisionService: DMN15__tDecisionService;
  thisDmnsNamespace: string;
  decisionServiceNamespace: string;
  shapeIndex: number;
  externalDmnsIndex: ReturnType<Computed["getExternalModelTypesByNamespace"]>["dmns"];
  drgEdges: DrgEdge[];
}) {
  const { diagramElements } = addOrGetDrd({ definitions, drdIndex });
  const shape = diagramElements[shapeIndex];
  if (shape.__$$element !== "dmndi:DMNShape") {
    throw new Error(
      `DMN MUTATION: Can't collapse Decision Service because element with index ${shapeIndex} is not a DMNShape.`
    );
  }

  shape["@_isCollapsed"] = true;

  for (const d of [...(decisionService.encapsulatedDecision ?? []), ...(decisionService.outputDecision ?? [])]) {
    const hrefRelativeToTheDs = parseXmlHref(d["@_href"]); // Local to the DS.
    const decisionNamespaceRelativeToThisDmn =
      hrefRelativeToTheDs.namespace || decisionServiceNamespace || thisDmnsNamespace;

    const hrefRelativeToThisDmn = buildXmlHref({
      namespace: decisionNamespaceRelativeToThisDmn,
      id: hrefRelativeToTheDs.id,
    });

    deleteNode({
      drgEdges,
      externalDmnsIndex,
      definitions,
      dmnObjectId: hrefRelativeToTheDs.id,
      dmnObjectNamespace: decisionNamespaceRelativeToThisDmn,
      dmnObjectQName: parseXmlQName(xmlHrefToQName(hrefRelativeToThisDmn, definitions)),
      drdIndex,
      nodeNature: NodeNature.DRG_ELEMENT,
      mode: NodeDeletionMode.FROM_CURRENT_DRD_ONLY,
    });
  }
}
