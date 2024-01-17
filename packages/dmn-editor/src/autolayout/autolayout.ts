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

import ELK, * as Elk from "elkjs/lib/elk.bundled.js";
import { SnapGrid } from "../store/Store";
const elk = new ELK();

export const elkOptions = {
  "elk.algorithm": "layered",
  "elk.layered.spacing.nodeNodeBetweenLayers": "100",
  "elk.spacing.nodeNode": "80",
  "elk.direction": "UP",
};

export async function getLayoutedElements(
  nodes: { id: string; width: number; height: number }[],
  edges: { id: string; sources: string[]; targets: string[] }[],
  options: Elk.LayoutOptions = {},
  snapGrid: SnapGrid
): Promise<{ isHorizontal: boolean; nodes: Elk.ElkNode[] | undefined; edges: Elk.ElkExtendedEdge[] | undefined }> {
  const isHorizontal = options?.["elk.direction"] === "RIGHT";

  const graph: Elk.ElkNode = {
    id: "root",
    layoutOptions: options,
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
