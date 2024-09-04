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

import { BPMN20__tDefinitions, BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { Normalized } from "../normalization/normalize";

export type FoundElement<F> = {
  owner: ElementOwner;
  element: F;
  array: ElementVisitorArgs["element"][];
  index: number;
};

type ElementOwner = Normalized<
  | ElementFilter<Unpacked<NonNullable<BPMN20__tDefinitions["rootElement"]>>, "process">
  | ElementFilter<
      Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
      "subProcess" | "adHocSubProcess" | "transaction"
    >
>;

type ElementVisitorArgs = {
  element: Normalized<Unpacked<NonNullable<BPMN20__tProcess["flowElement"] | BPMN20__tProcess["artifact"]>>>;
  index: number;
  array: ElementVisitorArgs["element"][];
  owner: ElementOwner;
};

/**
 * Recursive method that will visit flowElements and artifacts inside root and/or deeply nested sub processes.
 */
export function visitFlowElementsAndArtifacts(process: ElementOwner, visitor: (args: ElementVisitorArgs) => void) {
  for (let i = 0; i < (process.flowElement ?? []).length; i++) {
    const f = process.flowElement![i];
    visitor({ element: f, index: i, owner: process, array: process.flowElement! });
    if (f.__$$element === "subProcess" || f.__$$element === "adHocSubProcess" || f.__$$element === "transaction") {
      visitFlowElementsAndArtifacts(f, visitor);
    }
  }

  for (let i = 0; i < (process.artifact ?? []).length; i++) {
    visitor({ element: process.artifact![i], index: i, owner: process, array: process.artifact! });
  }
}
