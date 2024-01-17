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
import { Button } from "@patternfly/react-core/dist/js/components/Button";
import { useCallback } from "react";
import { useDmnEditorDerivedStore } from "../store/DerivedStore";
import { elkOptions, getLayoutedElements } from "./autolayout";
import { useDmnEditorStore, useDmnEditorStoreApi } from "../store/Store";
import { DEFAULT_NODE_SIZES } from "../diagram/nodes/DefaultSizes";
import { NodeType } from "../diagram/connections/graphStructure";
import { repositionNode } from "../mutations/repositionNode";

export function AutolayoutPanel() {
  const { nodesById, edgesById } = useDmnEditorDerivedStore();
  const { snapGrid } = useDmnEditorStore((s) => s.diagram);

  const dmnStoreApi = useDmnEditorStoreApi();

  const onApply = useCallback(async () => {
    const a = await getLayoutedElements(
      [...nodesById.values()].map((node) => {
        const size = DEFAULT_NODE_SIZES[node.type as NodeType](snapGrid);
        return {
          id: node.id,
          width: size["@_width"],
          height: size["@_height"],
        };
      }),
      [...edgesById.values()].map((e) => {
        return {
          id: e.id,
          sources: [e.source],
          targets: [e.target],
        };
      }),
      elkOptions,
      snapGrid
    );

    dmnStoreApi.setState((s) => {
      for (const n of a.nodes ?? []) {
        const node = nodesById.get(n.id)!;
        repositionNode({
          definitions: s.dmn.model.definitions,
          drdIndex: s.diagram.drdIndex,
          controlWaypointsByEdge: new Map(),
          change: {
            nodeType: node.type as NodeType,
            type: "absolute",
            position: {
              x: n.x!,
              y: n.y!,
            },
            selectedEdges: [...edgesById.keys()],
            shapeIndex: node.data?.shape.index,
            sourceEdgeIndexes: [],
            targetEdgeIndexes: [],
          },
        });
      }
    });

    console.log(a);
  }, [dmnStoreApi, edgesById, nodesById, snapGrid]);

  return <Button onClick={onApply}>Apply</Button>;
}
