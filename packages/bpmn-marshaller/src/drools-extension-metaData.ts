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

import "./drools-extension";
import { AllNodesExtensionElements, BPMN20__tProcess } from "./schemas/bpmn-2_0/ts-gen/types";

export type Bpmn20KnownMetaDataKey =
  | "elementname" // Used for any Flow Element.
  | "customTags" // Used for Process Variables.
  | "customDescription" // Used for "Process Instance Description" as a global property.
  | "customSLADueDate"; // Used for "SLA Due date" as a global property.

/**
 * Helps dealing with objects containing drools:metaData entries.
 *
 * @param obj The object to extract drools:metaData from.
 * @returns A map containing the metaData entries indexed by their name attribute.
 */
export function parseBpmn20Drools10MetaData(obj: {
  extensionElements?: Pick<AllNodesExtensionElements, "drools:metaData"> | BPMN20__tProcess;
}): Map<Bpmn20KnownMetaDataKey, string> {
  const metadata = new Map<Bpmn20KnownMetaDataKey, string>();

  for (let i = 0; i < (obj.extensionElements?.["drools:metaData"] ?? []).length; i++) {
    const entry = obj.extensionElements!["drools:metaData"]![i];
    if (entry["@_name"] !== undefined) {
      metadata.set(entry["@_name"] as Bpmn20KnownMetaDataKey, entry["drools:metaValue"].__$$text);
    }
  }

  return metadata;
}

/**
 * Helps changing objects containing drools:metaData entries.
 *
 * @param obj The object to extract drools:metaData from.
 * @param key The drools:metaData entry name.
 * @param value The drools:metaData entry value.
 */
export function setBpmn20Drools10MetaData(
  obj: {
    extensionElements?: Pick<AllNodesExtensionElements, "drools:metaData"> | BPMN20__tProcess;
  },
  key: Bpmn20KnownMetaDataKey,
  value: string
): void {
  obj.extensionElements ??= { "drools:metaData": [] };
  obj.extensionElements["drools:metaData"] ??= [];

  let updated = false;
  for (let i = 0; i < obj.extensionElements["drools:metaData"].length; i++) {
    const entry = obj.extensionElements["drools:metaData"][i];
    if (entry["@_name"] === key) {
      entry["drools:metaValue"] = { __$$text: value };
      updated = true;
    }
  }

  if (!updated) {
    obj.extensionElements["drools:metaData"].push({
      "@_name": key,
      "drools:metaValue": { __$$text: value },
    });
  }
}
