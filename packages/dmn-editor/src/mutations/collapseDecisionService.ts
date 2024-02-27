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
  thisDmnsDefinitions,
  drdIndex,
  decisionService,
  decisionServiceNamespace,
  shapeIndex,
  drgEdges,
  externalDmnsIndex,
}: {
  thisDmnsDefinitions: State["dmn"]["model"]["definitions"];
  drdIndex: number;
  decisionService: DMN15__tDecisionService;
  decisionServiceNamespace: string;
  shapeIndex: number;
  externalDmnsIndex: ReturnType<Computed["getExternalModelTypesByNamespace"]>["dmns"];
  drgEdges: DrgEdge[];
}) {
  const { diagramElements } = addOrGetDrd({ definitions: thisDmnsDefinitions, drdIndex });
  const shape = diagramElements[shapeIndex];
  if (shape.__$$element !== "dmndi:DMNShape") {
    throw new Error(
      `DMN MUTATION: Can't collapse Decision Service because element with index ${shapeIndex} is not a DMNShape.`
    );
  }

  shape["@_isCollapsed"] = true;

  for (const d of [...(decisionService.encapsulatedDecision ?? []), ...(decisionService.outputDecision ?? [])]) {
    const hrefRelativeToDs = parseXmlHref({ href: d["@_href"], relativeToNamespace: decisionServiceNamespace });

    deleteNode({
      drgEdges,
      externalDmnsIndex,
      thisDmnsDefinitions,
      dmnObjectId: hrefRelativeToDs.id,
      dmnObjectNamespace: hrefRelativeToDs.namespace,
      dmnObjectQName: parseXmlQName(
        xmlHrefToQName({
          hrefString: buildXmlHref({
            ...hrefRelativeToDs,
            relativeToNamespace: thisDmnsDefinitions["@_namespace"],
          }),
          rootElement: thisDmnsDefinitions,
          relativeToNamespace: thisDmnsDefinitions["@_namespace"],
        })
      ),
      drdIndex,
      nodeNature: NodeNature.DRG_ELEMENT,
      mode: NodeDeletionMode.FROM_CURRENT_DRD_ONLY,
    });
  }
}
