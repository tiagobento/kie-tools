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

import { createContext, useContext } from "react";
import * as RF from "reactflow";
import { StoreApi, UseBoundStore, create } from "zustand";
import { WithImmer, immer } from "zustand/middleware/immer";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { DmnLatestModel } from "@kie-tools/dmn-marshaller";
import { DmnDiagramNodeData } from "../diagram/nodes/Nodes";
import { NodeType } from "../diagram/connections/graphStructure";
import { DMN15__tImport } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { diagramData, externalModelsByType, indexes } from "./DiagramData";
import { allFeelVariableUniqueNames, allUniqueFeelNames, dataTypes } from "./DerivedStore";
import { isValidContainment } from "../diagram/connections/isValidContainment";

export interface DmnEditorDiagramNodeStatus {
  selected: boolean;
  dragging: boolean;
  resizing: boolean;
}
export interface DmnEditorDiagramEdgeStatus {
  selected: boolean;
  draggingWaypoint: boolean;
}

export interface DmnEditorDiagramDividerLineStatus {
  moving: boolean;
}

export interface SnapGrid {
  isEnabled: boolean;
  x: number;
  y: number;
}

export enum DiagramNodesPanel {
  NONE = "NONE",
  DRG_NODES = "DRG_NODES",
  EXTERNAL_NODES = "EXTERNAL_NODES",
}

export type DropTargetNode = undefined | RF.Node<DmnDiagramNodeData>;

// Read this to understand why we need computed as part of the store.
// https://github.com/pmndrs/zustand/issues/132#issuecomment-1120467721
export type Computed = {
  isDropTargetNodeValidForSelection: boolean;
  isDiagramEditingInProgress: boolean;
  importsByNamespace: Map<string, DMN15__tImport>;
  indexes: ReturnType<typeof indexes>;
  diagramData: ReturnType<typeof diagramData>;
  externalModelTypesByNamespace: ReturnType<typeof externalModelsByType>;
  dataTypes: ReturnType<typeof dataTypes>;
  allFeelVariableUniqueNames: ReturnType<typeof allFeelVariableUniqueNames>;
  allUniqueFeelNames: ReturnType<typeof allUniqueFeelNames>;
};

export interface State {
  dispatch: Dispatch;
  computed: Computed;
  dmn: { model: DmnLatestModel };
  focus: {
    consumableId: string | undefined;
  };
  boxedExpressionEditor: {
    activeDrgElementId: string | undefined;
    selectedObjectId: string | undefined;
    propertiesPanel: {
      isOpen: boolean;
    };
  };
  dataTypesEditor: {
    activeItemDefinitionId: string | undefined;
    expandedItemComponentIds: string[];
  };
  navigation: {
    tab: DmnEditorTab;
  };
  diagram: {
    drdIndex: number;
    edgeIdBeingUpdated: string | undefined;
    dropTargetNode: DropTargetNode;
    ongoingConnection: RF.OnConnectStartParams | undefined;
    propertiesPanel: {
      isOpen: boolean;
      elementId: string | undefined;
    };
    overlaysPanel: {
      isOpen: boolean;
    };
    autolayoutPanel: {
      isOpen: boolean;
    };
    openNodesPanel: DiagramNodesPanel;
    drdSelector: {
      isOpen: boolean;
    };
    overlays: {
      enableNodeHierarchyHighlight: boolean;
      enableExecutionHitsHighlights: boolean;
      enableCustomNodeStyles: boolean;
      enableDataTypesToolbarOnNodes: boolean;
      enableStyles: boolean;
    };
    snapGrid: SnapGrid;
    _selectedNodes: Array<string>;
    _selectedEdges: Array<string>;
    draggingNodes: Array<string>;
    resizingNodes: Array<string>;
    draggingWaypoints: Array<string>;
    movingDividerLines: Array<string>;
    editingStyle: boolean;
  };
}

export type Dispatch = {
  dmn: {
    reset: (model: State["dmn"]["model"]) => void;
  };
  boxedExpressionEditor: {
    open: (state: State, id: string) => void;
    close: (state: State) => void;
  };
  diagram: {
    setNodeStatus: (state: State, nodeId: string, status: Partial<DmnEditorDiagramNodeStatus>) => void;
    setEdgeStatus: (state: State, edgeId: string, status: Partial<DmnEditorDiagramEdgeStatus>) => void;
    setDividerLineStatus: (
      state: State,
      decisionServiceId: string,
      status: Partial<DmnEditorDiagramDividerLineStatus>
    ) => void;
  };
};

export enum DmnEditorTab {
  EDITOR,
  DATA_TYPES,
  INCLUDED_MODELS,
}

export const NODE_LAYERS = {
  GROUP_NODE: 0,
  NODES: 1000, // We need a difference > 1000 here, since ReactFlow will add 1000 to the z-index when a node is selected.
  DECISION_SERVICE_NODE: 2000, // We need a difference > 1000 here, since ReactFlow will add 1000 to the z-index when a node is selected.
  NESTED_NODES: 4000,
};

type ExtractState = StoreApi<State> extends { getState: () => infer T } ? T : never;

export function useDmnEditorStore<StateSlice = ExtractState>(
  selector: (state: State) => StateSlice,
  equalityFn?: (a: StateSlice, b: StateSlice) => boolean
) {
  const store = useContext(DmnEditorStoreApiContext);

  if (store === null) {
    throw new Error("Can't use DMN Editor Store outside of the DmnEditor component.");
  }

  return useStoreWithEqualityFn(store, selector, equalityFn);
}

export function useDmnEditorStoreApi() {
  return useContext(DmnEditorStoreApiContext);
}

export const DmnEditorStoreApiContext = createContext<StoreApiType>({} as any);

export type StoreApiType = UseBoundStore<WithImmer<StoreApi<State>>>;

export const defaultStaticState = () => ({
  boxedExpressionEditor: {
    activeDrgElementId: undefined,
    selectedObjectId: undefined,
    propertiesPanel: {
      isOpen: false,
    },
  },
  navigation: {
    tab: DmnEditorTab.EDITOR,
  },
  diagram: {
    drdIndex: 0,
    edgeIdBeingUpdated: undefined,
    dropTargetNode: undefined,
    ongoingConnection: undefined,
    propertiesPanel: {
      isOpen: false,
      elementId: undefined,
    },
    overlaysPanel: {
      isOpen: false,
    },
    autolayoutPanel: {
      isOpen: true,
    },
    openNodesPanel: DiagramNodesPanel.NONE,
    drdSelector: {
      isOpen: false,
    },
    overlays: {
      enableNodeHierarchyHighlight: false,
      enableExecutionHitsHighlights: false,
      enableCustomNodeStyles: false,
      enableDataTypesToolbarOnNodes: true,
      enableStyles: true,
    },
    snapGrid: { isEnabled: true, x: 20, y: 20 },
    _selectedNodes: [],
    _selectedEdges: [],
    draggingNodes: [],
    resizingNodes: [],
    draggingWaypoints: [],
    movingDividerLines: [],
    editingStyle: false,
  },
});

export function createDmnEditorStore(model: State["dmn"]["model"]) {
  return create(
    immer<State>((set, get) => ({
      dmn: {
        model,
      },
      focus: {
        consumableId: undefined,
      },
      dataTypesEditor: {
        activeItemDefinitionId: undefined,
        expandedItemComponentIds: [],
      },
      ...defaultStaticState(),
      dispatch: {
        dmn: {
          reset: (model) => {
            set((state) => {
              state.diagram._selectedNodes = [];
              state.diagram.draggingNodes = [];
              state.diagram.resizingNodes = [];
              state.navigation.tab = DmnEditorTab.EDITOR;
              state.boxedExpressionEditor.activeDrgElementId = undefined;
              state.boxedExpressionEditor.selectedObjectId = undefined;
            });
          },
        },
        boxedExpressionEditor: {
          open: (state, id) => {
            state.boxedExpressionEditor.activeDrgElementId = id;
            state.boxedExpressionEditor.selectedObjectId = undefined;
            state.boxedExpressionEditor.propertiesPanel.isOpen = state.diagram.propertiesPanel.isOpen;
          },
          close: (state) => {
            state.diagram.propertiesPanel.isOpen = state.boxedExpressionEditor.propertiesPanel.isOpen;
            state.boxedExpressionEditor.activeDrgElementId = undefined;
            state.boxedExpressionEditor.selectedObjectId = undefined;
          },
        },
        diagram: {
          setNodeStatus: (prev, nodeId, newStatus) => {
            //selected
            if (newStatus.selected !== undefined) {
              if (newStatus.selected) {
                prev.diagram._selectedNodes.push(nodeId);
              } else {
                prev.diagram._selectedNodes = prev.diagram._selectedNodes.filter((s) => s !== nodeId);
              }
            }
            //dragging
            if (newStatus.dragging !== undefined) {
              if (newStatus.dragging) {
                prev.diagram.draggingNodes.push(nodeId);
              } else {
                prev.diagram.draggingNodes = prev.diagram.draggingNodes.filter((s) => s !== nodeId);
              }
            }
            // resizing
            if (newStatus.resizing !== undefined) {
              if (newStatus.resizing) {
                prev.diagram.resizingNodes.push(nodeId);
              } else {
                prev.diagram.resizingNodes = prev.diagram.resizingNodes.filter((s) => s !== nodeId);
              }
            }
          },
          setEdgeStatus: (prev, edgeId, newStatus) => {
            //selected
            if (newStatus.selected !== undefined) {
              if (newStatus.selected) {
                prev.diagram._selectedEdges.push(edgeId);
              } else {
                prev.diagram._selectedEdges = prev.diagram._selectedEdges.filter((s) => s !== edgeId);
              }
            }
            //dragging
            if (newStatus.draggingWaypoint !== undefined) {
              if (newStatus.draggingWaypoint) {
                prev.diagram.draggingWaypoints.push(edgeId);
              } else {
                prev.diagram.draggingWaypoints = prev.diagram.draggingWaypoints.filter((s) => s !== edgeId);
              }
            }
          },
          setDividerLineStatus: (prev, decisionServiceId, newStatus) => {
            //dragging
            if (newStatus.moving !== undefined) {
              if (newStatus.moving) {
                prev.diagram.movingDividerLines.push(decisionServiceId);
              } else {
                prev.diagram.movingDividerLines = prev.diagram.movingDividerLines.filter(
                  (s) => s !== decisionServiceId
                );
              }
            }
          },
        },
      },
      computed: {
        get allUniqueFeelNames() {
          return cache("allUniqueFeelNames", get(), (s) => {
            return allUniqueFeelNames(s);
          });
        },
        get isDiagramEditingInProgress() {
          return cache("isDiagramEditingInProgress", get(), ({ diagram }) => {
            return (
              diagram.draggingNodes.length > 0 ||
              diagram.resizingNodes.length > 0 ||
              diagram.draggingWaypoints.length > 0 ||
              diagram.movingDividerLines.length > 0 ||
              diagram.editingStyle
            );
          });
        },
        get isDropTargetNodeValidForSelection() {
          return cache("isDropTargetNodeValidForSelection", get(), ({ diagram, computed }) => {
            return (
              !!diagram.dropTargetNode &&
              isValidContainment({
                nodeTypes: computed.diagramData.selectedNodeTypes,
                inside: diagram.dropTargetNode.type as NodeType,
                dmnObjectQName: diagram.dropTargetNode.data.dmnObjectQName,
              })
            );
          });
        },
        get importsByNamespace() {
          return cache("importsByNamespace", get(), ({ dmn }) => {
            const thisDmnsImports = dmn.model.definitions.import ?? [];
            const ret = new Map<string, DMN15__tImport>();
            for (let i = 0; i < thisDmnsImports.length; i++) {
              ret.set(thisDmnsImports[i]["@_namespace"], thisDmnsImports[i]);
            }
            return ret;
          });
        },
        get dataTypes() {
          return cache("dataTypes", get(), (s) => {
            return dataTypes(s, s.computed.externalModelTypesByNamespace.dmns, s.computed.importsByNamespace);
          });
        },
        get allFeelVariableUniqueNames() {
          return cache("allFeelVariableUniqueNames", get(), ({ computed }) => {
            return allFeelVariableUniqueNames(computed.dataTypes);
          });
        },
        get externalModelTypesByNamespace() {
          return cache("externalModelTypesByNamespace", get(), (s) => {
            const externalModelsByNamespace = {}; // FIXME: Tiago
            return externalModelsByType(s, externalModelsByNamespace);
          });
        },
        get indexes() {
          return cache("indexes", get(), (s) => {
            return indexes(s);
          });
        },
        get diagramData() {
          return cache("diagramData", get(), (s) => {
            return diagramData(s, s.computed.externalModelTypesByNamespace.dmns, s.computed.indexes);
          });
        },
      },
    }))
  );
}

export const computedCache = new Map<State, Computed>();
(window as any).cc = computedCache;

export function cache<K extends keyof Computed>(key: K, state: State, delegate: (s: State) => Computed[K]) {
  let c;
  computedCache.set(state, (c = computedCache.get(state) ?? ({} as Computed)));
  if (Object.hasOwn(c ?? {}, key)) {
    return c![key];
  }

  return (c![key] = delegate(state));
}
