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

import { DmnBuiltInDataType } from "@kie-tools/boxed-expression-component/dist/api";
import {
  DMN15__tBusinessKnowledgeModel,
  DMN15__tDecision,
  DMN15__tDecisionService,
  DMN15__tDefinitions,
  DMN15__tGroup,
  DMN15__tInputData,
  DMN15__tKnowledgeSource,
  DMN15__tTextAnnotation,
  DMNDI15__DMNShape,
} from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { XmlQName } from "@kie-tools/xml-parser-ts/dist/qNames";
import { drag } from "d3-drag";
import { select } from "d3-selection";
import * as React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as RF from "reactflow";
import { OnCreateDataType, OnTypeRefChange } from "../../dataTypes/TypeRefSelector";
import { addTopLevelItemDefinition } from "../../mutations/addTopLevelItemDefinition";
import { renameDrgElement, renameGroupNode, updateTextAnnotation } from "../../mutations/renameNode";
import { updateDecisionServiceDividerLine } from "../../mutations/updateDecisionServiceDividerLine";
import { DmnEditorTab, SnapGrid, State } from "../../store/Store";
import { useDmnEditorStore, useDmnEditorStoreApi } from "../../store/StoreContext";
import { Unpacked } from "../../tsExt/tsExt";
import { snapShapeDimensions } from "../SnapGrid";
import { PositionalNodeHandles } from "../connections/PositionalNodeHandles";
import { NodeType, containment, outgoingStructure } from "../connections/graphStructure";
import { EDGE_TYPES } from "../edges/EdgeTypes";
import { DmnDiagramEdgeData } from "../edges/Edges";
import { getContainmentRelationship, getDecisionServiceDividerLineLocalY } from "../maths/DmnMaths";
import { useIsHovered } from "../useIsHovered";
import { DataTypeNodePanel } from "./DataTypeNodePanel";
import { DECISION_SERVICE_COLLAPSED_DIMENSIONS, MIN_NODE_SIZES } from "./DefaultSizes";
import { EditExpressionNodePanel } from "./EditExpressionNodePanel";
import { EditableNodeLabel, OnEditableNodeLabelChange, useEditableNodeLabel } from "./EditableNodeLabel";
import { InfoNodePanel } from "./InfoNodePanel";
import { getNodeLabelPosition, useNodeStyle } from "./NodeStyle";
import {
  BkmNodeSvg,
  DecisionNodeSvg,
  DecisionServiceNodeSvg,
  GroupNodeSvg,
  InputDataNodeSvg,
  KnowledgeSourceNodeSvg,
  TextAnnotationNodeSvg,
  UnknownNodeSvg,
} from "./NodeSvgs";
import { NODE_TYPES } from "./NodeTypes";
import { OutgoingStuffNodePanel } from "./OutgoingStuffNodePanel";
import { propsHaveSameValuesDeep } from "../memoization/memoization";
import { useExternalModels } from "../../includedModels/DmnEditorDependenciesContext";
import { NODE_LAYERS } from "../../store/computed/computeDiagramData";
import { canExpandDecisionService, expandDecisionService } from "../../mutations/expandDecisionService";
import { getDecisionServicePropertiesRelativeToThisDmn } from "../../mutations/addOrExpandExistingDecisionServiceToDrd";

export type ElementFilter<E extends { __$$element: string }, Filter extends string> = E extends any
  ? E["__$$element"] extends Filter
    ? E
    : never
  : never;

export type NodeDmnObjects =
  | null
  | Unpacked<DMN15__tDefinitions["drgElement"]>
  | ElementFilter<Unpacked<DMN15__tDefinitions["artifact"]>, "textAnnotation" | "group">;

export type DmnDiagramNodeData<T extends NodeDmnObjects = NodeDmnObjects> = {
  dmnObjectNamespace: string;
  dmnObjectQName: XmlQName;
  dmnObject: T;
  shape: DMNDI15__DMNShape & { index: number };
  index: number;
  /**
   * We don't use Reactflow's parenting mechanism because it is
   * too opinionated on how it deletes nodes/edges that are
   * inside/connected to nodes with parents
   * */
  parentRfNode: RF.Node<DmnDiagramNodeData> | undefined;
};

export const InputDataNode = React.memo(
  ({
    data: { dmnObject: inputData, shape, index, dmnObjectQName, dmnObjectNamespace },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<DmnDiagramNodeData<DMN15__tInputData & { __$$element: "inputData" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);
    const isExternal = !!dmnObjectQName.prefix;

    const snapGrid = useDmnEditorStore((s) => s.diagram.snapGrid);
    const enableCustomNodeStyles = useDmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useDmnEditorStore(
      (s) => (isHovered || isResizing) && s.diagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);
    const [isDataTypesPanelExpanded, setDataTypePanelExpanded] = useState(false);

    const dmnEditorStoreApi = useDmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id);
    const nodeDimensions = useNodeDimensions(type as NodeType, snapGrid, shape, isExternal);

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        dmnEditorStoreApi.setState((state) => {
          renameDrgElement({ definitions: state.dmn.model.definitions, newName, index });
        });
      },
      [dmnEditorStoreApi, index]
    );

    const onTypeRefChange = useCallback<OnTypeRefChange>(
      (newTypeRef) => {
        dmnEditorStoreApi.setState((state) => {
          const drgElement = state.dmn.model.definitions.drgElement![index] as DMN15__tInputData;
          drgElement.variable ??= { "@_name": inputData["@_name"] };
          drgElement.variable["@_typeRef"] = newTypeRef;
        });
      },
      [dmnEditorStoreApi, index, inputData]
    );

    const getAllFeelVariableUniqueNames = useCallback((s: State) => s.computed(s).getAllFeelVariableUniqueNames(), []);

    const onCreateDataType = useDataTypeCreationCallbackForNodes(index, inputData["@_name"]);

    const { fontCssProperties, shapeStyle } = useNodeStyle({
      dmnStyle: shape["di:Style"],
      nodeType: type as NodeType,
      isEnabled: enableCustomNodeStyles,
    });

    const additionalClasses = `${className} ${dmnObjectQName.prefix ? "external" : ""}`;

    const { externalModelsByNamespace } = useExternalModels();

    const isCollection = useDmnEditorStore((s) => {
      const { allDataTypesById, allTopLevelItemDefinitionUniqueNames } = s
        .computed(s)
        .getDataTypes(externalModelsByNamespace);

      return (
        allDataTypesById.get(allTopLevelItemDefinitionUniqueNames.get(inputData.variable?.["@_typeRef"] ?? "") ?? "")
          ?.itemDefinition?.["@_isCollection"] ?? false
      );
    });

    return (
      <>
        <svg className={`kie-dmn-editor--node-shape ${additionalClasses}`}>
          <InputDataNodeSvg
            isCollection={isCollection}
            {...nodeDimensions}
            x={0}
            y={0}
            strokeWidth={shapeStyle.strokeWidth}
            fillColor={shapeStyle.fillColor}
            strokeColor={shapeStyle.strokeColor}
          />
        </svg>
        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />
        <div
          ref={ref}
          className={`kie-dmn-editor--node kie-dmn-editor--input-data-node ${additionalClasses}`}
          tabIndex={-1}
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <InfoNodePanel isVisible={!isTargeted && shouldActLikeHovered} />

          <OutgoingStuffNodePanel
            isVisible={!isTargeted && shouldActLikeHovered}
            nodeTypes={outgoingStructure[NODE_TYPES.inputData].nodes}
            edgeTypes={outgoingStructure[NODE_TYPES.inputData].edges}
          />
          <EditableNodeLabel
            id={id}
            namedElement={inputData}
            namedElementQName={dmnObjectQName}
            isEditing={isEditingLabel}
            setEditing={setEditingLabel}
            position={getNodeLabelPosition(type as NodeType)}
            value={inputData["@_label"] ?? inputData["@_name"]}
            onChange={setName}
            onGetAllUniqueNames={getAllFeelVariableUniqueNames}
            shouldCommitOnBlur={true}
            fontCssProperties={fontCssProperties}
          />
          {shouldActLikeHovered && (
            <NodeResizerHandle
              nodeType={type as NodeType}
              snapGrid={snapGrid}
              nodeId={id}
              nodeShapeIndex={shape.index}
            />
          )}
          <DataTypeNodePanel
            isVisible={!isTargeted && shouldActLikeHovered}
            variable={inputData.variable}
            dmnObjectNamespace={dmnObjectNamespace}
            shape={shape}
            onCreate={onCreateDataType}
            onChange={onTypeRefChange}
            onToggle={setDataTypePanelExpanded}
          />
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const DecisionNode = React.memo(
  ({
    data: { parentRfNode, dmnObject: decision, shape, index, dmnObjectQName, dmnObjectNamespace },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<DmnDiagramNodeData<DMN15__tDecision & { __$$element: "decision" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);
    const isExternal = !!dmnObjectQName.prefix;

    const snapGrid = useDmnEditorStore((s) => s.diagram.snapGrid);
    const enableCustomNodeStyles = useDmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useDmnEditorStore(
      (s) => (isHovered || isResizing) && s.diagram.draggingNodes.length === 0
    );
    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(
      decision["@_id"]
    );
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);
    const [isDataTypesPanelExpanded, setDataTypePanelExpanded] = useState(false);

    const dmnEditorStoreApi = useDmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id);
    const nodeDimensions = useNodeDimensions(type as NodeType, snapGrid, shape, isExternal);
    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        dmnEditorStoreApi.setState((state) => {
          renameDrgElement({ definitions: state.dmn.model.definitions, newName, index });
        });
      },
      [dmnEditorStoreApi, index]
    );

    const onTypeRefChange = useCallback<OnTypeRefChange>(
      (newTypeRef) => {
        dmnEditorStoreApi.setState((state) => {
          const drgElement = state.dmn.model.definitions.drgElement![index] as DMN15__tInputData;
          drgElement.variable ??= { "@_name": decision["@_name"] };
          drgElement.variable["@_typeRef"] = newTypeRef;
        });
      },
      [decision, dmnEditorStoreApi, index]
    );

    const getAllFeelVariableUniqueNames = useCallback((s: State) => s.computed(s).getAllFeelVariableUniqueNames(), []);

    const onCreateDataType = useDataTypeCreationCallbackForNodes(index, decision["@_name"]);

    const { fontCssProperties, shapeStyle } = useNodeStyle({
      dmnStyle: shape["di:Style"],
      nodeType: type as NodeType,
      isEnabled: enableCustomNodeStyles,
    });

    const additionalClasses = `${className} ${dmnObjectQName.prefix ? "external" : ""}`;

    const { externalModelsByNamespace } = useExternalModels();

    const isCollection = useDmnEditorStore((s) => {
      const { allDataTypesById, allTopLevelItemDefinitionUniqueNames } = s
        .computed(s)
        .getDataTypes(externalModelsByNamespace);

      return (
        allDataTypesById.get(allTopLevelItemDefinitionUniqueNames.get(decision.variable?.["@_typeRef"] ?? "") ?? "")
          ?.itemDefinition?.["@_isCollection"] ?? false
      );
    });

    return (
      <>
        <svg className={`kie-dmn-editor--node-shape ${additionalClasses}`}>
          <DecisionNodeSvg
            isCollection={isCollection}
            {...nodeDimensions}
            x={0}
            y={0}
            strokeWidth={parentRfNode ? 3 : shapeStyle.strokeWidth}
            fillColor={shapeStyle.fillColor}
            strokeColor={shapeStyle.strokeColor}
          />
        </svg>

        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />

        <div
          ref={ref}
          className={`kie-dmn-editor--node kie-dmn-editor--decision-node ${additionalClasses}`}
          tabIndex={-1}
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <InfoNodePanel isVisible={!isTargeted && shouldActLikeHovered} />
          {!isExternal && <EditExpressionNodePanel isVisible={!isTargeted && shouldActLikeHovered} href={id} />}
          <OutgoingStuffNodePanel
            isVisible={!isTargeted && shouldActLikeHovered}
            nodeTypes={outgoingStructure[NODE_TYPES.decision].nodes}
            edgeTypes={outgoingStructure[NODE_TYPES.decision].edges}
          />
          <EditableNodeLabel
            id={id}
            namedElement={decision}
            namedElementQName={dmnObjectQName}
            isEditing={isEditingLabel}
            setEditing={setEditingLabel}
            position={getNodeLabelPosition(type as NodeType)}
            value={decision["@_label"] ?? decision["@_name"]}
            onChange={setName}
            onGetAllUniqueNames={getAllFeelVariableUniqueNames}
            shouldCommitOnBlur={true}
            fontCssProperties={fontCssProperties}
          />
          {shouldActLikeHovered && (
            <NodeResizerHandle
              nodeType={type as NodeType}
              snapGrid={snapGrid}
              nodeId={id}
              nodeShapeIndex={shape.index}
            />
          )}
          <DataTypeNodePanel
            isVisible={!isTargeted && shouldActLikeHovered}
            variable={decision.variable}
            dmnObjectNamespace={dmnObjectNamespace}
            shape={shape}
            onChange={onTypeRefChange}
            onCreate={onCreateDataType}
            onToggle={setDataTypePanelExpanded}
          />
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const BkmNode = React.memo(
  ({
    data: { dmnObject: bkm, shape, index, dmnObjectQName, dmnObjectNamespace },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<DmnDiagramNodeData<DMN15__tBusinessKnowledgeModel & { __$$element: "businessKnowledgeModel" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);
    const isExternal = !!dmnObjectQName.prefix;

    const snapGrid = useDmnEditorStore((s) => s.diagram.snapGrid);
    const enableCustomNodeStyles = useDmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useDmnEditorStore(
      (s) => (isHovered || isResizing) && s.diagram.draggingNodes.length === 0
    );
    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(
      bkm["@_id"]
    );
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);
    const [isDataTypesPanelExpanded, setDataTypePanelExpanded] = useState(false);

    const dmnEditorStoreApi = useDmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id);
    const nodeDimensions = useNodeDimensions(type as NodeType, snapGrid, shape, isExternal);
    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        dmnEditorStoreApi.setState((state) => {
          renameDrgElement({ definitions: state.dmn.model.definitions, newName, index });
        });
      },
      [dmnEditorStoreApi, index]
    );

    const onTypeRefChange = useCallback<OnTypeRefChange>(
      (newTypeRef) => {
        dmnEditorStoreApi.setState((state) => {
          const drgElement = state.dmn.model.definitions.drgElement![index] as DMN15__tInputData;
          drgElement.variable ??= { "@_name": bkm["@_name"] };
          drgElement.variable["@_typeRef"] = newTypeRef;
        });
      },
      [bkm, dmnEditorStoreApi, index]
    );

    const getAllFeelVariableUniqueNames = useCallback((s: State) => s.computed(s).getAllFeelVariableUniqueNames(), []);

    const onCreateDataType = useDataTypeCreationCallbackForNodes(index, bkm["@_name"]);

    const { fontCssProperties, shapeStyle } = useNodeStyle({
      dmnStyle: shape["di:Style"],
      nodeType: type as NodeType,
      isEnabled: enableCustomNodeStyles,
    });

    const additionalClasses = `${className} ${dmnObjectQName.prefix ? "external" : ""}`;

    return (
      <>
        <svg className={`kie-dmn-editor--node-shape ${additionalClasses}`}>
          <BkmNodeSvg
            {...nodeDimensions}
            x={0}
            y={0}
            strokeWidth={shapeStyle.strokeWidth}
            fillColor={shapeStyle.fillColor}
            strokeColor={shapeStyle.strokeColor}
          />
        </svg>

        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />

        <div
          ref={ref}
          className={`kie-dmn-editor--node kie-dmn-editor--bkm-node ${additionalClasses}`}
          tabIndex={-1}
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <InfoNodePanel isVisible={!isTargeted && shouldActLikeHovered} />
          {!isExternal && <EditExpressionNodePanel isVisible={!isTargeted && shouldActLikeHovered} href={id} />}
          <OutgoingStuffNodePanel
            isVisible={!isTargeted && shouldActLikeHovered}
            nodeTypes={outgoingStructure[NODE_TYPES.bkm].nodes}
            edgeTypes={outgoingStructure[NODE_TYPES.bkm].edges}
          />
          <EditableNodeLabel
            id={id}
            namedElement={bkm}
            namedElementQName={dmnObjectQName}
            isEditing={isEditingLabel}
            setEditing={setEditingLabel}
            position={getNodeLabelPosition(type as NodeType)}
            value={bkm["@_label"] ?? bkm["@_name"]}
            onChange={setName}
            onGetAllUniqueNames={getAllFeelVariableUniqueNames}
            shouldCommitOnBlur={true}
            fontCssProperties={fontCssProperties}
          />
          {shouldActLikeHovered && (
            <NodeResizerHandle
              nodeType={type as NodeType}
              snapGrid={snapGrid}
              nodeId={id}
              nodeShapeIndex={shape.index}
            />
          )}
          <DataTypeNodePanel
            isVisible={!isTargeted && shouldActLikeHovered}
            variable={bkm.variable}
            dmnObjectNamespace={dmnObjectNamespace}
            shape={shape}
            onChange={onTypeRefChange}
            onCreate={onCreateDataType}
            onToggle={setDataTypePanelExpanded}
          />
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const KnowledgeSourceNode = React.memo(
  ({
    data: { dmnObject: knowledgeSource, shape, index, dmnObjectQName },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<DmnDiagramNodeData<DMN15__tKnowledgeSource & { __$$element: "knowledgeSource" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);
    const isExternal = !!dmnObjectQName.prefix;

    const snapGrid = useDmnEditorStore((s) => s.diagram.snapGrid);
    const enableCustomNodeStyles = useDmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useDmnEditorStore(
      (s) => (isHovered || isResizing) && s.diagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(
      knowledgeSource["@_id"]
    );
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const dmnEditorStoreApi = useDmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id);
    const nodeDimensions = useNodeDimensions(type as NodeType, snapGrid, shape, isExternal);
    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        dmnEditorStoreApi.setState((state) => {
          renameDrgElement({ definitions: state.dmn.model.definitions, newName, index });
        });
      },
      [dmnEditorStoreApi, index]
    );

    const getAllFeelVariableUniqueNames = useCallback((s: State) => s.computed(s).getAllFeelVariableUniqueNames(), []);

    const { fontCssProperties, shapeStyle } = useNodeStyle({
      dmnStyle: shape["di:Style"],
      nodeType: type as NodeType,
      isEnabled: enableCustomNodeStyles,
    });

    const additionalClasses = `${className} ${dmnObjectQName.prefix ? "external" : ""}`;

    return (
      <>
        <svg className={`kie-dmn-editor--node-shape ${additionalClasses}`}>
          <KnowledgeSourceNodeSvg
            {...nodeDimensions}
            x={0}
            y={0}
            strokeWidth={shapeStyle.strokeWidth}
            fillColor={shapeStyle.fillColor}
            strokeColor={shapeStyle.strokeColor}
          />
        </svg>

        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />

        <div
          ref={ref}
          className={`kie-dmn-editor--node kie-dmn-editor--knowledge-source-node ${additionalClasses}`}
          tabIndex={-1}
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <InfoNodePanel isVisible={!isTargeted && shouldActLikeHovered} />
          <OutgoingStuffNodePanel
            isVisible={!isTargeted && shouldActLikeHovered}
            nodeTypes={outgoingStructure[NODE_TYPES.knowledgeSource].nodes}
            edgeTypes={outgoingStructure[NODE_TYPES.knowledgeSource].edges}
          />
          <EditableNodeLabel
            id={id}
            namedElement={knowledgeSource}
            namedElementQName={dmnObjectQName}
            position={getNodeLabelPosition(type as NodeType)}
            isEditing={isEditingLabel}
            setEditing={setEditingLabel}
            value={knowledgeSource["@_label"] ?? knowledgeSource["@_name"]}
            onChange={setName}
            skipValidation={true}
            onGetAllUniqueNames={getAllFeelVariableUniqueNames}
            shouldCommitOnBlur={true}
            fontCssProperties={fontCssProperties}
          />
          {shouldActLikeHovered && (
            <NodeResizerHandle
              nodeType={type as NodeType}
              snapGrid={snapGrid}
              nodeId={id}
              nodeShapeIndex={shape.index}
            />
          )}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const TextAnnotationNode = React.memo(
  ({
    data: { dmnObject: textAnnotation, shape, index, dmnObjectQName },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<DmnDiagramNodeData<DMN15__tTextAnnotation & { __$$element: "textAnnotation" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);
    const isExternal = !!dmnObjectQName.prefix;

    const snapGrid = useDmnEditorStore((s) => s.diagram.snapGrid);
    const enableCustomNodeStyles = useDmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useDmnEditorStore(
      (s) => (isHovered || isResizing) && s.diagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(
      textAnnotation["@_id"]
    );
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const dmnEditorStoreApi = useDmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id);
    const nodeDimensions = useNodeDimensions(type as NodeType, snapGrid, shape, isExternal);
    const setText = useCallback(
      (newText: string) => {
        dmnEditorStoreApi.setState((state) => {
          updateTextAnnotation({ definitions: state.dmn.model.definitions, newText, index });
        });
      },
      [dmnEditorStoreApi, index]
    );

    const getAllFeelVariableUniqueNames = useCallback((s: State) => s.computed(s).getAllFeelVariableUniqueNames(), []);

    const { fontCssProperties, shapeStyle } = useNodeStyle({
      dmnStyle: shape["di:Style"],
      nodeType: type as NodeType,
      isEnabled: enableCustomNodeStyles,
    });

    const additionalClasses = `${className} ${dmnObjectQName.prefix ? "external" : ""}`;

    return (
      <>
        <svg className={`kie-dmn-editor--node-shape ${additionalClasses}`}>
          <TextAnnotationNodeSvg
            {...nodeDimensions}
            x={0}
            y={0}
            strokeColor={shapeStyle.strokeColor}
            strokeWidth={shapeStyle.strokeWidth}
            fillColor={shapeStyle.fillColor}
          />
        </svg>

        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />

        <div
          ref={ref}
          className={`kie-dmn-editor--node kie-dmn-editor--text-annotation-node ${additionalClasses}`}
          tabIndex={-1}
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <InfoNodePanel isVisible={!isTargeted && shouldActLikeHovered} />
          <OutgoingStuffNodePanel
            isVisible={!isTargeted && shouldActLikeHovered}
            nodeTypes={outgoingStructure[NODE_TYPES.textAnnotation].nodes}
            edgeTypes={outgoingStructure[NODE_TYPES.textAnnotation].edges}
          />
          <EditableNodeLabel
            id={id}
            namedElement={undefined}
            namedElementQName={undefined}
            position={getNodeLabelPosition(type as NodeType)}
            isEditing={isEditingLabel}
            setEditing={setEditingLabel}
            value={textAnnotation["@_label"] ?? textAnnotation.text?.__$$text}
            onChange={setText}
            skipValidation={true}
            onGetAllUniqueNames={getAllFeelVariableUniqueNames}
            shouldCommitOnBlur={true}
            fontCssProperties={fontCssProperties}
          />
          {shouldActLikeHovered && (
            <NodeResizerHandle
              nodeType={type as NodeType}
              snapGrid={snapGrid}
              nodeId={id}
              nodeShapeIndex={shape.index}
            />
          )}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const DecisionServiceNode = React.memo(
  ({
    data: { dmnObject: decisionService, shape, index, dmnObjectQName, dmnObjectNamespace },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<DmnDiagramNodeData<DMN15__tDecisionService & { __$$element: "decisionService" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<SVGRectElement>(null);
    const isExternal = !!dmnObjectQName.prefix;

    const snapGrid = useDmnEditorStore((s) => s.diagram.snapGrid);
    const enableCustomNodeStyles = useDmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useDmnEditorStore(
      (s) => (isHovered || isResizing) && s.diagram.draggingNodes.length === 0
    );
    const isDropTarget = useDmnEditorStore((s) => s.diagram.dropTargetNode?.id === id);

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(
      decisionService["@_id"]
    );
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);
    const [isDataTypesPanelExpanded, setDataTypePanelExpanded] = useState(false);

    const dmnEditorStoreApi = useDmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id);

    const nodeDimensions = useNodeDimensions(type as NodeType, snapGrid, shape, isExternal);
    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        dmnEditorStoreApi.setState((state) => {
          renameDrgElement({ definitions: state.dmn.model.definitions, newName, index });
        });
      },
      [dmnEditorStoreApi, index]
    );

    // Select nodes representing output and encapsulated decisions contained by the Decision Service
    useEffect(() => {
      const onDoubleClick = () => {
        dmnEditorStoreApi.setState((state) => {
          const { containedDecisionHrefsRelativeToThisDmn } = getDecisionServicePropertiesRelativeToThisDmn({
            thisDmnsNamespace: state.dmn.model.definitions["@_namespace"],
            decisionService,
            decisionServiceNamespace: dmnObjectNamespace,
          });
          state.diagram._selectedNodes = [
            id, // Include the Decision Service itself.
            ...containedDecisionHrefsRelativeToThisDmn,
          ];
        });
      };

      const r = ref.current;
      r?.addEventListener("dblclick", onDoubleClick);
      return () => {
        r?.removeEventListener("dblclick", onDoubleClick);
      };
    }, [decisionService, dmnEditorStoreApi, dmnObjectNamespace, id]);

    const onTypeRefChange = useCallback<OnTypeRefChange>(
      (newTypeRef) => {
        dmnEditorStoreApi.setState((state) => {
          const drgElement = state.dmn.model.definitions.drgElement![index] as DMN15__tInputData;
          drgElement.variable ??= { "@_name": decisionService["@_name"] };
          drgElement.variable["@_typeRef"] = newTypeRef;
        });
      },
      [decisionService, dmnEditorStoreApi, index]
    );

    const getAllFeelVariableUniqueNames = useCallback((s: State) => s.computed(s).getAllFeelVariableUniqueNames(), []);

    const dividerLineRef = useRef<SVGPathElement>(null);

    const isCollapsed = shape["@_isCollapsed"] ?? false;

    const onCreateDataType = useDataTypeCreationCallbackForNodes(index, decisionService["@_name"]);

    useEffect(() => {
      if (!dividerLineRef.current) {
        return;
      }

      const selection = select(dividerLineRef.current);
      const dragHandler = drag<SVGCircleElement, unknown>()
        .on("start", () => {
          dmnEditorStoreApi.setState((state) =>
            state.dispatch(state).diagram.setDividerLineStatus(id, { moving: true })
          );
        })
        .on("drag", (e) => {
          dmnEditorStoreApi.setState((state) => {
            updateDecisionServiceDividerLine({
              definitions: state.dmn.model.definitions,
              drdIndex: state.diagram.drdIndex,
              dmnShapesByHref: state.computed(state).indexedDrd().dmnShapesByHref,
              drgElementIndex: index,
              shapeIndex: shape.index,
              localYPosition: e.y,
              snapGrid: state.diagram.snapGrid,
            });
          });
        })
        .on("end", (e) => {
          dmnEditorStoreApi.setState((state) =>
            state.dispatch(state).diagram.setDividerLineStatus(id, { moving: false })
          );
        });

      selection.call(dragHandler);
      return () => {
        selection.on(".drag", null);
      };
    }, [decisionService, dmnEditorStoreApi, id, index, shape.index]);

    const { fontCssProperties, shapeStyle } = useNodeStyle({
      dmnStyle: shape["di:Style"],
      nodeType: type as NodeType,
      isEnabled: enableCustomNodeStyles,
    });

    const additionalClasses = `${className} ${dmnObjectQName.prefix ? "external" : ""}`;

    const { externalModelsByNamespace } = useExternalModels();

    const canExpand = useDmnEditorStore((state) =>
      canExpandDecisionService({
        decisionService,
        decisionServiceNamespace: dmnObjectNamespace,
        externalDmnsIndex: state.computed(state).getExternalModelTypesByNamespace(externalModelsByNamespace).dmns,
        thisDmnsDefinitions: state.dmn.model.definitions,
        thisDmnsIndexedDrd: state.computed(state).indexedDrd(),
        thisDmnsNamespace: state.dmn.model.definitions["@_namespace"],
      })
    );

    const expand = useCallback(() => {
      dmnEditorStoreApi.setState((state) => {
        expandDecisionService({
          decisionService,
          decisionServiceNamespace: dmnObjectNamespace,
          drdIndex: state.diagram.drdIndex,
          externalDmnsIndex: state.computed(state).getExternalModelTypesByNamespace(externalModelsByNamespace).dmns,
          thisDmnsDefinitions: state.dmn.model.definitions,
          thisDmnsIndexedDrd: state.computed(state).indexedDrd(),
          thisDmnsNamespace: state.dmn.model.definitions["@_namespace"],
        });
      });
    }, [decisionService, dmnEditorStoreApi, dmnObjectNamespace, externalModelsByNamespace]);

    return (
      <>
        <svg className={`kie-dmn-editor--node-shape ${additionalClasses}`}>
          <DecisionServiceNodeSvg
            dividerLineRef={dividerLineRef}
            ref={ref}
            {...nodeDimensions}
            x={0}
            y={0}
            strokeWidth={3}
            fillColor={shapeStyle.fillColor}
            strokeColor={shapeStyle.strokeColor}
            isReadonly={false}
            isCollapsed={isCollapsed}
            showSectionLabels={isDropTarget}
            dividerLineLocalY={getDecisionServiceDividerLineLocalY(shape)}
          />
        </svg>

        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />

        <div
          className={`kie-dmn-editor--node kie-dmn-editor--decision-service-node ${additionalClasses}`}
          tabIndex={-1}
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          {isCollapsed && (
            <button
              disabled={!canExpand}
              className={"kie-dmn-editor--decision-service-collapsed-button"}
              onDoubleClickCapture={(e) => e.stopPropagation()} // Prevent other node actions from happening
              onMouseDownCapture={(e) => e.stopPropagation()} // Prevent other node actions from happening
              onClick={(e) => {
                e.stopPropagation();
                expand();
              }}
            >
              +
            </button>
          )}
          <InfoNodePanel isVisible={!isTargeted && selected && !dragging} />
          <OutgoingStuffNodePanel
            isVisible={!isTargeted && selected && !dragging}
            nodeTypes={outgoingStructure[NODE_TYPES.decisionService].nodes}
            edgeTypes={outgoingStructure[NODE_TYPES.decisionService].edges}
          />
          <EditableNodeLabel
            id={id}
            namedElement={decisionService}
            namedElementQName={dmnObjectQName}
            position={getNodeLabelPosition(type as NodeType)}
            isEditing={isEditingLabel}
            setEditing={setEditingLabel}
            value={decisionService["@_label"] ?? decisionService["@_name"]}
            onChange={setName}
            onGetAllUniqueNames={getAllFeelVariableUniqueNames}
            shouldCommitOnBlur={true}
            fontCssProperties={fontCssProperties}
          />
          {selected && !dragging && !isCollapsed && (
            <NodeResizerHandle
              nodeType={type as NodeType}
              snapGrid={snapGrid}
              nodeId={id}
              nodeShapeIndex={shape.index}
            />
          )}

          <DataTypeNodePanel
            isVisible={!isTargeted && selected && !dragging}
            variable={decisionService.variable}
            dmnObjectNamespace={dmnObjectNamespace}
            shape={shape}
            onCreate={onCreateDataType}
            onChange={onTypeRefChange}
            onToggle={setDataTypePanelExpanded}
          />
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const GroupNode = React.memo(
  ({
    data: { dmnObject: group, shape, index, dmnObjectQName },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<DmnDiagramNodeData<DMN15__tGroup & { __$$element: "group" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<SVGRectElement>(null);
    const isExternal = !!dmnObjectQName.prefix;

    const snapGrid = useDmnEditorStore((s) => s.diagram.snapGrid);
    const enableCustomNodeStyles = useDmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useDmnEditorStore(
      (s) => (isHovered || isResizing) && s.diagram.draggingNodes.length === 0
    );
    const dmnEditorStoreApi = useDmnEditorStoreApi();
    const reactFlow = RF.useReactFlow<DmnDiagramNodeData, DmnDiagramEdgeData>();

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(
      group["@_id"]
    );
    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id);
    const nodeDimensions = useNodeDimensions(type as NodeType, snapGrid, shape, isExternal);
    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        dmnEditorStoreApi.setState((state) => {
          renameGroupNode({ definitions: state.dmn.model.definitions, newName, index });
        });
      },
      [dmnEditorStoreApi, index]
    );

    // Select nodes that are visually entirely inside the group.
    useEffect(() => {
      const onDoubleClick = () => {
        dmnEditorStoreApi.setState((state) => {
          state.diagram._selectedNodes = reactFlow.getNodes().flatMap((n) =>
            getContainmentRelationship({
              bounds: n.data.shape["dc:Bounds"]!,
              container: shape["dc:Bounds"]!,
              snapGrid: state.diagram.snapGrid,
              containerMinSizes: MIN_NODE_SIZES[NODE_TYPES.group],
              boundsMinSizes: MIN_NODE_SIZES[n.type as NodeType],
            }).isInside
              ? [n.id]
              : []
          );
        });
      };

      const r = ref.current;
      r?.addEventListener("dblclick", onDoubleClick);
      return () => {
        r?.removeEventListener("dblclick", onDoubleClick);
      };
    }, [dmnEditorStoreApi, reactFlow, shape]);

    const { fontCssProperties, shapeStyle } = useNodeStyle({
      dmnStyle: shape["di:Style"],
      nodeType: type as NodeType,
      isEnabled: enableCustomNodeStyles,
    });

    const additionalClasses = `${className} ${dmnObjectQName.prefix ? "external" : ""}`;

    return (
      <>
        <svg className={`kie-dmn-editor--node-shape ${additionalClasses}`}>
          <GroupNodeSvg
            ref={ref}
            {...nodeDimensions}
            x={0}
            y={0}
            strokeWidth={3}
            fillColor={shapeStyle.fillColor}
            strokeColor={shapeStyle.strokeColor}
          />
        </svg>

        <div
          className={`kie-dmn-editor--node kie-dmn-editor--group-node ${additionalClasses}`}
          tabIndex={-1}
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <OutgoingStuffNodePanel
            isVisible={!isTargeted && selected && !dragging}
            nodeTypes={outgoingStructure[NODE_TYPES.group].nodes}
            edgeTypes={outgoingStructure[NODE_TYPES.group].edges}
          />
          <EditableNodeLabel
            id={id}
            namedElement={undefined}
            namedElementQName={undefined}
            position={getNodeLabelPosition(type as NodeType)}
            isEditing={isEditingLabel}
            setEditing={setEditingLabel}
            value={group["@_label"] ?? group["@_name"]}
            onChange={setName}
            skipValidation={true}
            onGetAllUniqueNames={useCallback(() => new Map(), [])}
            shouldCommitOnBlur={true}
            fontCssProperties={fontCssProperties}
          />
          {selected && !dragging && (
            <NodeResizerHandle
              nodeType={type as NodeType}
              snapGrid={snapGrid}
              nodeId={id}
              nodeShapeIndex={shape.index}
            />
          )}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const UnknownNode = React.memo(
  ({
    data: { shape, dmnObjectQName },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<DmnDiagramNodeData<null>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);
    const isExternal = !!dmnObjectQName.prefix;

    const snapGrid = useDmnEditorStore((s) => s.diagram.snapGrid);
    const enableCustomNodeStyles = useDmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useDmnEditorStore(
      (s) => (isHovered || isResizing) && s.diagram.draggingNodes.length === 0
    );

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id);
    const nodeDimensions = useNodeDimensions(type as NodeType, snapGrid, shape, isExternal);

    return (
      <>
        <svg className={`kie-dmn-editor--node-shape ${className}`}>
          <UnknownNodeSvg {...nodeDimensions} x={0} y={0} />
        </svg>

        <RF.Handle key={"unknown"} id={"unknown"} type={"source"} style={{ opacity: 0 }} position={RF.Position.Top} />

        <div ref={ref} className={`kie-dmn-editor--node kie-dmn-editor--unknown-node ${className}`} tabIndex={-1}>
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <InfoNodePanel isVisible={!isTargeted && shouldActLikeHovered} />

          <EditableNodeLabel
            id={id}
            namedElement={undefined}
            namedElementQName={undefined}
            position={getNodeLabelPosition(type as NodeType)}
            isEditing={false}
            setEditing={() => {}}
            value={`? `}
            onChange={() => {}}
            skipValidation={false}
            onGetAllUniqueNames={useCallback(() => new Map(), [])}
            shouldCommitOnBlur={true}
          />
          {selected && !dragging && (
            <NodeResizerHandle
              nodeType={type as NodeType}
              snapGrid={snapGrid}
              nodeId={id}
              nodeShapeIndex={shape.index}
            />
          )}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

///

export function EmptyLabel() {
  return (
    <span style={{ fontFamily: "serif" }}>
      <i style={{ opacity: 0.8 }}>{`<Empty>`}</i>
      <br />
      <i style={{ opacity: 0.5, fontSize: "0.8em", lineHeight: "0.8em" }}>{`Double-click to name`}</i>
    </span>
  );
}

const resizerControlStyle = {
  background: "transparent",
  border: "none",
};

export function NodeResizerHandle(props: {
  snapGrid: SnapGrid;
  nodeId: string;
  nodeType: NodeType;
  nodeShapeIndex: number;
}) {
  const minSize = MIN_NODE_SIZES[props.nodeType](props.snapGrid);
  return (
    <RF.NodeResizeControl style={resizerControlStyle} minWidth={minSize["@_width"]} minHeight={minSize["@_height"]}>
      <div
        style={{
          position: "absolute",
          top: "-10px",
          left: "-10px",
          width: "12px",
          height: "12px",
          backgroundColor: "black",
          clipPath: "polygon(0 100%, 100% 100%, 100% 0)",
        }}
      />
    </RF.NodeResizeControl>
  );
}

function useNodeResizing(id: string): boolean {
  return RF.useStore((s) => s.nodeInternals.get(id)?.resizing ?? false);
}

function useNodeDimensions(
  type: NodeType,
  snapGrid: SnapGrid,
  shape: DMNDI15__DMNShape,
  isExternal: boolean
): RF.Dimensions {
  if (type === NODE_TYPES.decisionService && (shape["@_isCollapsed"] ?? false)) {
    return DECISION_SERVICE_COLLAPSED_DIMENSIONS;
  }

  const minSizes = MIN_NODE_SIZES[type](snapGrid);

  return {
    width: snapShapeDimensions(snapGrid, shape, minSizes).width,
    height: snapShapeDimensions(snapGrid, shape, minSizes).height,
  };
}

function useHoveredNodeAlwaysOnTop(
  ref: React.RefObject<HTMLDivElement | SVGElement>,
  zIndex: number,
  shouldActLikeHovered: boolean,
  dragging: boolean,
  selected: boolean,
  isEditing: boolean
) {
  useLayoutEffect(() => {
    const r = ref.current;

    if (selected && !isEditing) {
      r?.focus();
    }

    if (r) {
      r.parentElement!.style.zIndex = `${
        shouldActLikeHovered || dragging ? zIndex + NODE_LAYERS.NESTED_NODES + 1 : zIndex
      }`;
    }
  }, [dragging, shouldActLikeHovered, ref, zIndex, selected, isEditing]);
}

export function useConnection(nodeId: string) {
  const connectionNodeId = RF.useStore((s) => s.connectionNodeId);
  const connectionHandleType = RF.useStore((s) => s.connectionHandleType);

  const source = connectionNodeId;
  const target = nodeId;

  const edgeIdBeingUpdated = useDmnEditorStore((s) => s.diagram.edgeIdBeingUpdated);
  const sourceHandle = RF.useStore(
    (s) => s.connectionHandleId ?? s.edges.find((e) => e.id === edgeIdBeingUpdated)?.type ?? null
  );

  const connection = useMemo(
    () => ({
      source: connectionHandleType === "source" ? source : target,
      target: connectionHandleType === "source" ? target : source,
      sourceHandle,
      targetHandle: null, // We don't use targetHandles, as target handles are only different in position, not in semantic.
    }),
    [connectionHandleType, source, sourceHandle, target]
  );

  return connection;
}

export function useConnectionTargetStatus(nodeId: string, shouldActLikeHovered: boolean) {
  const isTargeted = RF.useStore((s) => !!s.connectionNodeId && s.connectionNodeId !== nodeId && shouldActLikeHovered);
  const connection = useConnection(nodeId);
  const isValidConnectionTarget = RF.useStore((s) => s.isValidConnection?.(connection) ?? false);

  return useMemo(
    () => ({
      isTargeted,
      isValidConnectionTarget,
    }),
    [isTargeted, isValidConnectionTarget]
  );
}

export function useNodeClassName(isValidConnectionTarget: boolean, nodeId: string) {
  const isDropTarget = useDmnEditorStore(
    (s) => s.diagram.dropTargetNode?.id === nodeId && containment.get(s.diagram.dropTargetNode?.type as NodeType)
  );
  const { externalModelsByNamespace } = useExternalModels();
  const isDropTargetNodeValidForSelection = useDmnEditorStore((s) =>
    s.computed(s).isDropTargetNodeValidForSelection(externalModelsByNamespace)
  );
  const isConnectionNodeId = RF.useStore((s) => s.connectionNodeId === nodeId);
  const connection = useConnection(nodeId);
  const isEdgeConnection = !!Object.values(EDGE_TYPES).find((s) => s === connection.sourceHandle);
  const isNodeConnection = !!Object.values(NODE_TYPES).find((s) => s === connection.sourceHandle);

  if (isNodeConnection && !isConnectionNodeId) {
    return "dimmed";
  }

  if (isEdgeConnection && (!isValidConnectionTarget || isConnectionNodeId)) {
    return "dimmed";
  }

  if (isDropTarget) {
    return isDropTargetNodeValidForSelection ? "drop-target" : "drop-target-invalid";
  }

  return "normal";
}

export function useDataTypeCreationCallbackForNodes(index: number, drgElementName: string) {
  const dmnEditorStoreApi = useDmnEditorStoreApi();

  return useCallback<OnCreateDataType>(
    (newDataTypeName) => {
      dmnEditorStoreApi.setState((state) => {
        const drgElement = state.dmn.model.definitions.drgElement![index] as DMN15__tInputData;
        drgElement.variable ??= { "@_name": drgElementName };
        drgElement.variable["@_typeRef"] = newDataTypeName;
        const newItemDefinition = addTopLevelItemDefinition({
          definitions: state.dmn.model.definitions,
          partial: { "@_name": newDataTypeName, typeRef: { __$$text: DmnBuiltInDataType.Undefined } },
        });
        state.dataTypesEditor.activeItemDefinitionId = newItemDefinition["@_id"];
        state.navigation.tab = DmnEditorTab.DATA_TYPES;
        state.focus.consumableId = newItemDefinition["@_id"];
      });
    },
    [dmnEditorStoreApi, drgElementName, index]
  );
}
