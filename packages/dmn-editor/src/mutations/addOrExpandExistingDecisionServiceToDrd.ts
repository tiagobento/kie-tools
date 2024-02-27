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

import {
  DMN15__tDecisionService,
  DMN15__tDefinitions,
  DMNDI15__DMNShape,
} from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { ExternalDmnsIndex } from "../DmnEditor";
import { DECISION_SERVICE_COLLAPSED_DIMENSIONS } from "../diagram/nodes/DefaultSizes";
import { NODE_TYPES } from "../diagram/nodes/NodeTypes";
import { Computed } from "../store/Store";
import { computeContainingDecisionServiceHrefsByDecisionHrefs } from "../store/computed/computeContainingDecisionServiceHrefsByDecisionHrefs.ts";
import { computeIndexedDrd } from "../store/computed/computeIndexes";
import { xmlHrefToQName } from "../xml/xmlHrefToQName";
import { buildXmlHref, parseXmlHref } from "../xml/xmlHrefs";
import { addShape } from "./addShape";
import { repositionNode } from "./repositionNode";
import { addOrGetDrd } from "./addOrGetDrd";
import { generateUuid } from "@kie-tools/boxed-expression-component/dist/api";

/**
 * When adding a Decision Service to a DRD, we need to bring all its encapsulated and output Decisions with it,
 * copying their layout from other DRDs, or formatting with autolayout.
 */
export function addOrExpandExistingDecisionServiceToDrd({
  decisionServiceNamespace,
  decisionService,
  externalDmnsIndex,
  thisDmnsDefinitions,
  thisDmnsIndexedDrd,
  drdIndex,
  dropPoint,
}: {
  decisionServiceNamespace: string;
  decisionService: DMN15__tDecisionService;
  externalDmnsIndex: ReturnType<Computed["getExternalModelTypesByNamespace"]>["dmns"];
  thisDmnsDefinitions: DMN15__tDefinitions;
  thisDmnsIndexedDrd: ReturnType<Computed["indexedDrd"]>;
  drdIndex: number;
  dropPoint: { x: number; y: number } | undefined;
}) {
  const decisionServiceDmnDefinitions =
    decisionServiceNamespace === thisDmnsDefinitions["@_namespace"]
      ? thisDmnsDefinitions
      : externalDmnsIndex.get(decisionServiceNamespace)?.model.definitions;

  if (!decisionServiceDmnDefinitions) {
    throw new Error(`DMN MUTATION: Can't find definitions for model with namespace ${decisionServiceNamespace}`);
  }

  const { containedDecisionHrefsRelativeToThisDmn } = getDecisionServicePropertiesRelativeToThisDmn({
    thisDmnsNamespace: thisDmnsDefinitions["@_namespace"],
    decisionServiceNamespace,
    decisionService,
  });

  const decisionServiceHrefRelativeToThisDmn = buildXmlHref({
    id: decisionService["@_id"]!,
    namespace: decisionServiceNamespace,
    relativeToNamespace: thisDmnsDefinitions["@_namespace"],
  });

  if (
    doesThisDrdHaveConflictingDecisionService({
      decisionServiceNamespace,
      decisionService,
      decisionServiceDmnDefinitions,
      thisDmnsNamespace: thisDmnsDefinitions["@_namespace"],
      thisDmnsDefinitions,
      thisDmnsIndexedDrd,
    })
  ) {
    if (!dropPoint) {
      throw new Error("DMN MUTATION: Can't add a collapsed Decision Service without a dropPoint.");
    }
    // There's already, in this DRD, a Decision Service in expanded form that contains a Decision that is contained by the Decision Service we're adding.
    // As the DMN specification doesn't allow two copies of the same DRG element to be depicted in the same DRD, we can't add the Decision Service in expanded form.
    // To not disallow depicting the Decision Service in this DRD, though, we add it in collpased form.
    addShape({
      definitions: thisDmnsDefinitions,
      drdIndex,
      nodeType: NODE_TYPES.decisionService,
      shape: {
        "@_dmnElementRef": xmlHrefToQName({
          hrefString: decisionServiceHrefRelativeToThisDmn,
          rootElement: thisDmnsDefinitions,
          relativeToNamespace: thisDmnsDefinitions["@_namespace"],
        }),
        "@_isCollapsed": true,
        "dc:Bounds": {
          "@_x": dropPoint.x,
          "@_y": dropPoint.y,
          "@_width": DECISION_SERVICE_COLLAPSED_DIMENSIONS.width,
          "@_height": DECISION_SERVICE_COLLAPSED_DIMENSIONS.height,
        },
      },
    });

    // TODO: Tiago --> Delete from the DRD all Decisions contained by the Decision Service being added, except for those that are contained by another Decision Service in expanded form.
    return;
  }

  const indexedDrd = getIndexedDrdOfDrdWithCompleteExpandedDepictionOfDecisionService({
    decisionServiceDmnDefinitions,
    thisDmnsNamespace: thisDmnsDefinitions["@_namespace"],
    decisionServiceNamespace,
    drdIndex,
    decisionServiceHrefRelativeToThisDmn,
    containedDecisionHrefsRelativeToThisDmn,
  });

  // There's no DRD which inclues a complete expanded depiction of the Decision Service. Let's proceed with auto-layout.
  if (!indexedDrd) {
    console.debug(
      "DMN MUTATION: Using auto-layout because there is no complete expanded depiction of this Decision Service in any DRD."
    );

    // TODO: Tiago --> Use Auto-layout to position the contained Decisions inside the Decision Service.
  }
  // Let's copy the expanded depiction of the Decision Service from `drd`.
  // Adding or moving nodes that already exist in the current DRD to inside the Decision Service.
  // The positions need all be relative to the Decision Service node, of course.
  else {
    const dsShapeOnOtherDrd = indexedDrd.dmnShapesByHref.get(decisionServiceHrefRelativeToThisDmn);
    if (
      dsShapeOnOtherDrd?.["dc:Bounds"]?.["@_x"] === undefined ||
      dsShapeOnOtherDrd?.["dc:Bounds"]?.["@_y"] === undefined
    ) {
      throw new Error(
        `DMN MUTATION: Complete DMNShape for Decision Service with href ${decisionServiceHrefRelativeToThisDmn} should've existed on the indexed DRD.`
      );
    }

    // If there's already a DMNShape for the Decision Service, we ignore the dropPoint and use the Decision Service's position as reference point.
    let containedDecisionsOffset: { x: number; y: number };

    // Add the Decision Service shape
    const existingShapeForDs = computeIndexedDrd(
      thisDmnsDefinitions["@_namespace"],
      thisDmnsDefinitions,
      drdIndex
    ).dmnShapesByHref.get(decisionServiceHrefRelativeToThisDmn);
    if (existingShapeForDs) {
      const { diagramElements } = addOrGetDrd({ definitions: thisDmnsDefinitions, drdIndex });
      const shape = diagramElements[existingShapeForDs.index];
      if (shape.__$$element !== "dmndi:DMNShape") {
        throw new Error(
          `DMN MUTATION: Can't edit element with index ${existingShapeForDs.index} because it is not a DMNShape.`
        );
      }
      if (!shape["dc:Bounds"]) {
        throw new Error(
          "DMN MUTATION: Can't use existing Decision Service as reference because it doesn't have valid bounds."
        );
      }

      shape["@_isCollapsed"] = false;
      shape["di:extension"] = dsShapeOnOtherDrd["di:extension"];

      shape["dc:Bounds"] = {
        "@_height": dsShapeOnOtherDrd["dc:Bounds"]["@_height"],
        "@_width": dsShapeOnOtherDrd["dc:Bounds"]["@_width"],
        "@_x": shape["dc:Bounds"]["@_x"],
        "@_y": shape["dc:Bounds"]["@_y"],
      };

      shape["dmndi:DMNDecisionServiceDividerLine"] = copyDividerLineFromOtherDrd({
        dsShapeOnOtherDrd,
        dsPositionOnThisDrd: {
          x: shape["dc:Bounds"]["@_x"],
          y: shape["dc:Bounds"]["@_y"],
        },
      });

      containedDecisionsOffset = {
        x: dsShapeOnOtherDrd["dc:Bounds"]["@_x"] - shape["dc:Bounds"]["@_x"],
        y: dsShapeOnOtherDrd["dc:Bounds"]["@_y"] - shape["dc:Bounds"]["@_y"],
      };
    } else {
      if (!dropPoint) {
        throw new Error("DMN MUTATION: Can't add an expanded Decision Service without a dropPoint.");
      }

      addShape({
        definitions: thisDmnsDefinitions,
        drdIndex,
        nodeType: NODE_TYPES.decisionService,
        shape: {
          "@_dmnElementRef": xmlHrefToQName({
            hrefString: decisionServiceHrefRelativeToThisDmn,
            rootElement: thisDmnsDefinitions,
            relativeToNamespace: thisDmnsDefinitions["@_namespace"],
          }),
          "@_isCollapsed": false,
          "di:extension": dsShapeOnOtherDrd["di:extension"],
          "dc:Bounds": {
            "@_x": dropPoint.x,
            "@_y": dropPoint.y,
            "@_width": dsShapeOnOtherDrd["dc:Bounds"]["@_width"],
            "@_height": dsShapeOnOtherDrd["dc:Bounds"]["@_height"],
          },
          "dmndi:DMNDecisionServiceDividerLine": copyDividerLineFromOtherDrd({
            dsShapeOnOtherDrd,
            dsPositionOnThisDrd: {
              x: dropPoint.x,
              y: dropPoint.y,
            },
          }),
        },
      });
      containedDecisionsOffset = {
        x: dsShapeOnOtherDrd["dc:Bounds"]["@_x"] - dropPoint.x,
        y: dsShapeOnOtherDrd["dc:Bounds"]["@_y"] - dropPoint.y,
      };
    }

    // Add shapes of all contained Decisions
    addOrMoveShapesOfContainedDecisionsOfDecisionService({
      containedDecisionHrefsRelativeToThisDmn,
      indexedDrd,
      offset: containedDecisionsOffset,
      thisDmnsIndexedDrd,
      thisDmnsDefinitions,
      drdIndex,
      externalDmnsIndex,
      decisionServiceNamespace,
    });
  }
}

export function copyDividerLineFromOtherDrd({
  dsShapeOnOtherDrd,
  dsPositionOnThisDrd,
}: {
  dsShapeOnOtherDrd: DMNDI15__DMNShape;
  dsPositionOnThisDrd: { x: number; y: number };
}): DMNDI15__DMNShape["dmndi:DMNDecisionServiceDividerLine"] {
  const dividerLineWaypoints = dsShapeOnOtherDrd["dmndi:DMNDecisionServiceDividerLine"]?.["di:waypoint"] ?? [];
  const dividerLineY =
    dsPositionOnThisDrd.y + ((dividerLineWaypoints[0]["@_y"] ?? 0) - (dsShapeOnOtherDrd["dc:Bounds"]?.["@_y"] ?? 0));

  return {
    "di:extension": dsShapeOnOtherDrd["dmndi:DMNDecisionServiceDividerLine"]?.["di:extension"],
    "di:waypoint": [
      { "@_x": dsPositionOnThisDrd.x, "@_y": dividerLineY },
      { "@_x": dsPositionOnThisDrd.x + dsShapeOnOtherDrd["dc:Bounds"]!["@_width"], "@_y": dividerLineY },
    ],
  };
}

export function addOrMoveShapesOfContainedDecisionsOfDecisionService({
  containedDecisionHrefsRelativeToThisDmn,
  indexedDrd,
  offset,
  thisDmnsIndexedDrd,
  thisDmnsDefinitions,
  drdIndex,
  externalDmnsIndex,
  decisionServiceNamespace,
}: {
  containedDecisionHrefsRelativeToThisDmn: string[];
  indexedDrd: ReturnType<Computed["indexedDrd"]>;
  offset: { x: number; y: number };
  thisDmnsIndexedDrd: ReturnType<Computed["indexedDrd"]>;
  thisDmnsDefinitions: DMN15__tDefinitions;
  drdIndex: number;
  externalDmnsIndex: ExternalDmnsIndex;
  decisionServiceNamespace: string;
}) {
  for (const decisionHref of containedDecisionHrefsRelativeToThisDmn) {
    const decisionShapeOnOtherDrd = indexedDrd.dmnShapesByHref.get(decisionHref);
    if (
      decisionShapeOnOtherDrd?.["dc:Bounds"]?.["@_x"] === undefined ||
      decisionShapeOnOtherDrd?.["dc:Bounds"]?.["@_y"] === undefined ||
      decisionShapeOnOtherDrd?.["dc:Bounds"]?.["@_width"] === undefined ||
      decisionShapeOnOtherDrd?.["dc:Bounds"]?.["@_height"] === undefined
    ) {
      throw new Error(
        `DMN MUTATION: Complete DMNShape for Decision with href ${decisionHref} should've existed on the indexed DRD.`
      );
    }

    const x = decisionShapeOnOtherDrd["dc:Bounds"]["@_x"] - offset.x;
    const y = decisionShapeOnOtherDrd["dc:Bounds"]["@_y"] - offset.y;

    const existingDecisionShape = thisDmnsIndexedDrd.dmnShapesByHref.get(decisionHref);
    if (existingDecisionShape) {
      repositionNode({
        definitions: thisDmnsDefinitions,
        drdIndex,
        controlWaypointsByEdge: new Map(),
        change: {
          nodeType: NODE_TYPES.decision,
          type: "absolute",
          position: { x, y },
          shapeIndex: existingDecisionShape.index,
          selectedEdges: [],
          sourceEdgeIndexes: [],
          targetEdgeIndexes: [],
        },
      });
    } else {
      const decisionNs = parseXmlHref({
        href: decisionHref,
        relativeToNamespace: thisDmnsDefinitions["@_namespace"],
      }).namespace;
      const decisionDmnDefinitions =
        !decisionNs || decisionNs === thisDmnsDefinitions["@_namespace"]
          ? thisDmnsDefinitions
          : externalDmnsIndex.get(decisionNs)?.model.definitions;
      if (!decisionDmnDefinitions) {
        throw new Error(`DMN MUTATION: Can't find definitions for model with namespace ${decisionServiceNamespace}`);
      }

      addShape({
        definitions: thisDmnsDefinitions,
        drdIndex,
        nodeType: NODE_TYPES.decision,
        shape: {
          "@_dmnElementRef": xmlHrefToQName({
            hrefString: decisionHref,
            rootElement: thisDmnsDefinitions,
            relativeToNamespace: thisDmnsDefinitions["@_namespace"],
          }),
          "dc:Bounds": {
            "@_x": x,
            "@_y": y,
            "@_width": decisionShapeOnOtherDrd["dc:Bounds"]["@_width"],
            "@_height": decisionShapeOnOtherDrd["dc:Bounds"]["@_height"],
          },
        },
      });
    }
  }
}

export function getIndexedDrdOfDrdWithCompleteExpandedDepictionOfDecisionService({
  decisionServiceDmnDefinitions,
  thisDmnsNamespace,
  decisionServiceNamespace,
  drdIndex,
  decisionServiceHrefRelativeToThisDmn,
  containedDecisionHrefsRelativeToThisDmn,
}: {
  decisionServiceDmnDefinitions: DMN15__tDefinitions;
  thisDmnsNamespace: string;
  decisionServiceNamespace: string;
  drdIndex: number;
  decisionServiceHrefRelativeToThisDmn: string;
  containedDecisionHrefsRelativeToThisDmn: string[];
}) {
  const drds = decisionServiceDmnDefinitions["dmndi:DMNDI"]?.["dmndi:DMNDiagram"] ?? [];

  let indexedDrd: ReturnType<Computed["indexedDrd"]> | undefined;
  for (let i = 0; i < drds.length; i++) {
    if (thisDmnsNamespace === decisionServiceNamespace && i === drdIndex) {
      continue; // Skip the current DRD!
    }

    const _indexedDrd = computeIndexedDrd(thisDmnsNamespace, decisionServiceDmnDefinitions, i);
    const dsShape = _indexedDrd.dmnShapesByHref.get(decisionServiceHrefRelativeToThisDmn);
    const hasCompleteExpandedDepictionOfDecisionService =
      dsShape &&
      !(dsShape["@_isCollapsed"] ?? false) &&
      containedDecisionHrefsRelativeToThisDmn.every((dHref) => _indexedDrd.dmnShapesByHref.has(dHref));

    if (hasCompleteExpandedDepictionOfDecisionService) {
      indexedDrd = _indexedDrd;
      break; // Found a DRD with a complete expanded depiction of the Decision Service.
    }
  }
  return indexedDrd;
}

export function getDecisionServicePropertiesRelativeToThisDmn({
  thisDmnsNamespace,
  decisionServiceNamespace,
  decisionService,
}: {
  thisDmnsNamespace: string;
  decisionServiceNamespace: string;
  decisionService: DMN15__tDecisionService;
}) {
  const containedDecisionHrefsRelativeToThisDmn = [
    ...(decisionService.outputDecision ?? []),
    ...(decisionService.encapsulatedDecision ?? []),
  ].map((d) =>
    buildXmlHref({
      ...parseXmlHref({ href: d["@_href"], relativeToNamespace: decisionServiceNamespace }),
      relativeToNamespace: thisDmnsNamespace,
    })
  );

  return { containedDecisionHrefsRelativeToThisDmn };
}

export function doesThisDrdHaveConflictingDecisionService({
  decisionServiceNamespace,
  decisionService,
  decisionServiceDmnDefinitions,
  thisDmnsNamespace,
  thisDmnsIndexedDrd,
}: {
  decisionServiceNamespace: string;
  decisionService: DMN15__tDecisionService;
  decisionServiceDmnDefinitions: DMN15__tDefinitions;
  thisDmnsNamespace: string;
  thisDmnsDefinitions: DMN15__tDefinitions;
  thisDmnsIndexedDrd: ReturnType<Computed["indexedDrd"]>;
}) {
  const { containedDecisionHrefsRelativeToThisDmn } = getDecisionServicePropertiesRelativeToThisDmn({
    thisDmnsNamespace,
    decisionServiceNamespace,
    decisionService,
  });

  const containingDecisionServiceHrefsByDecisionHrefsRelativeToThisDmn =
    computeContainingDecisionServiceHrefsByDecisionHrefs({
      thisDmnsNamespace,
      drgElementsNamespace: decisionServiceNamespace,
      drgElements: decisionServiceDmnDefinitions.drgElement,
    });

  const decisionServiceHref = buildXmlHref({
    id: decisionService["@_id"]!,
    namespace: decisionServiceNamespace,
    relativeToNamespace: thisDmnsNamespace,
  });

  return containedDecisionHrefsRelativeToThisDmn.some((decisionHref) =>
    (containingDecisionServiceHrefsByDecisionHrefsRelativeToThisDmn.get(decisionHref) ?? []).some(
      (dsHref) => thisDmnsIndexedDrd.dmnShapesByHref.has(dsHref) && dsHref !== decisionServiceHref
    )
  );
}
