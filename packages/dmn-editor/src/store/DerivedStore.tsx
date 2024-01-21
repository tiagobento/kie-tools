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

import { DMN15__tImport, DMN15__tItemDefinition } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { UniqueNameIndex } from "../Dmn15Spec";
import { ExternalDmnsIndex } from "../DmnEditor";
import { builtInFeelTypeNames } from "../dataTypes/BuiltInFeelTypes";
import { DataType, DataTypeIndex } from "../dataTypes/DataTypes";
import { buildFeelQNameFromNamespace } from "../feel/buildFeelQName";
import { State } from "./Store";

export function allUniqueFeelNames(s: State) {
  const ret: UniqueNameIndex = new Map();

  const drgElements = s.dmn.model.definitions.drgElement ?? [];
  for (let i = 0; i < drgElements.length; i++) {
    const drgElement = drgElements[i];
    ret.set(drgElement["@_name"]!, drgElement["@_id"]!);
  }

  const thisDmnsImports = s.dmn.model.definitions.import ?? [];
  for (let i = 0; i < thisDmnsImports.length; i++) {
    const _import = thisDmnsImports[i];
    ret.set(_import["@_name"], _import["@_id"]!);
  }

  return ret;
}

export function allFeelVariableUniqueNames(dts: ReturnType<typeof dataTypes>) {
  const ret: UniqueNameIndex = new Map();

  for (const [k, v] of dts.allTopLevelDataTypesByFeelName.entries()) {
    ret.set(k, v.itemDefinition["@_id"]!);
  }

  for (const type of builtInFeelTypeNames) {
    ret.set(type, type);
  }

  return ret;
}

export function dataTypes(
  s: State,
  externalDmnsByNamespace: ExternalDmnsIndex,
  thisDmnsImportsByNamespace: Map<string, DMN15__tImport>
) {
  const allDataTypesById: DataTypeIndex = new Map();
  const allTopLevelDataTypesByFeelName: DataTypeIndex = new Map();

  const externalDmnsDataTypeTree = [...externalDmnsByNamespace.values()].flatMap((externalDmn) => {
    return buildDataTypesTree(
      externalDmn.model.definitions.itemDefinition ?? [],
      thisDmnsImportsByNamespace,
      allDataTypesById,
      allTopLevelDataTypesByFeelName,
      undefined,
      new Set(),
      externalDmn.model.definitions["@_namespace"],
      s.dmn.model.definitions["@_namespace"]
    );
  });

  // Purposefully do thisDmn's after. This will make sure thisDmn's ItemDefintiions
  // take precedence over any external ones imported to the default namespace.
  const thisDmnsDataTypeTree = buildDataTypesTree(
    s.dmn.model.definitions.itemDefinition ?? [],
    thisDmnsImportsByNamespace,
    allDataTypesById,
    allTopLevelDataTypesByFeelName,
    undefined,
    new Set(),
    s.dmn.model.definitions["@_namespace"],
    s.dmn.model.definitions["@_namespace"]
  );

  const allTopLevelItemDefinitionUniqueNames: UniqueNameIndex = new Map();

  for (const [k, v] of allTopLevelDataTypesByFeelName.entries()) {
    allTopLevelItemDefinitionUniqueNames.set(k, v.itemDefinition["@_id"]!);
  }

  for (const type of builtInFeelTypeNames) {
    allTopLevelItemDefinitionUniqueNames.set(type, type);
  }

  return {
    dataTypesTree: [...thisDmnsDataTypeTree, ...externalDmnsDataTypeTree],
    allDataTypesById,
    allTopLevelDataTypesByFeelName,
    allTopLevelItemDefinitionUniqueNames,
  };
}

export function buildDataTypesTree(
  items: DMN15__tItemDefinition[],
  importsByNamespace: Map<string, DMN15__tImport>,
  allDataTypesById: DataTypeIndex,
  allTopLevelDataTypesByFeelName: DataTypeIndex,
  parentId: string | undefined,
  parents: Set<string>,
  namespace: string,
  relativeToNamespace: string
) {
  const dataTypesTree: DataType[] = [];

  for (let i = 0; i < items.length; i++) {
    const itemDefinition = items[i];

    const feelName = buildFeelQNameFromNamespace({
      importsByNamespace,
      namedElement: itemDefinition,
      namespace,
      relativeToNamespace,
    }).full;

    const dataType: DataType = {
      itemDefinition,
      index: i,
      parentId,
      parents,
      feelName,
      namespace,
      children: buildDataTypesTree(
        itemDefinition.itemComponent ?? [],
        importsByNamespace,
        allDataTypesById,
        allTopLevelDataTypesByFeelName,
        itemDefinition["@_id"],
        new Set([...parents, itemDefinition["@_id"]!]),
        namespace,
        relativeToNamespace
      ),
    };

    dataTypesTree.push(dataType);
    allDataTypesById.set(itemDefinition["@_id"]!, dataType);

    if (parentId === undefined) {
      allTopLevelDataTypesByFeelName.set(feelName, dataType);
    }
  }

  return dataTypesTree;
}
