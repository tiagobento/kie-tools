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
import { ContainmentMap, GraphStructure } from "@kie-tools/xyflow-react-kie-diagram/dist/graph/graphStructure";
import {
  BPMN20__tIntermediateCatchEvent,
  BPMN20__tLane,
  BPMN20__tProcess,
  BPMNDI__BPMNEdge,
  BPMNDI__BPMNShape,
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import {
  XyFlowReactKieDiagramEdgeData,
  XyFlowReactKieDiagramNodeData,
} from "@kie-tools/xyflow-react-kie-diagram/dist/store/State";
import { Normalized } from "../normalization/normalize";
import {
  DataObjectNode,
  EndEventNode,
  GatewayNode,
  GroupNode,
  IntermediateCatchEventNode,
  IntermediateThrowEventNode,
  LaneNode,
  StartEventNode,
  SubProcessNode,
  TaskNode,
  TextAnnotationNode,
  UnknownNode,
} from "./nodes/Nodes";
import {
  ConnectionLineEdgeMapping,
  ConnectionLineNodeMapping,
} from "@kie-tools/xyflow-react-kie-diagram/dist/edges/ConnectionLine";
import { SequenceFlowPath, AssociationPath } from "./edges/EdgeSvgs";
import {
  StartEventNodeSvg,
  IntermediateCatchEventNodeSvg,
  IntermediateThrowEventNodeSvg,
  EndEventNodeSvg,
  TaskNodeSvg,
  SubProcessNodeSvg,
  GatewayNodeSvg,
  TextAnnotationNodeSvg,
  LaneNodeSvg,
} from "./nodes/NodeSvgs";
import { SequenceFlowEdge, AssociationEdge } from "./edges/Edges";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { ElementExclusion, ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { switchExpression } from "@kie-tools-core/switch-expression-ts";
import {
  OutgoingStuffNodePanelEdgeMapping,
  OutgoingStuffNodePanelNodeMapping,
} from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/OutgoingStuffNodePanel";
import { CONTAINER_NODES_DESIRABLE_PADDING } from "@kie-tools/xyflow-react-kie-diagram/dist/maths/DcMaths";
import { NodeSizes } from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/NodeSizes";
import { SnapGrid, snapPoint } from "@kie-tools/xyflow-react-kie-diagram/dist/snapgrid/SnapGrid";

export const NODE_TYPES = {
  startEvent: "node_startEvent" as const,
  intermediateCatchEvent: "node_intermediateCatchEvent" as const,
  intermediateThrowEvent: "node_intermediateThrowEvent" as const,
  endEvent: "node_endEvent" as const,
  task: "node_task" as const,
  subProcess: "node_subProcess" as const,
  gateway: "node_gateway" as const,
  dataObject: "node_dataObject" as const,
  textAnnotation: "node_textAnnotation" as const,
  unknown: "node_unknown" as const,
  group: "node_group" as const,
  lane: "node_lane" as const,
  // custom: "node_custom" as const,
};

export const EDGE_TYPES = {
  sequenceFlow: "edge_sequenceFlow" as const,
  association: "edge_association" as const,
};

export type Values<T> = T[keyof T];
export type BpmnNodeType = Values<typeof NODE_TYPES>;
export type BpmnEdgeType = Values<typeof EDGE_TYPES>;

export enum ActivityNodeMarker {
  Compensation = "Compensation",
  MultiInstanceParallel = "MultiInstanceParallel",
  MultiInstanceSequential = "MultiInstanceSequential",
  Collapsed = "Collapsed",
  Loop = "Loop",
  AdHocSubProcess = "AdHocSubProcess",
}

export const BPMN_GRAPH_STRUCTURE: GraphStructure<BpmnNodeType, BpmnEdgeType> = new Map([
  [
    NODE_TYPES.startEvent,
    new Map<BpmnEdgeType, Set<BpmnNodeType>>([
      [
        EDGE_TYPES.sequenceFlow,
        new Set([
          NODE_TYPES.task,
          NODE_TYPES.intermediateCatchEvent,
          NODE_TYPES.intermediateThrowEvent,
          NODE_TYPES.gateway,
        ]),
      ],
      [EDGE_TYPES.association, new Set([NODE_TYPES.textAnnotation])],
    ]),
  ],
  [
    NODE_TYPES.task,
    new Map<BpmnEdgeType, Set<BpmnNodeType>>([
      [
        EDGE_TYPES.sequenceFlow,
        new Set([
          NODE_TYPES.task,
          NODE_TYPES.gateway,
          NODE_TYPES.intermediateCatchEvent,
          NODE_TYPES.intermediateThrowEvent,
          NODE_TYPES.endEvent,
        ]),
      ],
      [EDGE_TYPES.association, new Set([NODE_TYPES.textAnnotation])],
    ]),
  ],
  [
    NODE_TYPES.intermediateCatchEvent,
    new Map<BpmnEdgeType, Set<BpmnNodeType>>([
      [
        EDGE_TYPES.sequenceFlow,
        new Set([
          NODE_TYPES.task,
          NODE_TYPES.gateway,
          NODE_TYPES.intermediateCatchEvent,
          NODE_TYPES.intermediateThrowEvent,
          NODE_TYPES.endEvent,
        ]),
      ],
      [EDGE_TYPES.association, new Set([NODE_TYPES.textAnnotation])],
    ]),
  ],
  [
    NODE_TYPES.intermediateThrowEvent,
    new Map<BpmnEdgeType, Set<BpmnNodeType>>([
      [
        EDGE_TYPES.sequenceFlow,
        new Set([
          NODE_TYPES.task,
          NODE_TYPES.gateway,
          NODE_TYPES.intermediateCatchEvent,
          NODE_TYPES.intermediateThrowEvent,
          NODE_TYPES.endEvent,
        ]),
      ],
      [EDGE_TYPES.association, new Set([NODE_TYPES.textAnnotation])],
    ]),
  ],
  [
    NODE_TYPES.gateway,
    new Map<BpmnEdgeType, Set<BpmnNodeType>>([
      [
        EDGE_TYPES.sequenceFlow,
        new Set([
          NODE_TYPES.task,
          NODE_TYPES.gateway,
          NODE_TYPES.intermediateCatchEvent,
          NODE_TYPES.intermediateThrowEvent,
          NODE_TYPES.endEvent,
        ]),
      ],
      [EDGE_TYPES.association, new Set([NODE_TYPES.textAnnotation])],
    ]),
  ],
  [
    NODE_TYPES.endEvent,
    new Map<BpmnEdgeType, Set<BpmnNodeType>>([[EDGE_TYPES.association, new Set([NODE_TYPES.textAnnotation])]]),
  ],
  [
    NODE_TYPES.dataObject,
    new Map<BpmnEdgeType, Set<BpmnNodeType>>([[EDGE_TYPES.association, new Set([NODE_TYPES.textAnnotation])]]),
  ],
  [
    NODE_TYPES.group,
    new Map<BpmnEdgeType, Set<BpmnNodeType>>([[EDGE_TYPES.association, new Set([NODE_TYPES.textAnnotation])]]),
  ],
  [
    NODE_TYPES.lane,
    new Map<BpmnEdgeType, Set<BpmnNodeType>>([[EDGE_TYPES.association, new Set([NODE_TYPES.textAnnotation])]]),
  ],
  [
    NODE_TYPES.textAnnotation,
    new Map<BpmnEdgeType, Set<BpmnNodeType>>([
      [
        EDGE_TYPES.association,
        new Set([
          NODE_TYPES.startEvent,
          NODE_TYPES.task,
          NODE_TYPES.intermediateCatchEvent,
          NODE_TYPES.intermediateThrowEvent,
          NODE_TYPES.gateway,
          NODE_TYPES.endEvent,
          NODE_TYPES.dataObject,
          NODE_TYPES.lane,
        ]),
      ],
    ]),
  ],
]);

export const BPMN_CONTAINMENT_MAP: ContainmentMap<BpmnNodeType> = new Map([
  [NODE_TYPES.lane, new Set([])],
  [NODE_TYPES.subProcess, new Set([])],
]);

export const CONNECTION_LINE_EDGE_COMPONENTS_MAPPING: ConnectionLineEdgeMapping<BpmnEdgeType> = {
  [EDGE_TYPES.sequenceFlow]: SequenceFlowPath,
  [EDGE_TYPES.association]: AssociationPath,
};

export const CONNECTION_LINE_NODE_COMPONENT_MAPPING: ConnectionLineNodeMapping<BpmnNodeType> = {
  [NODE_TYPES.startEvent]: StartEventNodeSvg,
  [NODE_TYPES.intermediateCatchEvent]: IntermediateCatchEventNodeSvg,
  [NODE_TYPES.intermediateThrowEvent]: IntermediateThrowEventNodeSvg,
  [NODE_TYPES.endEvent]: EndEventNodeSvg,
  [NODE_TYPES.task]: TaskNodeSvg,
  [NODE_TYPES.subProcess]: SubProcessNodeSvg,
  [NODE_TYPES.gateway]: GatewayNodeSvg,
  [NODE_TYPES.textAnnotation]: TextAnnotationNodeSvg,
  [NODE_TYPES.lane]: LaneNodeSvg,
  // Ignore
  node_dataObject: undefined as any,
  node_unknown: undefined as any,
  node_group: undefined as any,
};

export const XY_FLOW_NODE_TYPES: Record<BpmnNodeType, any> = {
  [NODE_TYPES.startEvent]: StartEventNode,
  [NODE_TYPES.intermediateCatchEvent]: IntermediateCatchEventNode,
  [NODE_TYPES.intermediateThrowEvent]: IntermediateThrowEventNode,
  [NODE_TYPES.endEvent]: EndEventNode,
  [NODE_TYPES.task]: TaskNode,
  [NODE_TYPES.subProcess]: SubProcessNode,
  [NODE_TYPES.gateway]: GatewayNode,
  [NODE_TYPES.group]: GroupNode,
  [NODE_TYPES.textAnnotation]: TextAnnotationNode,
  [NODE_TYPES.dataObject]: DataObjectNode,
  [NODE_TYPES.lane]: LaneNode,
  [NODE_TYPES.unknown]: UnknownNode,
};

export const XY_FLOW_EDGE_TYPES: Record<BpmnEdgeType, any> = {
  [EDGE_TYPES.sequenceFlow]: SequenceFlowEdge,
  [EDGE_TYPES.association]: AssociationEdge,
};

export interface BpmnDiagramNodeData<T extends BpmnNodeElement = BpmnNodeElement>
  extends XyFlowReactKieDiagramNodeData<BpmnNodeType, BpmnDiagramNodeData> {
  bpmnElement: T;
  shape: Normalized<BPMNDI__BPMNShape>;
  shapeIndex: number;
  index: number;
}

export interface BpmnDiagramEdgeData extends XyFlowReactKieDiagramEdgeData {
  bpmnEdge: Normalized<BPMNDI__BPMNEdge> | undefined;
  bpmnEdgeIndex: number;
  bpmnElement: BpmnEdgeElement;
  bpmnShapeSource: Normalized<BPMNDI__BPMNShape> | undefined;
  bpmnShapeTarget: Normalized<BPMNDI__BPMNShape> | undefined;
}

export const BPMN_OUTGOING_STRUCTURE = {
  [NODE_TYPES.startEvent]: {
    nodes: [
      NODE_TYPES.task,
      NODE_TYPES.gateway,
      NODE_TYPES.intermediateCatchEvent,
      NODE_TYPES.intermediateThrowEvent,
      NODE_TYPES.textAnnotation,
    ],
    edges: [EDGE_TYPES.sequenceFlow, EDGE_TYPES.association],
  },
  [NODE_TYPES.intermediateCatchEvent]: {
    nodes: [
      NODE_TYPES.task,
      NODE_TYPES.gateway,
      NODE_TYPES.intermediateCatchEvent,
      NODE_TYPES.intermediateThrowEvent,
      NODE_TYPES.endEvent,
      NODE_TYPES.textAnnotation,
    ],
    edges: [EDGE_TYPES.sequenceFlow, EDGE_TYPES.association],
  },
  [NODE_TYPES.intermediateThrowEvent]: {
    nodes: [
      NODE_TYPES.task,
      NODE_TYPES.gateway,
      NODE_TYPES.intermediateCatchEvent,
      NODE_TYPES.intermediateThrowEvent,
      NODE_TYPES.endEvent,
      NODE_TYPES.textAnnotation,
    ],
    edges: [EDGE_TYPES.sequenceFlow, EDGE_TYPES.association],
  },
  [NODE_TYPES.endEvent]: {
    nodes: [NODE_TYPES.textAnnotation],
    edges: [EDGE_TYPES.association],
  },
  [NODE_TYPES.task]: {
    nodes: [
      NODE_TYPES.task,
      NODE_TYPES.gateway,
      NODE_TYPES.intermediateCatchEvent,
      NODE_TYPES.intermediateThrowEvent,
      NODE_TYPES.endEvent,
      NODE_TYPES.textAnnotation,
    ],
    edges: [EDGE_TYPES.sequenceFlow, EDGE_TYPES.association],
  },
  [NODE_TYPES.subProcess]: {
    nodes: [
      NODE_TYPES.task,
      NODE_TYPES.gateway,
      NODE_TYPES.intermediateCatchEvent,
      NODE_TYPES.intermediateThrowEvent,
      NODE_TYPES.endEvent,
      NODE_TYPES.textAnnotation,
    ],
    edges: [EDGE_TYPES.sequenceFlow, EDGE_TYPES.association],
  },
  [NODE_TYPES.gateway]: {
    nodes: [
      NODE_TYPES.task,
      NODE_TYPES.gateway,
      NODE_TYPES.intermediateCatchEvent,
      NODE_TYPES.intermediateThrowEvent,
      NODE_TYPES.endEvent,
      NODE_TYPES.textAnnotation,
    ],
    edges: [EDGE_TYPES.sequenceFlow, EDGE_TYPES.association],
  },
  [NODE_TYPES.dataObject]: {
    nodes: [NODE_TYPES.textAnnotation],
    edges: [EDGE_TYPES.association],
  },
  [NODE_TYPES.group]: {
    nodes: [NODE_TYPES.textAnnotation],
    edges: [EDGE_TYPES.association],
  },
  [NODE_TYPES.lane]: {
    nodes: [NODE_TYPES.textAnnotation],
    edges: [EDGE_TYPES.association],
  },
  [NODE_TYPES.textAnnotation]: {
    nodes: [],
    edges: [EDGE_TYPES.association],
  },
};

export const bpmnEdgesOutgoingStuffNodePanelMapping: OutgoingStuffNodePanelEdgeMapping<BpmnEdgeType> = {
  [EDGE_TYPES.sequenceFlow]: {
    actionTitle: "Add Sequence Flow",
    icon: ({ viewboxSize }) => <SequenceFlowPath d={`M2,${viewboxSize - 2} L${viewboxSize - 2},0`} />,
  },
  [EDGE_TYPES.association]: {
    actionTitle: "Add Association",
    icon: ({ viewboxSize }) => <AssociationPath d={`M2,${viewboxSize - 2} L${viewboxSize},0`} strokeWidth={2} />,
  },
};

export const bpmnNodesOutgoingStuffNodePanelMapping: OutgoingStuffNodePanelNodeMapping<
  Exclude<
    BpmnNodeType,
    typeof NODE_TYPES.dataObject | typeof NODE_TYPES.unknown | typeof NODE_TYPES.group | typeof NODE_TYPES.lane
  >
> = {
  [NODE_TYPES.startEvent]: {
    actionTitle: "Add Start Event",
    icon: (nodeSvgProps) => <StartEventNodeSvg {...nodeSvgProps} variant={"none"} />,
  },
  [NODE_TYPES.intermediateCatchEvent]: {
    actionTitle: "Add Intermediate Catch Event",
    icon: (nodeSvgProps) => <IntermediateCatchEventNodeSvg {...nodeSvgProps} variant={"none"} />,
  },
  [NODE_TYPES.intermediateThrowEvent]: {
    actionTitle: "Add Intermediate Throw Event",
    icon: (nodeSvgProps) => <IntermediateThrowEventNodeSvg {...nodeSvgProps} variant={"none"} />,
  },
  [NODE_TYPES.endEvent]: {
    actionTitle: "Add End Event",
    icon: (nodeSvgProps) => <EndEventNodeSvg {...nodeSvgProps} variant={"none"} />,
  },
  [NODE_TYPES.task]: {
    actionTitle: "Add Task",
    icon: (nodeSvgProps) => <TaskNodeSvg {...nodeSvgProps} />,
  },
  [NODE_TYPES.subProcess]: {
    actionTitle: "Add Sub-Process",
    icon: (nodeSvgProps) => <TaskNodeSvg {...nodeSvgProps} icons={["CallActivityPaletteIcon"]} />,
  },
  [NODE_TYPES.gateway]: {
    actionTitle: "Add Gateway",
    icon: (nodeSvgProps) => (
      <GatewayNodeSvg
        {...nodeSvgProps}
        height={nodeSvgProps.width}
        variant={"none"}
        x={nodeSvgProps.x}
        y={nodeSvgProps.y - 8}
      />
    ),
  },
  [NODE_TYPES.textAnnotation]: {
    actionTitle: "Add Text Annotation",
    icon: (nodeSvgProps) => <TextAnnotationNodeSvg {...nodeSvgProps} />,
  },
};

export const MIN_NODE_SIZES: NodeSizes<BpmnNodeType> = {
  [NODE_TYPES.startEvent]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 10, 10);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.intermediateCatchEvent]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 10, 10);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.intermediateThrowEvent]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 10, 10);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.endEvent]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 10, 10);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.task]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.subProcess]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.gateway]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 10, 10);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.dataObject]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, NODE_MIN_WIDTH / 2, NODE_MIN_HEIGHT + 20);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.group]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(
      snapGrid,
      NODE_MIN_WIDTH + CONTAINER_NODES_DESIRABLE_PADDING * 2,
      NODE_MIN_HEIGHT + CONTAINER_NODES_DESIRABLE_PADDING * 2
    );
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.textAnnotation]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 200, 60);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.lane]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.unknown]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
};

export const DEFAULT_NODE_SIZES: NodeSizes<BpmnNodeType> = {
  [NODE_TYPES.startEvent]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 60, 60);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.intermediateCatchEvent]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 60, 60);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.intermediateThrowEvent]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 60, 60);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.endEvent]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 60, 60);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.task]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 180, 90);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.subProcess]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 360, 180);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.gateway]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 60, 60);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.dataObject]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, NODE_MIN_WIDTH / 2, NODE_MIN_HEIGHT + 20);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.group]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, NODE_MIN_WIDTH * 2, NODE_MIN_WIDTH * 2); // This is not a mistake, we want the Group node to be a bigger square.
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.textAnnotation]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 180, 180);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.lane]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 360, 180);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.unknown]: ({ snapGrid }) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
};

export const NODE_MIN_WIDTH = 120;
export const NODE_MIN_HEIGHT = 60;

export const MIN_SIZE_FOR_NODES = (grid: SnapGrid, width = NODE_MIN_WIDTH, height = NODE_MIN_HEIGHT) => {
  const snapped = snapPoint(grid, { "@_x": width, "@_y": height }, "ceil");
  return { width: snapped["@_x"], height: snapped["@_y"] };
};

////

export type BpmnEdgeElement = null | Normalized<
  | ElementFilter<Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>, "sequenceFlow">
  | ElementFilter<Unpacked<NonNullable<BPMN20__tProcess["artifact"]>>, "association">
>;

export type BpmnNodeElement = null | Normalized<
  | ElementExclusion<Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>, "sequenceFlow">
  | ElementExclusion<Unpacked<NonNullable<BPMN20__tProcess["artifact"]>>, "association">
  | (BPMN20__tLane & { __$$element: "lane" })
>;

export function getNodeTypeFromBpmnElement(bpmnElement: BpmnNodeElement) {
  if (!bpmnElement) {
    return NODE_TYPES.unknown;
  }

  const type = switchExpression(bpmnElement.__$$element, {
    dataObject: NODE_TYPES.dataObject,
    task: NODE_TYPES.task,
    lane: NODE_TYPES.lane,
    textAnnotation: NODE_TYPES.textAnnotation,
    default: undefined,
  });

  return type;
}

export type GatewayVariant = ElementFilter<
  Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
  "complexGateway" | "eventBasedGateway" | "exclusiveGateway" | "inclusiveGateway" | "parallelGateway"
>["__$$element"];

export type EventVariant = ElementFilter<
  Unpacked<NonNullable<BPMN20__tIntermediateCatchEvent["eventDefinition"]>>,
  | "cancelEventDefinition"
  | "compensateEventDefinition"
  | "conditionalEventDefinition"
  | "errorEventDefinition"
  | "escalationEventDefinition"
  | "linkEventDefinition"
  | "messageEventDefinition"
  | "signalEventDefinition"
  | "terminateEventDefinition"
  | "timerEventDefinition"
>["__$$element"];

export const elementToNodeType: Record<NonNullable<BpmnNodeElement>["__$$element"], BpmnNodeType> = {
  // lane
  lane: NODE_TYPES.lane,
  // events
  startEvent: NODE_TYPES.startEvent,
  boundaryEvent: NODE_TYPES.intermediateCatchEvent,
  intermediateCatchEvent: NODE_TYPES.intermediateCatchEvent,
  intermediateThrowEvent: NODE_TYPES.intermediateThrowEvent,
  endEvent: NODE_TYPES.endEvent,
  // tasks
  callActivity: NODE_TYPES.task,
  task: NODE_TYPES.task,
  businessRuleTask: NODE_TYPES.task,
  userTask: NODE_TYPES.task,
  scriptTask: NODE_TYPES.task,
  serviceTask: NODE_TYPES.task,
  // subprocess
  subProcess: NODE_TYPES.subProcess,
  adHocSubProcess: NODE_TYPES.subProcess,
  transaction: NODE_TYPES.subProcess,
  // gateway
  complexGateway: NODE_TYPES.gateway,
  eventBasedGateway: NODE_TYPES.gateway,
  exclusiveGateway: NODE_TYPES.gateway,
  inclusiveGateway: NODE_TYPES.gateway,
  parallelGateway: NODE_TYPES.gateway,
  // misc
  dataObject: NODE_TYPES.dataObject,
  // artifacts
  group: NODE_TYPES.group,
  textAnnotation: NODE_TYPES.textAnnotation,
  //
  // unknown
  //
  event: NODE_TYPES.unknown,
  manualTask: NODE_TYPES.unknown,
  sendTask: NODE_TYPES.unknown,
  receiveTask: NODE_TYPES.unknown,
  callChoreography: NODE_TYPES.unknown,
  choreographyTask: NODE_TYPES.unknown,
  implicitThrowEvent: NODE_TYPES.unknown,
  subChoreography: NODE_TYPES.unknown,
  // edges (ignore)
  dataObjectReference: NODE_TYPES.unknown,
  dataStoreReference: NODE_TYPES.unknown,
} as const;

export const elementToEdgeType: Record<NonNullable<BpmnEdgeElement>["__$$element"], BpmnEdgeType> = {
  association: EDGE_TYPES.association,
  sequenceFlow: EDGE_TYPES.sequenceFlow,
};
