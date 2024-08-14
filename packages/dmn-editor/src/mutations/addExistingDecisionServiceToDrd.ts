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

import { generateUuid } from "@kie-tools/boxed-expression-component/dist/api";
import {
  DMN15__tDecisionService,
  DMN15__tDefinitions,
} from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { ExternalModelsIndex } from "../DmnEditor";
import { getAutoLayoutedInfo } from "../autolayout/autoLayoutInfo";
import { DECISION_SERVICE_COLLAPSED_DIMENSIONS, MIN_NODE_SIZES } from "../diagram/nodes/DefaultSizes";
import { NODE_TYPES } from "../diagram/nodes/NodeTypes";
import { Normalized } from "../normalization/normalize";
import { Computed, SnapGrid, State } from "../store/Store";
import { computeContainingDecisionServiceHrefsByDecisionHrefs } from "../store/computed/computeContainingDecisionServiceHrefsByDecisionHrefs.ts";
import { computeDiagramData } from "../store/computed/computeDiagramData";
import { computeExternalModelsByType } from "../store/computed/computeExternalModelsByType";
import { computeIndexedDrd } from "../store/computed/computeIndexes";
import { xmlHrefToQName } from "../xml/xmlHrefToQName";
import { buildXmlHref, parseXmlHref } from "../xml/xmlHrefs";
import { addOrGetDrd } from "./addOrGetDrd";
import { addShape } from "./addShape";
import { applyAutoLayoutToDrd } from "./applyAutoLayoutToDrd";
import { repositionNode } from "./repositionNode";

export enum StrategyForAddingDecisionServiceToDrd {
  AUTO_GENERATE,
  CONFLICT,
  COPY_FROM_ANOTHER_DRD,
}

/**
 * When adding a Decision Service to a DRD, we need to bring all its encapsulated and output Decisions with it,
 * copying their layout from other DRDs, or formatting with autolayout.
 * This method returns the strategy to be used when adding a Decision Service.
 * The strategy should be used to call one of three methods:
 *  - AUTO_GENERATE: addAutoGeneratedDecisionServiceToDrd
 *  - CONFLICT: addConflictingDecisionServiceToDrd
 *  - COPY_FROM_ANOTHER_DRD: addExistingDecisionServiceToDrd
 */
export function getStrategyToAddExistingDecisionServiceToDrd({
  __readonly_definitions,
  __readonly_decisionServiceNamespace,
  __readonly_drgElement,
  __readonly_externalDmnsIndex,
  __readonly_namespace,
  __readonly_indexedDrd,
  __readonly_drdIndex,
}: {
  __readonly_definitions: Normalized<DMN15__tDefinitions>;
  __readonly_decisionServiceNamespace: string;
  __readonly_drgElement: Normalized<DMN15__tDecisionService>;
  __readonly_externalDmnsIndex: ReturnType<Computed["getExternalModelTypesByNamespace"]>["dmns"];
  __readonly_namespace: string;
  __readonly_indexedDrd: ReturnType<Computed["indexedDrd"]>;
  __readonly_drdIndex: number;
}) {
  const decisionServiceDmnDefinitions =
    !__readonly_decisionServiceNamespace || __readonly_decisionServiceNamespace === __readonly_namespace
      ? __readonly_definitions
      : __readonly_externalDmnsIndex.get(__readonly_decisionServiceNamespace)?.model.definitions;
  if (!decisionServiceDmnDefinitions) {
    throw new Error(
      `DMN MUTATION: Can't find definitions for model with namespace ${__readonly_decisionServiceNamespace}`
    );
  }
  const { decisionServiceNamespaceForHref, containedDecisionHrefsRelativeToThisDmn } =
    getDecisionServicePropertiesRelativeToThisDmn({
      thisDmnsNamespace: __readonly_namespace,
      decisionServiceNamespace: __readonly_decisionServiceNamespace,
      decisionService: __readonly_drgElement,
    });

  const decisionServiceHrefRelativeToThisDmn = buildXmlHref({
    namespace: decisionServiceNamespaceForHref,
    id: __readonly_drgElement["@_id"]!,
  });

  const containingDecisionServiceHrefsByDecisionHrefsRelativeToThisDmn =
    computeContainingDecisionServiceHrefsByDecisionHrefs({
      thisDmnsNamespace: __readonly_namespace,
      drgElementsNamespace: __readonly_decisionServiceNamespace,
      drgElements: decisionServiceDmnDefinitions.drgElement,
    });

  const doesThisDrdHaveConflictingDecisionService = containedDecisionHrefsRelativeToThisDmn.some((decisionHref) =>
    (containingDecisionServiceHrefsByDecisionHrefsRelativeToThisDmn.get(decisionHref) ?? []).some((d) =>
      __readonly_indexedDrd.dmnShapesByHref.has(d)
    )
  );

  if (doesThisDrdHaveConflictingDecisionService) {
    // There's already, in this DRD, a Decision Service in expanded form that contains a Decision that is contained by the Decision Service we're adding.
    // As the DMN specification doesn't allow two copies of the same DRG element to be depicted in the same DRD, we can't add the Decision Service in expanded form.
    // To not disallow depicting the Decision Service in this DRD, though, we add it in collpased form.
    return {
      strategyForAddingDecisionServiceToDrd: StrategyForAddingDecisionServiceToDrd.CONFLICT,
      decisionServiceHrefRelativeToThisDmn,
      containedDecisionHrefsRelativeToThisDmn,
    };
  }

  const drds = decisionServiceDmnDefinitions["dmndi:DMNDI"]?.["dmndi:DMNDiagram"] ?? [];
  let indexedDrd: ReturnType<Computed["indexedDrd"]> | undefined;
  for (let i = 0; i < drds.length; i++) {
    if (__readonly_namespace === __readonly_decisionServiceNamespace && i === __readonly_drdIndex) {
      continue; // Skip the current DRD!
    }

    const _indexedDrd = computeIndexedDrd(__readonly_namespace, decisionServiceDmnDefinitions, i);
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

  if (indexedDrd === undefined) {
    return {
      strategyForAddingDecisionServiceToDrd: StrategyForAddingDecisionServiceToDrd.AUTO_GENERATE,
      decisionServiceHrefRelativeToThisDmn,
      containedDecisionHrefsRelativeToThisDmn,
    };
  } else {
    return {
      strategyForAddingDecisionServiceToDrd: StrategyForAddingDecisionServiceToDrd.COPY_FROM_ANOTHER_DRD,
      indexedDrdContainingDecisionServiceDepiction: indexedDrd,
      decisionServiceHrefRelativeToThisDmn,
      containedDecisionHrefsRelativeToThisDmn,
    };
  }
}

export function addConflictingDecisionServiceToDrd({
  definitions,
  __readonly_drdIndex,
  __readonly_dropPoint,
  __readonly_decisionServiceHrefRelativeToThisDmn,
}: {
  definitions: Normalized<DMN15__tDefinitions>;
  __readonly_drdIndex: number;
  __readonly_dropPoint: { x: number; y: number };
  __readonly_decisionServiceHrefRelativeToThisDmn: string;
}) {
  addShape({
    definitions: definitions,
    drdIndex: __readonly_drdIndex,
    nodeType: NODE_TYPES.decisionService,
    shape: {
      "@_id": generateUuid(),
      "@_dmnElementRef": xmlHrefToQName(__readonly_decisionServiceHrefRelativeToThisDmn, definitions),
      "@_isCollapsed": true,
      "dc:Bounds": {
        "@_x": __readonly_dropPoint.x,
        "@_y": __readonly_dropPoint.y,
        "@_width": DECISION_SERVICE_COLLAPSED_DIMENSIONS.width,
        "@_height": DECISION_SERVICE_COLLAPSED_DIMENSIONS.height,
      },
    },
  });
}

export async function addAutoGeneratedDecisionServiceToDrd({
  state,
  __readonly_decisionServiceNamespace,
  __readonly_externalDmnsIndex,
  __readonly_drdIndex,
  __readonly_snapGrid,
  __readonly_decisionServiceHrefRelativeToThisDmn,
  __readonly_containedDecisionHrefsRelativeToThisDmn,
  __readonly_dropPoint,
  __readonly_isAlternativeInputDataShape,
  __readonly_externalModelsByNamespace,
}: {
  state: State;
  __readonly_decisionServiceNamespace: string;
  __readonly_externalDmnsIndex: ReturnType<Computed["getExternalModelTypesByNamespace"]>["dmns"];
  __readonly_drdIndex: number;
  __readonly_snapGrid: SnapGrid;
  __readonly_decisionServiceHrefRelativeToThisDmn: string;
  __readonly_containedDecisionHrefsRelativeToThisDmn: string[];
  __readonly_dropPoint: { x: number; y: number };
  __readonly_isAlternativeInputDataShape: boolean;
  __readonly_externalModelsByNamespace: ExternalModelsIndex | undefined;
}) {
  const drds = state.dmn.model.definitions["dmndi:DMNDI"]?.["dmndi:DMNDiagram"];
  // Create a Dummy DRD
  // In case the model doesn't have a DRD, the Dummy DRD will be the new DRD.
  // Otherwise, the Dummy DRD will be the next index.
  const dummyDrdIndex = drds?.length === undefined ? 0 : drds.length;
  addOrGetDrd({
    definitions: state.dmn.model.definitions,
    drdIndex: dummyDrdIndex,
  });

  // Add the Decision Service
  const minNodeSize = MIN_NODE_SIZES[NODE_TYPES.decisionService]({
    snapGrid: __readonly_snapGrid,
  });
  addShape({
    definitions: state.dmn.model.definitions,
    drdIndex: dummyDrdIndex,
    nodeType: NODE_TYPES.decisionService,
    shape: {
      "@_id": generateUuid(),
      "@_dmnElementRef": xmlHrefToQName(__readonly_decisionServiceHrefRelativeToThisDmn, state.dmn.model.definitions),
      "dc:Bounds": {
        "@_x": 0, // Auto-layout will be applied;
        "@_y": 0, // Auto-layout will be applied;
        ...minNodeSize,
      },
    },
  });

  // Add all Encapsulated and Output Decisions
  for (const decisionHref of __readonly_containedDecisionHrefsRelativeToThisDmn) {
    const decisionNs = parseXmlHref(decisionHref).namespace;
    const decisionDmnDefinitions =
      !decisionNs || decisionNs === state.dmn.model.definitions["@_namespace"]
        ? state.dmn.model.definitions
        : __readonly_externalDmnsIndex.get(decisionNs)?.model.definitions;
    if (!decisionDmnDefinitions) {
      throw new Error(
        `DMN MUTATION: Can't find definitions for model with namespace ${__readonly_decisionServiceNamespace}`
      );
    }
    const minNodeSize = MIN_NODE_SIZES[NODE_TYPES.decision]({
      snapGrid: __readonly_snapGrid,
    });
    addShape({
      definitions: state.dmn.model.definitions,
      drdIndex: dummyDrdIndex,
      nodeType: NODE_TYPES.decision,
      shape: {
        "@_id": generateUuid(),
        "@_dmnElementRef": xmlHrefToQName(decisionHref, state.dmn.model.definitions),
        "dc:Bounds": {
          "@_x": 0, // Auto-layout will be applied;
          "@_y": 0, // Auto-layout will be applied;
          ...minNodeSize,
        },
      },
    });
  }

  // Compute the external model types by namespace after autogenerating the Decision Service
  const externalModelTypesByNamespace = computeExternalModelsByType(
    state.dmn.model.definitions.import,
    __readonly_externalModelsByNamespace
  );

  // Compute the Dummy DRD indexed drd after autogenerating the Decision Service
  const dummyIndexedDrd = computeIndexedDrd(
    state.dmn.model.definitions["@_namespace"],
    state.dmn.model.definitions,
    dummyDrdIndex
  );

  // Compute the Dummy DRD diagram data after autogenerating the Decision Service
  const { nodes, nodesById, edges, edgesById, drgEdges } = computeDiagramData(
    state.diagram,
    state.dmn.model.definitions,
    externalModelTypesByNamespace,
    dummyIndexedDrd,
    __readonly_isAlternativeInputDataShape
  );

  // Get the auto-layout info
  const { __readonly_autoLayoutedInfo, __readonly_parentNodesById } = await getAutoLayoutedInfo({
    __readonly_snapGrid,
    __readonly_nodesById: nodesById,
    __readonly_edgesById: edgesById,
    __readonly_nodes: nodes,
    __readonly_drgEdges: drgEdges,
    __readonly_isAlternativeInputDataShape: __readonly_isAlternativeInputDataShape,
  });

  // Apply the auto-layouted info to the Dummy DRD
  applyAutoLayoutToDrd({
    state,
    __readonly_dmnShapesByHref: dummyIndexedDrd.dmnShapesByHref,
    __readonly_edges: edges,
    __readonly_edgesById: edgesById,
    __readonly_nodesById: nodesById,
    __readonly_autoLayoutedInfo,
    __readonly_parentNodesById,
    __readonly_drdIndex: dummyDrdIndex,
    __readonly_dmnObjectNamespace: __readonly_decisionServiceNamespace,
    __readonly_externalDmnsIndex: externalModelTypesByNamespace.dmns,
    __readonly_externalModelsByNamespace: __readonly_externalModelsByNamespace,
  });

  // Save DS shape before applying the autolayout
  const { "@_x": dsShapeX, "@_y": dsShapeY } = dummyIndexedDrd.dmnShapesByHref.get(
    __readonly_decisionServiceHrefRelativeToThisDmn
  )!["dc:Bounds"]!;
  // Reposition the auto generated Decision Service to the drop point
  repositionNode({
    definitions: state.dmn.model.definitions,
    drdIndex: dummyDrdIndex,
    controlWaypointsByEdge: new Map(),
    change: {
      nodeType: NODE_TYPES.decisionService,
      type: "absolute",
      position: { x: __readonly_dropPoint.x, y: __readonly_dropPoint.y },
      shapeIndex: dummyIndexedDrd.dmnShapesByHref.get(__readonly_decisionServiceHrefRelativeToThisDmn)?.index ?? 0,
      selectedEdges: [],
      sourceEdgeIndexes: [],
      targetEdgeIndexes: [],
    },
  });

  // Relatively reposition the auto generated Decisions to the drop point
  for (const decisionHref of __readonly_containedDecisionHrefsRelativeToThisDmn) {
    const currentDecisionShape = dummyIndexedDrd.dmnShapesByHref.get(decisionHref);

    const x = __readonly_dropPoint.x + currentDecisionShape!["dc:Bounds"]!["@_x"] - dsShapeX;
    const y = __readonly_dropPoint.y + currentDecisionShape!["dc:Bounds"]!["@_y"] - dsShapeY;

    if (currentDecisionShape) {
      repositionNode({
        definitions: state.dmn.model.definitions,
        drdIndex: dummyDrdIndex,
        controlWaypointsByEdge: new Map(),
        change: {
          nodeType: NODE_TYPES.decision,
          type: "absolute",
          position: { x, y },
          shapeIndex: currentDecisionShape.index,
          selectedEdges: [],
          sourceEdgeIndexes: [],
          targetEdgeIndexes: [],
        },
      });
    }
  }

  // Copy the DS and Decisions to current DRD and remove Dummy DRD;
  if (dummyDrdIndex !== __readonly_drdIndex) {
    // The auto generated shape.
    const { index, dmnElementRefQName, ...dsShape } = dummyIndexedDrd.dmnShapesByHref.get(
      __readonly_decisionServiceHrefRelativeToThisDmn
    )!;
    drds![__readonly_drdIndex]["dmndi:DMNDiagramElement"] ??= [];
    drds?.[__readonly_drdIndex]["dmndi:DMNDiagramElement"]?.push({ ...dsShape, __$$element: "dmndi:DMNShape" });
    for (const decisionHref of __readonly_containedDecisionHrefsRelativeToThisDmn) {
      const { index, dmnElementRefQName, ...decisionShape } = dummyIndexedDrd.dmnShapesByHref.get(decisionHref)!;
      drds?.[__readonly_drdIndex]["dmndi:DMNDiagramElement"]?.push({
        ...decisionShape,
        __$$element: "dmndi:DMNShape",
      });
    }
    drds?.pop(); // Remove Dummy DRD;
  } else {
    // In this case Dummy DRD is the current DRD
  }
}

export function addExistingDecisionServiceToDrd({
  definitions,
  __readonly_decisionServiceNamespace,
  __readonly_externalDmnsIndex,
  __readonly_namespace,
  __readonly_indexedDrd,
  __readonly_indexedDrdContainingDecisionServiceDepiction,
  __readonly_drdIndex,
  __readonly_dropPoint,
  __readonly_decisionServiceHrefRelativeToThisDmn,
  __readonly_containedDecisionHrefsRelativeToThisDmn,
}: {
  definitions: Normalized<DMN15__tDefinitions>;
  __readonly_decisionServiceNamespace: string;
  __readonly_externalDmnsIndex: ReturnType<Computed["getExternalModelTypesByNamespace"]>["dmns"];
  __readonly_namespace: string;
  __readonly_indexedDrd: ReturnType<Computed["indexedDrd"]>;
  __readonly_indexedDrdContainingDecisionServiceDepiction: ReturnType<Computed["indexedDrd"]>;
  __readonly_drdIndex: number;
  __readonly_dropPoint: { x: number; y: number };
  __readonly_decisionServiceHrefRelativeToThisDmn: string;
  __readonly_containedDecisionHrefsRelativeToThisDmn: string[];
}) {
  // Let's copy the expanded depiction of the Decision Service from `drd`.
  // Adding or moving nodes that already exist in the current DRD to inside the Decision Service.
  // The positions need all be relative to the Decision Service node, of course.
  const dsShapeOnOtherDrd = __readonly_indexedDrdContainingDecisionServiceDepiction.dmnShapesByHref.get(
    __readonly_decisionServiceHrefRelativeToThisDmn
  );
  if (
    dsShapeOnOtherDrd?.["dc:Bounds"]?.["@_x"] === undefined ||
    dsShapeOnOtherDrd?.["dc:Bounds"]?.["@_y"] === undefined
  ) {
    throw new Error(
      `DMN MUTATION: Complete DMNShape for Decision Service with href ${__readonly_decisionServiceHrefRelativeToThisDmn} should've existed on the indexed DRD.`
    );
  }

  const dsDividirLineOnOtherDrd = dsShapeOnOtherDrd["dmndi:DMNDecisionServiceDividerLine"];
  const decisionServiceDividerLineWaypoint = [
    {
      "@_x": __readonly_dropPoint.x,
      "@_y":
        (dsDividirLineOnOtherDrd?.["di:waypoint"]?.[0]["@_y"] ?? 0) -
        (dsShapeOnOtherDrd?.["dc:Bounds"]?.["@_y"] ?? 0) +
        __readonly_dropPoint.y,
    },
    {
      "@_x":
        (dsDividirLineOnOtherDrd?.["di:waypoint"]?.[1]["@_x"] ?? 0) -
        (dsDividirLineOnOtherDrd?.["di:waypoint"]?.[0]["@_x"] ?? 0) +
        __readonly_dropPoint.x,
      "@_y":
        (dsDividirLineOnOtherDrd?.["di:waypoint"]?.[0]["@_y"] ?? 0) -
        (dsShapeOnOtherDrd?.["dc:Bounds"]?.["@_y"] ?? 0) +
        __readonly_dropPoint.y,
    },
  ];
  addShape({
    definitions: definitions,
    drdIndex: __readonly_drdIndex,
    nodeType: NODE_TYPES.decisionService,
    shape: {
      "@_id": generateUuid(),
      "@_dmnElementRef": xmlHrefToQName(__readonly_decisionServiceHrefRelativeToThisDmn, definitions),
      "dc:Bounds": {
        "@_x": __readonly_dropPoint.x,
        "@_y": __readonly_dropPoint.y,
        "@_width": dsShapeOnOtherDrd["dc:Bounds"]["@_width"],
        "@_height": dsShapeOnOtherDrd["dc:Bounds"]["@_height"],
      },
    },
    decisionServiceDividerLineWaypoint,
  });

  for (const decisionHref of __readonly_containedDecisionHrefsRelativeToThisDmn) {
    const decisionShapeOnOtherDrd =
      __readonly_indexedDrdContainingDecisionServiceDepiction.dmnShapesByHref.get(decisionHref);
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

    const x =
      __readonly_dropPoint.x + (decisionShapeOnOtherDrd["dc:Bounds"]["@_x"] - dsShapeOnOtherDrd["dc:Bounds"]["@_x"]);
    const y =
      __readonly_dropPoint.y + (decisionShapeOnOtherDrd["dc:Bounds"]["@_y"] - dsShapeOnOtherDrd["dc:Bounds"]["@_y"]);

    const existingDecisionShape = __readonly_indexedDrd.dmnShapesByHref.get(decisionHref);
    if (existingDecisionShape) {
      repositionNode({
        definitions: definitions,
        drdIndex: __readonly_drdIndex,
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
      const decisionNs = parseXmlHref(decisionHref).namespace;
      const decisionDmnDefinitions =
        !decisionNs || decisionNs === __readonly_namespace
          ? definitions
          : __readonly_externalDmnsIndex.get(decisionNs)?.model.definitions;
      if (!decisionDmnDefinitions) {
        throw new Error(
          `DMN MUTATION: Can't find definitions for model with namespace ${__readonly_decisionServiceNamespace}`
        );
      }

      addShape({
        definitions: definitions,
        drdIndex: __readonly_drdIndex,
        nodeType: NODE_TYPES.decision,
        shape: {
          "@_id": generateUuid(),
          "@_dmnElementRef": xmlHrefToQName(decisionHref, definitions),
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

export function getDecisionServicePropertiesRelativeToThisDmn({
  thisDmnsNamespace,
  decisionServiceNamespace,
  decisionService,
}: {
  thisDmnsNamespace: string;
  decisionServiceNamespace: string;
  decisionService: Normalized<DMN15__tDecisionService>;
}) {
  const decisionServiceNamespaceForHref =
    decisionServiceNamespace === thisDmnsNamespace ? "" : decisionServiceNamespace;

  const containedDecisionHrefsRelativeToThisDmn = [
    ...(decisionService.outputDecision ?? []),
    ...(decisionService.encapsulatedDecision ?? []),
  ].map((d) => {
    const parsedHref = parseXmlHref(d["@_href"]);
    return buildXmlHref({
      namespace: !parsedHref.namespace ? decisionServiceNamespaceForHref : parsedHref.namespace,
      id: parsedHref.id,
    });
  });

  return { decisionServiceNamespaceForHref, containedDecisionHrefsRelativeToThisDmn };
}
