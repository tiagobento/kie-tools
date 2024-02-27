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

import { DMN15__tDefinitions } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { XmlQName } from "@kie-tools/xml-parser-ts/dist/qNames";
import * as RF from "reactflow";
import { KIE_DMN_UNKNOWN_NAMESPACE } from "../../Dmn15Spec";
import { snapShapeDimensions, snapShapePosition } from "../../diagram/SnapGrid";
import { EdgeType, NodeType } from "../../diagram/connections/graphStructure";
import { EDGE_TYPES } from "../../diagram/edges/EdgeTypes";
import { DmnDiagramEdgeData } from "../../diagram/edges/Edges";
import { DrgEdge, EdgeVisitor, NodeVisitor, getAdjMatrix, traverse } from "../../diagram/graph/graph";
import { getNodeTypeFromDmnObject } from "../../diagram/maths/DmnMaths";
import { DECISION_SERVICE_COLLAPSED_DIMENSIONS, MIN_NODE_SIZES } from "../../diagram/nodes/DefaultSizes";
import { ___NASTY_HACK_FOR_SAFARI_to_force_redrawing_svgs_and_avoid_repaint_glitches } from "../../diagram/nodes/NodeSvgs";
import { NODE_TYPES } from "../../diagram/nodes/NodeTypes";
import { DmnDiagramNodeData, NodeDmnObjects } from "../../diagram/nodes/Nodes";
import { Unpacked } from "../../tsExt/tsExt";
import { buildXmlHref, parseXmlHref } from "../../xml/xmlHrefs";
import { TypeOrReturnType } from "../ComputedStateCache";
import { Computed, State } from "../Store";
import { getDecisionServicePropertiesRelativeToThisDmn } from "../../mutations/addOrExpandExistingDecisionServiceToDrd";

export const NODE_LAYERS = {
  GROUP_NODE: 0,
  NODES: 1000, // We need a difference > 1000 here, since ReactFlow will add 1000 to the z-index when a node is selected.
  DECISION_SERVICE_NODE: 2000, // We need a difference > 1000 here, since ReactFlow will add 1000 to the z-index when a node is selected.
  NESTED_NODES: 4000,
};

type AckEdge = (args: {
  id: string;
  dmnObject: DmnDiagramEdgeData["dmnObject"];
  type: EdgeType;
  source: string;
  target: string;
}) => RF.Edge<DmnDiagramEdgeData>;

type AckNode = (
  dmnObjectQName: XmlQName,
  dmnObject: NodeDmnObjects,
  index: number
) => RF.Node<DmnDiagramNodeData> | undefined;

export function computeDiagramData(
  diagram: State["diagram"],
  thisDmnsDefinitions: State["dmn"]["model"]["definitions"],
  externalModelTypesByNamespace: TypeOrReturnType<Computed["getExternalModelTypesByNamespace"]>,
  indexes: TypeOrReturnType<Computed["indexedDrd"]>
) {
  // console.time("nodes");
  ___NASTY_HACK_FOR_SAFARI_to_force_redrawing_svgs_and_avoid_repaint_glitches.flag =
    !___NASTY_HACK_FOR_SAFARI_to_force_redrawing_svgs_and_avoid_repaint_glitches.flag;

  const drgElementsWithoutVisualRepresentationOnCurrentDrd: string[] = [];

  const selectedNodesById = new Map<string, RF.Node<DmnDiagramNodeData>>();
  const selectedEdgesById = new Map<string, RF.Edge<DmnDiagramEdgeData>>();
  const selectedNodeTypes = new Set<NodeType>();
  const nodesById = new Map<string, RF.Node<DmnDiagramNodeData>>();
  const edgesById = new Map<string, RF.Edge<DmnDiagramEdgeData>>();
  const parentIdsById = new Map<string, DmnDiagramNodeData>();

  const { selectedNodes, draggingNodes, resizingNodes, selectedEdges } = {
    selectedNodes: new Set(diagram._selectedNodes),
    draggingNodes: new Set(diagram.draggingNodes),
    resizingNodes: new Set(diagram.resizingNodes),
    selectedEdges: new Set(diagram._selectedEdges),
  };

  // console.time("edges");
  const edges: RF.Edge<DmnDiagramEdgeData>[] = [];

  const drgEdges: DrgEdge[] = [];

  const ackEdge: AckEdge = ({ id, type, dmnObject, source, target }) => {
    const data = {
      dmnObject,
      dmnEdge: id ? indexes.dmnEdgesByDmnElementRef.get(id) : undefined,
      dmnShapeSource: indexes.dmnShapesByHref.get(source),
      dmnShapeTarget: indexes.dmnShapesByHref.get(target),
    };

    const edge: RF.Edge<DmnDiagramEdgeData> = {
      data,
      id,
      type,
      source,
      target,
      selected: selectedEdges.has(id),
    };

    edgesById.set(edge.id, edge);
    if (edge.selected) {
      selectedEdgesById.set(edge.id, edge);
    }

    edges.push(edge);

    drgEdges.push({ id, sourceId: source, targetId: target, dmnObject });

    return edge;
  };

  // requirements
  ackRequirementEdges(
    thisDmnsDefinitions["@_namespace"],
    thisDmnsDefinitions["@_namespace"],
    thisDmnsDefinitions.drgElement,
    ackEdge
  );

  // associations
  (thisDmnsDefinitions.artifact ?? []).forEach((dmnObject, index) => {
    if (dmnObject.__$$element !== "association") {
      return;
    }

    ackEdge({
      id: dmnObject["@_id"]!,
      dmnObject: {
        namespace: thisDmnsDefinitions["@_namespace"],
        type: dmnObject.__$$element,
        id: dmnObject["@_id"]!,
        requirementType: "association",
        index,
      },
      type: EDGE_TYPES.association,
      source: dmnObject.sourceRef?.["@_href"],
      target: dmnObject.targetRef?.["@_href"],
    });
  });

  // console.timeEnd("edges");
  const ackNode: AckNode = (dmnObjectQName, dmnObject, index) => {
    const type = getNodeTypeFromDmnObject(dmnObject);
    if (!type) {
      return undefined;
    }

    // If the QName is composite, we try and get the namespace from the XML namespace declarations. If it's not found, we use `UNKNOWN_DMN_NAMESPACE`
    // If the QName is simple, we simply use this DMN's namespace.
    const dmnObjectNamespace = dmnObjectQName.prefix
      ? thisDmnsDefinitions[`@_xmlns:${dmnObjectQName.prefix}`] ?? KIE_DMN_UNKNOWN_NAMESPACE
      : thisDmnsDefinitions["@_namespace"];

    const id = buildXmlHref({
      id: dmnObjectQName.localPart,
      namespace: dmnObjectNamespace,
      relativeToNamespace: thisDmnsDefinitions["@_namespace"],
    });

    const _shape = indexes.dmnShapesByHref.get(id);
    if (!_shape) {
      drgElementsWithoutVisualRepresentationOnCurrentDrd.push(id);
      return undefined;
    }

    const { dmnElementRefQName, ...shape } = _shape;

    const data: DmnDiagramNodeData = {
      dmnObjectNamespace,
      dmnObjectQName,
      dmnObject,
      shape,
      index,
      parentRfNode: undefined,
    };

    const newNode: RF.Node<DmnDiagramNodeData> = {
      id,
      type,
      selected: selectedNodes.has(id),
      dragging: draggingNodes.has(id),
      resizing: resizingNodes.has(id),
      position: snapShapePosition(diagram.snapGrid, shape),
      data,
      zIndex: NODE_LAYERS.NODES,
      style: { ...snapShapeDimensions(diagram.snapGrid, shape, MIN_NODE_SIZES[type](diagram.snapGrid)) },
    };

    if (dmnObject?.__$$element === "decisionService") {
      const { containedDecisionHrefsRelativeToThisDmn } = getDecisionServicePropertiesRelativeToThisDmn({
        thisDmnsNamespace: thisDmnsDefinitions["@_namespace"],
        decisionServiceNamespace: dmnObjectNamespace,
        decisionService: dmnObject,
      });

      for (let i = 0; i < containedDecisionHrefsRelativeToThisDmn.length; i++) {
        parentIdsById.set(containedDecisionHrefsRelativeToThisDmn[i], data);
      }

      if (shape["@_isCollapsed"] ?? false) {
        newNode.style = {
          ...newNode.style,
          ...DECISION_SERVICE_COLLAPSED_DIMENSIONS,
        };
      }
    }

    nodesById.set(newNode.id, newNode);
    if (newNode.selected) {
      selectedNodesById.set(newNode.id, newNode);
      selectedNodeTypes.add(newNode.type as NodeType);
    }
    return newNode;
  };

  const localNodes: RF.Node<DmnDiagramNodeData>[] = [
    ...(thisDmnsDefinitions.drgElement ?? []).flatMap((dmnObject, index) => {
      const newNode = ackNode({ type: "xml-qname", localPart: dmnObject["@_id"]! }, dmnObject, index);
      return newNode ? [newNode] : [];
    }),
    ...(thisDmnsDefinitions.artifact ?? []).flatMap((dmnObject, index) => {
      if (dmnObject.__$$element === "association") {
        return [];
      }

      const newNode = ackNode({ type: "xml-qname", localPart: dmnObject["@_id"]! }, dmnObject, index);
      return newNode ? [newNode] : [];
    }),
  ];

  const externalDrgElementsByIdByNamespace = [...externalModelTypesByNamespace.dmns.entries()].reduce(
    (acc, [namespace, externalDmn]) => {
      // Taking advantage of the loop to add the edges here...
      ackRequirementEdges(
        thisDmnsDefinitions["@_namespace"],
        externalDmn.model.definitions["@_namespace"],
        externalDmn.model.definitions.drgElement,
        ackEdge
      );

      return acc.set(
        namespace,
        (externalDmn.model.definitions.drgElement ?? []).reduce(
          (acc, e, index) => acc.set(e["@_id"]!, { element: e, index }),
          new Map<string, { index: number; element: Unpacked<DMN15__tDefinitions["drgElement"]> }>()
        )
      );
    },
    new Map<string, Map<string, { index: number; element: Unpacked<DMN15__tDefinitions["drgElement"]> }>>()
  );

  const externalNodes = [...indexes.dmnShapesByHref.entries()].flatMap(([href, shape]) => {
    if (nodesById.get(href)) {
      return [];
    }

    if (!nodesById.get(href) && !indexes.hrefsOfDmnElementRefsOfShapesPointingToExternalDmnObjects.has(href)) {
      // Unknown local node.
      console.warn(`DMN DIAGRAM: Found a shape that references a local DRG element that doesn't exist.`, shape);
      const newNode = ackNode(shape.dmnElementRefQName, null, -1);
      return newNode ? [newNode] : [];
    }

    const namespace = thisDmnsDefinitions[`@_xmlns:${shape.dmnElementRefQName.prefix}`];
    if (!namespace) {
      console.warn(
        `DMN DIAGRAM: Found a shape that references an external node with a namespace that is not declared at this DMN.`,
        shape
      );
      const newNode = ackNode(shape.dmnElementRefQName, null, -1);
      return newNode ? [newNode] : [];
    }

    const externalDrgElementsById = externalDrgElementsByIdByNamespace.get(namespace);
    if (!externalDrgElementsById) {
      console.warn(
        `DMN DIAGRAM: Found a shape that references an external node from a namespace that is not provided on this DMN's external DMNs mapping.`,
        shape
      );
      const newNode = ackNode(shape.dmnElementRefQName, null, -1);
      return newNode ? [newNode] : [];
    }

    const externalDrgElement = externalDrgElementsById.get(shape.dmnElementRefQName.localPart);
    if (!externalDrgElement) {
      console.warn(`DMN DIAGRAM: Found a shape that references a non-existent node from an external DMN.`, shape);
      const newNode = ackNode(shape.dmnElementRefQName, null, -1);
      return newNode ? [newNode] : [];
    }

    const newNode = ackNode(shape.dmnElementRefQName, externalDrgElement.element, externalDrgElement.index);
    return newNode ? [newNode] : [];
  });

  // Groups are always at the back. Decision Services after groups, then everything else.
  const sortedNodes = [...localNodes, ...externalNodes]
    .sort((a, b) => Number(b.type === NODE_TYPES.decisionService) - Number(a.type === NODE_TYPES.decisionService))
    .sort((a, b) => Number(b.type === NODE_TYPES.group) - Number(a.type === NODE_TYPES.group));

  // Selected edges go to the end of the array. This is necessary because z-index doesn't work on SVGs.
  const sortedEdges = edges
    .filter((e) => nodesById.has(e.source) && nodesById.has(e.target))
    .sort((a, b) => Number(selectedEdges.has(a.id)) - Number(selectedEdges.has(b.id)));

  // console.timeEnd("nodes");
  if (diagram.overlays.enableNodeHierarchyHighlight) {
    assignClassesToHighlightedHierarchyNodes(diagram._selectedNodes, nodesById, edgesById, drgEdges);
  }

  // Assign parents & z-index to NODES
  for (let i = 0; i < sortedNodes.length; i++) {
    const parentNodeData = parentIdsById.get(sortedNodes[i].id);
    if (parentNodeData) {
      sortedNodes[i].data.parentRfNode = nodesById.get(
        buildXmlHref({
          id: parentNodeData.dmnObjectQName.localPart,
          namespace: parentNodeData.dmnObjectNamespace,
          relativeToNamespace: thisDmnsDefinitions["@_namespace"],
        })
      );
      sortedNodes[i].extent = undefined; // Allows the node to be dragged freely outside of parent's bounds.
      sortedNodes[i].zIndex = NODE_LAYERS.NESTED_NODES;
    }

    if (sortedNodes[i].type === NODE_TYPES.group) {
      sortedNodes[i].zIndex = NODE_LAYERS.GROUP_NODE;
    } else if (sortedNodes[i].type === NODE_TYPES.decisionService) {
      sortedNodes[i].zIndex = NODE_LAYERS.DECISION_SERVICE_NODE;
    }
  }

  return {
    drgEdges,
    nodes: sortedNodes,
    edges: sortedEdges,
    edgesById,
    nodesById,
    selectedNodeTypes,
    selectedNodesById,
    selectedEdgesById,
    drgElementsWithoutVisualRepresentationOnCurrentDrd,
  };
}

function ackRequirementEdges(
  thisDmnsNamespace: string,
  drgElementsNamespace: string,
  drgElements: DMN15__tDefinitions["drgElement"],
  ackEdge: AckEdge
) {
  for (const drgElement of drgElements ?? []) {
    // information requirements
    if (drgElement.__$$element === "decision") {
      (drgElement.informationRequirement ?? []).forEach((ir, index) => {
        const irHref = parseXmlHref({
          href: (ir.requiredDecision ?? ir.requiredInput)!["@_href"],
          relativeToNamespace: drgElementsNamespace,
        });
        ackEdge({
          id: ir["@_id"]!,
          dmnObject: {
            namespace: drgElementsNamespace,
            type: drgElement.__$$element,
            id: drgElement["@_id"]!,
            requirementType: "informationRequirement",
            index,
          },
          type: EDGE_TYPES.informationRequirement,
          source: buildXmlHref({
            id: irHref.id,
            namespace: irHref.namespace,
            relativeToNamespace: thisDmnsNamespace,
          }),
          target: buildXmlHref({
            id: drgElement["@_id"]!,
            namespace: drgElementsNamespace,
            relativeToNamespace: thisDmnsNamespace,
          }),
        });
      });
    }
    // knowledge requirements
    if (drgElement.__$$element === "decision" || drgElement.__$$element === "businessKnowledgeModel") {
      (drgElement.knowledgeRequirement ?? []).forEach((kr, index) => {
        const krHref = parseXmlHref({
          href: kr.requiredKnowledge["@_href"],
          relativeToNamespace: drgElementsNamespace,
        });
        ackEdge({
          id: kr["@_id"]!,
          dmnObject: {
            namespace: drgElementsNamespace,
            type: drgElement.__$$element,
            id: drgElement["@_id"]!,
            requirementType: "knowledgeRequirement",
            index,
          },
          type: EDGE_TYPES.knowledgeRequirement,
          source: buildXmlHref({
            id: krHref.id,
            namespace: krHref.namespace,
            relativeToNamespace: thisDmnsNamespace,
          }),
          target: buildXmlHref({
            id: drgElement["@_id"]!,
            namespace: drgElementsNamespace,
            relativeToNamespace: thisDmnsNamespace,
          }),
        });
      });
    }
    // authority requirements
    if (
      drgElement.__$$element === "decision" ||
      drgElement.__$$element === "businessKnowledgeModel" ||
      drgElement.__$$element === "knowledgeSource"
    ) {
      (drgElement.authorityRequirement ?? []).forEach((ar, index) => {
        const arHref = parseXmlHref({
          href: (ar.requiredInput ?? ar.requiredDecision ?? ar.requiredAuthority)!["@_href"],
          relativeToNamespace: drgElementsNamespace,
        });
        ackEdge({
          id: ar["@_id"]!,
          dmnObject: {
            namespace: drgElementsNamespace,
            type: drgElement.__$$element,
            id: drgElement["@_id"]!,
            requirementType: "authorityRequirement",
            index,
          },
          type: EDGE_TYPES.authorityRequirement,
          source: buildXmlHref({
            id: arHref.id,
            namespace: arHref.namespace,
            relativeToNamespace: thisDmnsNamespace,
          }),
          target: buildXmlHref({
            id: drgElement["@_id"]!,
            namespace: drgElementsNamespace,
            relativeToNamespace: thisDmnsNamespace,
          }),
        });
      });
    }
  }
}

export function assignClassesToHighlightedHierarchyNodes(
  selected: string[],
  nodesById: Map<string, RF.Node>,
  edgesById: Map<string, RF.Edge>,
  drgEdges: DrgEdge[]
) {
  const nodeVisitor: NodeVisitor = (nodeId, traversalDirection) => {
    const node = nodesById.get(nodeId);
    if (node) {
      node.className = `hierarchy ${traversalDirection}`;
    }
  };

  const edgeVisitor: EdgeVisitor = (edge, traversalDirection) => {
    const rfEdge = edgesById.get(edge.id);
    if (rfEdge) {
      rfEdge.className = `hierarchy ${traversalDirection}`;
    }
  };

  const __selectedSet = new Set(selected);
  const __adjMatrix = getAdjMatrix(drgEdges);

  traverse(__adjMatrix, __selectedSet, selected, "up", nodeVisitor, edgeVisitor);
  traverse(__adjMatrix, __selectedSet, selected, "down", nodeVisitor, edgeVisitor); // Traverse "down" after "up" because when there's a cycle, highlighting a node as a dependency is preferable.
}
