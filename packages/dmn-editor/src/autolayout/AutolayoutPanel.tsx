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

import * as React from "react";
import { generateUuid } from "@kie-tools/boxed-expression-component/dist/api";
import { DC__Bounds, DMNDI15__DMNShape } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { XmlQName, parseXmlQName } from "@kie-tools/xml-parser-ts/dist/qNames";
import { Button } from "@patternfly/react-core/dist/js/components/Button";
import ELK, * as Elk from "elkjs/lib/elk.bundled.js";
import { useCallback } from "react";
import { KIE_DMN_UNKNOWN_NAMESPACE } from "../Dmn15Spec";
import { NodeType } from "../diagram/connections/graphStructure";
import { getAdjMatrix, traverse } from "../diagram/graph/graph";
import { getContainmentRelationship } from "../diagram/maths/DmnMaths";
import { DEFAULT_NODE_SIZES, MIN_NODE_SIZES } from "../diagram/nodes/DefaultSizes";
import { NODE_TYPES } from "../diagram/nodes/NodeTypes";
import { repositionNode } from "../mutations/repositionNode";
import { resizeNode } from "../mutations/resizeNode";
import { useDmnEditorStoreApi } from "../store/Store";
import { buildXmlHref } from "../xml/xmlHrefs";

const elk = new ELK();

export const ELK_OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "UP",
  // By making width a lot bigger than height, we make sure disjoint graph components are placed horizontally, never vertically
  "elk.aspectRatio": "9999999999",
  // spacing
  "elk.spacing.nodeNode": "60",
  "elk.spacing.componentComponent": "200",
  "layered.spacing.edgeEdgeBetweenLayers": "0",
  "layered.spacing.edgeNodeBetweenLayers": "0",
  "layered.spacing.nodeNodeBetweenLayers": "100",
  // edges
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.layered.mergeEdges": "true", // we need this to make sure space is consistent between layers.
  "elk.layered.mergeHierarchyEdges": "true",
  // positioning
  "elk.partitioning.activate": "true",
  "elk.nodePlacement.favorStraightEdges": "true",
  "elk.nodePlacement.bk.fixedAlignment": "LEFTDOWN",
  "elk.nodePlacement.bk.edgeStraightening": "IMPROVE_STRAIGHTNESS",
};

const PARENT_NODE_ELK_OPTIONS = {
  "elk.padding": "[left=60, top=60, right=60, bottom=30]",
  "elk.spacing.componentComponent": "60",
};

export interface AutolayoutParentNode {
  elkNode: Elk.ElkNode;
  contained: Set<string>;
  dependents: Set<string>;
  dependencies: Set<string>;
  contains: (otherNode: { id: string; bounds: DC__Bounds | undefined }) => boolean;
  hasDependencyTo: (otherNode: { id: string }) => boolean;
  isDependencyOf: (otherNode: { id: string }) => boolean;
}

export function AutolayoutPanel() {
  const dmnEditorStoreApi = useDmnEditorStoreApi();

  const onApply = useCallback(async () => {
    const parentNodesById = new Map<string, AutolayoutParentNode>();
    const nodeParentsById = new Map<string, Set<string>>();

    /**
      Used to tell ELK that dependencies of nodes' children should be considered the node's dependency too.
      This allows us to not rely on INCLUDE_STRATEGY hierarchy handling on ELK, keeping disjoint graph components separate, rendering side-by-side.
     */
    const fakeEdgesForElk = new Set<Elk.ElkExtendedEdge>();

    const snapGrid = dmnEditorStoreApi.getState().diagram.snapGrid;
    const nodesById = dmnEditorStoreApi.getState().computed.diagramData.nodesById;
    const edgesById = dmnEditorStoreApi.getState().computed.diagramData.edgesById;
    const nodes = [...nodesById.values()];
    const edges = [...edgesById.values()];

    const adjMatrix = getAdjMatrix(edges);

    // 1. First we populate the `parentNodesById` map so that we know exactly what parent nodes we're dealing with.
    for (const node of nodes) {
      const dependencies = new Set<string>();
      const dependents = new Set<string>();

      if (node.data?.dmnObject?.__$$element === "decisionService") {
        const contained = new Set([
          ...(node.data.dmnObject.encapsulatedDecision ?? []).map((s) => s["@_href"]),
          ...(node.data.dmnObject.outputDecision ?? []).map((s) => s["@_href"]),
        ]);

        const dsSize = DEFAULT_NODE_SIZES[NODE_TYPES.decisionService](snapGrid);
        parentNodesById.set(node.id, {
          elkNode: {
            id: node.id,
            width: node.data.shape["dc:Bounds"]?.["@_width"] ?? dsSize["@_width"],
            height: node.data.shape["dc:Bounds"]?.["@_height"] ?? dsSize["@_height"],
            children: [],
            layoutOptions: {
              ...ELK_OPTIONS,
              ...PARENT_NODE_ELK_OPTIONS,
            },
          },
          dependencies,
          dependents,
          contained,
          contains: ({ id }) => contained.has(id),
          isDependencyOf: ({ id }) => dependents.has(id),
          hasDependencyTo: ({ id }) => dependencies.has(id),
        });
      } else if (node.data?.dmnObject?.__$$element === "group") {
        const groupSize = DEFAULT_NODE_SIZES[NODE_TYPES.group](snapGrid);
        const groupBounds = node.data.shape["dc:Bounds"];
        parentNodesById.set(node.id, {
          elkNode: {
            id: node.id,
            width: groupBounds?.["@_width"] ?? groupSize["@_width"],
            height: groupBounds?.["@_height"] ?? groupSize["@_height"],
            children: [],
            layoutOptions: {
              ...ELK_OPTIONS,
              ...PARENT_NODE_ELK_OPTIONS,
            },
          },
          dependencies,
          dependents,
          contained: new Set(),
          contains: ({ id, bounds }) =>
            getContainmentRelationship({
              bounds: bounds!,
              container: groupBounds!,
              snapGrid,
              containerMinSizes: MIN_NODE_SIZES[NODE_TYPES.group],
              boundsMinSizes: MIN_NODE_SIZES[nodesById.get(id)?.type as NodeType],
            }).isInside,
          isDependencyOf: ({ id }) => dependents.has(id),
          hasDependencyTo: ({ id }) => dependencies.has(id),
        });
      }
    }

    // 2. Then we map all the nodes to elkNodes, including the parents. We mutate parents on the fly when iterating over the nodes list.
    const elkNodes = nodes.flatMap((node) => {
      const parent = parentNodesById.get(node.id);
      if (parent) {
        return [];
      }

      const defaultSize = DEFAULT_NODE_SIZES[node.type as NodeType](snapGrid);
      const elkNode: Elk.ElkNode = {
        id: node.id,
        width: node.data.shape["dc:Bounds"]?.["@_width"] ?? defaultSize["@_width"],
        height: node.data.shape["dc:Bounds"]?.["@_height"] ?? defaultSize["@_height"],
        children: [],
        layoutOptions: {
          "partitioning.partition":
            // Since textAnnotations and knowledgeSources are not related to the logic, we leave them at the bottom.
            (node.type as NodeType) === NODE_TYPES.textAnnotation ||
            (node.type as NodeType) === NODE_TYPES.knowledgeSource
              ? "0"
              : "1",
        },
      };

      // FIXME: Tiago --> Improve performance here.
      const parents = [...parentNodesById.values()].filter((p) =>
        p.contains({ id: elkNode.id, bounds: node.data.shape["dc:Bounds"] })
      );
      if (parents.length > 0) {
        parents[0].elkNode.children?.push(elkNode); // The only relationship that ELK will know about is the first matching container for this node.
        for (const p of parents) {
          p.contained?.add(elkNode.id); // We need to keep track of nodes that are contained by multiple groups, but ELK will only know about one of those containment relationships.
          nodeParentsById.set(node.id, new Set([...(nodeParentsById.get(node.id) ?? []), p.elkNode.id]));
        }
        return [];
      }

      return [elkNode];
    });

    // 3. After we have all containment relationships defined, we can proceed to resolving the hierarchical relationships.
    for (const [_, parentNode] of parentNodesById) {
      traverse(adjMatrix, parentNode.contained, [...parentNode.contained], "down", (n) => {
        parentNode.dependencies.add(n);
      });
      traverse(adjMatrix, parentNode.contained, [...parentNode.contained], "up", (n) => {
        parentNode.dependents.add(n);
      });

      const p = nodesById.get(parentNode.elkNode.id);
      if (p?.type === NODE_TYPES.group && parentNode.elkNode.children?.length === 0) {
        continue; // Ignore empty group nodes.
      } else {
        elkNodes.push(parentNode.elkNode);
      }
    }

    // 4. After we have all containment and hierarchical relationships defined, we can add the fake edges so that ELK creates the structure correctly.
    for (const node of nodes) {
      const parentNodes = [...parentNodesById.values()];

      const dependents = parentNodes.filter((p) => p.hasDependencyTo({ id: node.id }));
      for (const dependent of dependents) {
        fakeEdgesForElk.add({
          id: generateUuid(),
          sources: [node.id],
          targets: [dependent.elkNode.id],
        });

        for (const p of nodeParentsById.get(node.id) ?? []) {
          fakeEdgesForElk.add({
            id: generateUuid(),
            sources: [p],
            targets: [dependent.elkNode.id],
          });
        }
      }

      const dependencies = parentNodes.filter((p) => p.isDependencyOf({ id: node.id }));
      for (const dependency of dependencies) {
        fakeEdgesForElk.add({
          id: generateUuid(),
          sources: [dependency.elkNode.id],
          targets: [node.id],
        });

        for (const p of nodeParentsById.get(node.id) ?? []) {
          fakeEdgesForElk.add({
            id: generateUuid(),
            sources: [dependency.elkNode.id],
            targets: [p],
          });
        }
      }
    }

    // 5. Concatenate real and fake edges to pass to ELK.
    const elkEdges = [
      ...fakeEdgesForElk,
      ...[...edgesById.values()].map((e) => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      })),
    ];

    // 6. Run ELK.
    const autolayouted = await runElk(elkNodes, elkEdges, ELK_OPTIONS);

    // 7. Update all nodes positions skipping empty groups, which will be positioned manually after all nodes are done being repositioned.
    dmnEditorStoreApi.setState((s) => {
      for (const topLevelElkNode of autolayouted.nodes ?? []) {
        visitNodeAndNested(topLevelElkNode, { x: 100, y: 100 }, (elkNode, positionOffset) => {
          const nodeId = elkNode.id;
          const node = nodesById.get(nodeId)!;

          repositionNode({
            definitions: s.dmn.model.definitions,
            drdIndex: s.diagram.drdIndex,
            controlWaypointsByEdge: new Map(),
            change: {
              nodeType: node.type as NodeType,
              type: "absolute",
              position: {
                x: elkNode.x! + positionOffset.x,
                y: elkNode.y! + positionOffset.y,
              },
              selectedEdges: [...edgesById.keys()],
              shapeIndex: node.data?.shape.index,
              sourceEdgeIndexes: edges.flatMap((e) =>
                e.source === nodeId && e.data?.dmnEdge ? [e.data.dmnEdge.index] : []
              ),
              targetEdgeIndexes: edges.flatMap((e) =>
                e.target === nodeId && e.data?.dmnEdge ? [e.data.dmnEdge.index] : []
              ),
            },
          });
        });
      }

      // 8. Recalculate `dmnShapesByHref`, as the state has just changed.
      //
      // THIS WHOLE BLOCK IS COPY/PASTED....
      // WE NEED TO MOVE ALL THE NODES, AND ONLY THEN RESIZE THEM.
      const dmnShapesByHref = new Map<string, DMNDI15__DMNShape & { index: number; dmnElementRefQName: XmlQName }>();
      const diagramElements =
        s.dmn.model.definitions["dmndi:DMNDI"]?.["dmndi:DMNDiagram"]?.[s.diagram.drdIndex]["dmndi:DMNDiagramElement"] ??
        [];
      for (let i = 0; i < diagramElements.length; i++) {
        const e = diagramElements[i];

        // DMNShape
        if (e.__$$element === "dmndi:DMNShape") {
          let href: string;
          // @_dmnElementRef is a xsd:QName, meaning it can be prefixed with a namespace name.
          // If we find the namespace as a namespace declaration on the `definitions` object, then this shape represents a node from an included model.
          // Therefore, we need to add it to `dmnShapesForExternalNodesByDmnRefId`, so we can draw these nodes.
          // Do not skip adding it to the regular `dmnShapesByHref`, as nodes will query this.
          const dmnElementRefQName = parseXmlQName(e["@_dmnElementRef"]);
          if (dmnElementRefQName.prefix) {
            const namespace =
              s.dmn.model.definitions[`@_xmlns:${dmnElementRefQName.prefix}`] ?? KIE_DMN_UNKNOWN_NAMESPACE;
            href = buildXmlHref({ namespace, id: dmnElementRefQName.localPart });
          } else {
            href = buildXmlHref({ id: dmnElementRefQName.localPart });
          }

          dmnShapesByHref.set(href, { ...e, index: i, dmnElementRefQName });
        }
      }
      // ....UNTIL HERE.

      // 9. Resize all nodes using the sizes calculated by ELK.
      for (const topLevelElkNode of autolayouted.nodes ?? []) {
        visitNodeAndNested(topLevelElkNode, { x: 0, y: 0 }, (elkNode) => {
          const nodeId = elkNode.id;
          const node = nodesById.get(nodeId)!;
          resizeNode({
            definitions: s.dmn.model.definitions,
            drdIndex: s.diagram.drdIndex,
            dmnShapesByHref,
            snapGrid,
            change: {
              index: node.data.index,
              isExternal: !!node.data.dmnObjectQName.prefix,
              nodeType: node.type as NodeType,
              dimension: {
                "@_width": elkNode.width!,
                "@_height": elkNode.height!,
              },
              shapeIndex: node.data?.shape.index,
              sourceEdgeIndexes: edges.flatMap((e) =>
                e.source === nodeId && e.data?.dmnEdge ? [e.data.dmnEdge.index] : []
              ),
              targetEdgeIndexes: edges.flatMap((e) =>
                e.target === nodeId && e.data?.dmnEdge ? [e.data.dmnEdge.index] : []
              ),
            },
          });
        });

        // 10. After all nodes have been repositioned, it's time for the empty groups to be repositioned.
      }
    });
  }, [dmnEditorStoreApi]);

  return <Button onClick={onApply}>Apply</Button>;
}

//

export async function runElk(
  nodes: Elk.ElkNode[],
  edges: { id: string; sources: string[]; targets: string[] }[],
  options: Elk.LayoutOptions = {}
): Promise<{ isHorizontal: boolean; nodes: Elk.ElkNode[] | undefined; edges: Elk.ElkExtendedEdge[] | undefined }> {
  const isHorizontal = options?.["elk.direction"] === "RIGHT";

  const graph: Elk.ElkNode = {
    id: "root",
    layoutOptions: (window as any).elkOptions ?? options, // FIXME: Tiago --> Remove this. Debug only.
    children: nodes,
    edges,
  };

  try {
    const layoutedGraph = await elk.layout(graph);
    return {
      isHorizontal,
      nodes: layoutedGraph.children,
      edges: layoutedGraph.edges as any[],
    };
  } catch (e) {
    throw new Error("Error executing autolayout.", e);
  }
}

function visitNodeAndNested(
  elkNode: Elk.ElkNode,
  positionOffset: { x: number; y: number },
  visitor: (elkNode: Elk.ElkNode, positionOffset: { x: number; y: number }) => void
) {
  visitor(elkNode, positionOffset);
  for (const nestedNode of elkNode.children ?? []) {
    visitNodeAndNested(
      nestedNode,
      {
        x: elkNode.x! + positionOffset.x,
        y: elkNode.y! + positionOffset.y,
      },
      visitor
    );
  }
}
