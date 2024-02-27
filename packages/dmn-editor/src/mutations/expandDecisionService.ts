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
} from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { Computed } from "../store/Store";
import {
  addOrExpandExistingDecisionServiceToDrd,
  doesThisDrdHaveConflictingDecisionService,
} from "./addOrExpandExistingDecisionServiceToDrd";

export function expandDecisionService({
  decisionServiceNamespace,
  decisionService,
  externalDmnsIndex,
  thisDmnsDefinitions,
  thisDmnsIndexedDrd,
  drdIndex,
}: {
  decisionServiceNamespace: string;
  decisionService: DMN15__tDecisionService;
  externalDmnsIndex: ReturnType<Computed["getExternalModelTypesByNamespace"]>["dmns"];
  thisDmnsNamespace: string;
  thisDmnsDefinitions: DMN15__tDefinitions;
  thisDmnsIndexedDrd: ReturnType<Computed["indexedDrd"]>;
  drdIndex: number;
}) {
  addOrExpandExistingDecisionServiceToDrd({
    decisionServiceNamespace,
    decisionService,
    externalDmnsIndex,
    thisDmnsDefinitions,
    thisDmnsIndexedDrd,
    drdIndex,
    dropPoint: undefined,
  });
}

export function canExpandDecisionService({
  decisionServiceNamespace,
  decisionService,
  externalDmnsIndex,
  thisDmnsNamespace,
  thisDmnsDefinitions,
  thisDmnsIndexedDrd,
}: {
  decisionServiceNamespace: string;
  decisionService: DMN15__tDecisionService;
  externalDmnsIndex: ReturnType<Computed["getExternalModelTypesByNamespace"]>["dmns"];
  thisDmnsNamespace: string;
  thisDmnsDefinitions: DMN15__tDefinitions;
  thisDmnsIndexedDrd: ReturnType<Computed["indexedDrd"]>;
}) {
  const decisionServiceDmnDefinitions =
    decisionServiceNamespace === thisDmnsNamespace
      ? thisDmnsDefinitions
      : externalDmnsIndex.get(decisionServiceNamespace)?.model.definitions;

  if (!decisionServiceDmnDefinitions) {
    throw new Error(`DMN MUTATION: Can't find definitions for model with namespace ${decisionServiceNamespace}`);
  }

  return !doesThisDrdHaveConflictingDecisionService({
    decisionServiceNamespace,
    decisionService,
    decisionServiceDmnDefinitions,
    thisDmnsNamespace,
    thisDmnsDefinitions,
    thisDmnsIndexedDrd,
  });
}
