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
  ContextExpressionDefinition,
  DecisionTableExpressionDefinition,
  DmnBuiltInDataType,
  ExpressionDefinition,
  ExpressionDefinitionLogicType,
  FunctionExpressionDefinition,
  FunctionExpressionDefinitionKind,
  InvocationExpressionDefinition,
  ListExpressionDefinition,
  LiteralExpressionDefinition,
  RelationExpressionDefinition,
  generateUuid,
} from "@kie-tools/boxed-expression-component/dist/api";
import {
  LITERAL_EXPRESSION_MIN_WIDTH,
  CONTEXT_ENTRY_INFO_MIN_WIDTH,
  DECISION_TABLE_INPUT_DEFAULT_WIDTH,
  DECISION_TABLE_OUTPUT_DEFAULT_WIDTH,
  DECISION_TABLE_ANNOTATION_DEFAULT_WIDTH,
  RELATION_EXPRESSION_COLUMN_DEFAULT_WIDTH,
} from "@kie-tools/boxed-expression-component/dist/resizing/WidthConstants";
import {
  DECISION_TABLE_INPUT_DEFAULT_VALUE,
  DECISION_TABLE_OUTPUT_DEFAULT_VALUE,
} from "@kie-tools/boxed-expression-component/dist/expressions/DecisionTableExpression";
import {
  INVOCATION_EXPRESSION_DEFAULT_PARAMETER_NAME,
  INVOCATION_EXPRESSION_DEFAULT_PARAMETER_DATA_TYPE,
  INVOCATION_EXPRESSION_DEFAULT_PARAMETER_LOGIC_TYPE,
} from "@kie-tools/boxed-expression-component/dist/expressions/InvocationExpression";
import { RELATION_EXPRESSION_DEFAULT_VALUE } from "@kie-tools/boxed-expression-component/dist/expressions/RelationExpression";
import { DataTypeIndex } from "../dataTypes/DataTypes";
import { isStruct } from "../dataTypes/DataTypeSpec";
import { DMN15__tContextEntry } from "@kie-tools/dmn-marshaller/src/schemas/dmn-1_5/ts-gen/types";

export function getDefaultExpressionDefinitionByLogicType({
  logicType,
  typeRef,
  allTopLevelDataTypesByFeelName,
  expressionHolderName,
  getInputs,
  getDefaultColumnWidth,
}: {
  logicType: ExpressionDefinitionLogicType;
  typeRef: string;
  expressionHolderName?: string;
  allTopLevelDataTypesByFeelName: DataTypeIndex;
  getInputs?: () => { name: string; typeRef: string | undefined }[] | undefined;
  getDefaultColumnWidth?: (args: { name: string; typeRef: string | undefined }) => number | undefined;
}): ExpressionDefinition {
  const dataType = allTopLevelDataTypesByFeelName.get(typeRef);

  if (logicType === ExpressionDefinitionLogicType.Literal) {
    const literalExpression: LiteralExpressionDefinition = {
      __$$element: "literalExpression",
      "@_id": generateUuid(),
      "@_typeRef": typeRef,
      // width: LITERAL_EXPRESSION_MIN_WIDTH,
    };
    return literalExpression;
  }
  //
  else if (logicType === ExpressionDefinitionLogicType.Function) {
    const functionExpression: FunctionExpressionDefinition = {
      __$$element: "functionDefinition",
      "@_id": generateUuid(),
      "@_typeRef": typeRef,
      "@_kind": FunctionExpressionDefinitionKind.Feel,
      expression: {
        __$$element: "literalExpression",
        "@_id": generateUuid(),
      },
    };
    return functionExpression;
  }
  //
  else if (logicType === ExpressionDefinitionLogicType.Context) {
    let maxWidthBasedOnEntryNames = CONTEXT_ENTRY_INFO_MIN_WIDTH;

    let contextEntries: DMN15__tContextEntry[];
    if (!dataType || !isStruct(dataType.itemDefinition)) {
      contextEntries = [
        {
          variable: {
            "@_id": generateUuid(),
            "@_name": "ContextEntry-1",
            "@_typeRef": DmnBuiltInDataType.Undefined,
          },
          expression: {
            __$$element: "literalExpression",
            "@_id": generateUuid(),
            "@_label": "ContextEntry-1",
          },
        },
      ];
    } else {
      contextEntries = (dataType.itemDefinition.itemComponent ?? []).map((ic) => {
        const name = ic["@_name"];
        const typeRef = isStruct(ic)
          ? DmnBuiltInDataType.Any
          : (ic.typeRef?.__$$text as DmnBuiltInDataType) ?? DmnBuiltInDataType.Undefined;
        maxWidthBasedOnEntryNames = Math.max(
          maxWidthBasedOnEntryNames,
          getDefaultColumnWidth?.({ name, typeRef }) ?? CONTEXT_ENTRY_INFO_MIN_WIDTH
        );
        return {
          variable: {
            "@_id": generateUuid(),
            "@_name": name,
            "@_typeRef": typeRef as string,
          },
          expression: {
            __$$element: "literalExpression",
            "@_id": generateUuid(),
            "@_label": name,
            "@_typeRef": typeRef as string,
          },
        };
      });
    }

    contextEntries.push({
      "@_id": generateUuid(),
      expression: {
        __$$element: "literalExpression",
        "@_id": generateUuid(),
        "@_typeRef": typeRef as string,
      },
    });

    const contextExpression: ContextExpressionDefinition = {
      __$$element: "context",
      "@_id": generateUuid(),
      "@_typeRef": typeRef,
      //  entryInfoWidth: maxWidthBasedOnEntryNames,
      contextEntry: contextEntries,
    };
    return contextExpression;
  } else if (logicType === ExpressionDefinitionLogicType.List) {
    const listExpression: ListExpressionDefinition = {
      __$$element: "list",
      "@_id": generateUuid(),
      "@_typeRef": typeRef,
      expression: [
        {
          __$$element: "literalExpression",
          "@_id": generateUuid(),
        },
      ],
    };
    return listExpression;
  } else if (logicType === ExpressionDefinitionLogicType.Invocation) {
    const invocationExpression: InvocationExpressionDefinition = {
      __$$element: "invocation",
      "@_id": generateUuid(),
      "@_typeRef": typeRef,
      // entryInfoWidth: CONTEXT_ENTRY_INFO_MIN_WIDTH,
      binding: [
        {
          parameter: {
            "@_id": generateUuid(),
            "@_name": INVOCATION_EXPRESSION_DEFAULT_PARAMETER_NAME,
            "@_typeRef": INVOCATION_EXPRESSION_DEFAULT_PARAMETER_DATA_TYPE,
          },
          expression: {
            __$$element: "literalExpression",
            "@_id": generateUuid(),
            "@_label": INVOCATION_EXPRESSION_DEFAULT_PARAMETER_NAME,
            "@_typeRef": INVOCATION_EXPRESSION_DEFAULT_PARAMETER_DATA_TYPE,
          },
        },
      ],
      expression: {
        __$$element: "literalExpression",
        "@_id": generateUuid(),
        text: { __$$text: "FUNCTION NAME" },
      },
    };
    return invocationExpression;
  } else if (logicType === ExpressionDefinitionLogicType.Relation) {
    const relationExpression: RelationExpressionDefinition = {
      __$$element: "relation",
      "@_id": generateUuid(),
      "@_typeRef": typeRef,
      row: [
        {
          "@_id": generateUuid(),
          expression: [
            {
              __$$element: "literalExpression",
              "@_id": generateUuid(),
              text: { __$$text: RELATION_EXPRESSION_DEFAULT_VALUE },
            },
          ],
        },
      ],
      column:
        !dataType || !isStruct(dataType.itemDefinition)
          ? [
              {
                "@_id": generateUuid(),
                "@_name": dataType?.itemDefinition["@_name"] ?? "column-1",
                "@_typeRef": (dataType?.feelName as DmnBuiltInDataType) ?? DmnBuiltInDataType.Undefined,
                // width: RELATION_EXPRESSION_COLUMN_DEFAULT_WIDTH,
              },
            ]
          : (dataType.itemDefinition.itemComponent ?? []).map((ic) => {
              const name = ic["@_name"];
              const typeRef = isStruct(ic)
                ? DmnBuiltInDataType.Any
                : (ic.typeRef?.__$$text as DmnBuiltInDataType) ?? DmnBuiltInDataType.Undefined;
              return {
                "@_id": generateUuid(),
                "@_name": name,
                "@_typeRef": typeRef,
                //   width: getDefaultColumnWidth?.({ name, typeRef }) ?? RELATION_EXPRESSION_COLUMN_DEFAULT_WIDTH,
              };
            }),
    };
    return relationExpression;
  } else if (logicType === ExpressionDefinitionLogicType.DecisionTable) {
    const singleOutputColumn = {
      name: expressionHolderName || "Output 1",
      typeRef: (dataType?.feelName as DmnBuiltInDataType) ?? DmnBuiltInDataType.Undefined,
    };
    const singleInputColumn = {
      name: "InputSSSSSSsss 1",
      typeRef: DmnBuiltInDataType.Undefined,
    };

    const input = getInputs?.()?.map((input) => {
      return {
        "@_id": generateUuid(),
        inputExpression: {
          "@_id": generateUuid(),
          text: { __$$text: input.name },
          "@_typeRef": input.typeRef ?? DmnBuiltInDataType.Undefined,
        },
        // width: getDefaultColumnWidth?.(input) ?? DECISION_TABLE_INPUT_DEFAULT_WIDTH,
      };
    }) ?? [
      {
        "@_id": generateUuid(),
        inputExpression: {
          "@_id": generateUuid(),
          text: { __$$text: singleInputColumn.name },
          "@_typeRef": singleInputColumn.typeRef ?? DmnBuiltInDataType.Undefined,
        },
        //   width: getDefaultColumnWidth?.(singleInputColumn) ?? DECISION_TABLE_INPUT_DEFAULT_WIDTH,
      },
    ];

    const output =
      !dataType || !isStruct(dataType.itemDefinition)
        ? [
            {
              "@_id": generateUuid(),
              "@_label": singleOutputColumn.name,
              "@_typeRef": singleOutputColumn.typeRef,
              // width: getDefaultColumnWidth?.(singleOutputColumn) ?? DECISION_TABLE_OUTPUT_DEFAULT_WIDTH,
            },
          ]
        : (dataType.itemDefinition.itemComponent ?? []).map((ic) => {
            const name = ic["@_name"];
            const typeRef = isStruct(ic)
              ? DmnBuiltInDataType.Any
              : (ic.typeRef?.__$$text as DmnBuiltInDataType) ?? DmnBuiltInDataType.Undefined;
            return {
              "@_id": generateUuid(),
              "@_label": name,
              "@_typeRef": typeRef,
              // width: getDefaultColumnWidth?.({ name, typeRef }) ?? DECISION_TABLE_OUTPUT_DEFAULT_WIDTH,
            };
          });

    const decisionTableExpression: DecisionTableExpressionDefinition = {
      __$$element: "decisionTable",
      "@_id": generateUuid(),
      "@_typeRef": typeRef,
      "@_hitPolicy": "UNIQUE",
      input,
      output,
      annotation: [
        {
          "@_name": "Annotations",
          //  width: DECISION_TABLE_ANNOTATION_DEFAULT_WIDTH,
        },
      ],
      rule: [
        {
          "@_id": generateUuid(),
          inputEntry: input.map(() => ({
            "@_id": generateUuid(),
            text: { __$$text: DECISION_TABLE_INPUT_DEFAULT_VALUE },
          })),
          outputEntry: output.map(() => ({
            __$$element: "literalExpression",
            "@_id": generateUuid(),
            text: { __$$text: DECISION_TABLE_OUTPUT_DEFAULT_VALUE },
          })),
          annotationEntry: [{ text: { __$$text: "// Your annotations here" } }],
        },
      ],
    };
    return decisionTableExpression;
  } else {
    throw new Error(`No default expression available for ${logicType}`);
  }
}
