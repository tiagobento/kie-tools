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
import { useEffect, useMemo, useRef, useState } from "react";
import { useArgs } from "@storybook/preview-api";
import { BoxedExpressionEditor, BoxedExpressionEditorProps } from "../src/expressions";
import {
  BeeGwtService,
  ContextExpressionDefinition,
  DecisionTableExpressionDefinition,
  DmnBuiltInDataType,
  ExpressionDefinition,
  ExpressionDefinitionLogicType,
  FunctionExpressionDefinition,
  FunctionExpressionDefinitionKind,
  generateUuid,
  InvocationExpressionDefinition,
  ListExpressionDefinition,
  LiteralExpressionDefinition,
  RelationExpressionDefinition,
} from "../src/api";
import {
  DECISION_TABLE_INPUT_DEFAULT_VALUE,
  DECISION_TABLE_OUTPUT_DEFAULT_VALUE,
} from "../src/expressions/DecisionTableExpression";
import {
  INVOCATION_EXPRESSION_DEFAULT_PARAMETER_DATA_TYPE,
  INVOCATION_EXPRESSION_DEFAULT_PARAMETER_NAME,
} from "../src/expressions/InvocationExpression";

function getDefaultExpressionDefinitionByLogicType(
  logicType: ExpressionDefinitionLogicType,
  dataType: string,
  containerWidth: number
): ExpressionDefinition {
  if (logicType === ExpressionDefinitionLogicType.Literal) {
    const literalExpression: LiteralExpressionDefinition = {
      __$$element: "literalExpression",
      "@_typeRef": dataType,
      "@_id": generateUuid(),
    };
    return literalExpression;
  } else if (logicType === ExpressionDefinitionLogicType.Function) {
    const functionExpression: FunctionExpressionDefinition = {
      __$$element: "functionDefinition",
      "@_typeRef": dataType,
      "@_id": generateUuid(),
      "@_kind": FunctionExpressionDefinitionKind.Feel,
    };
    return functionExpression;
  } else if (logicType === ExpressionDefinitionLogicType.Context) {
    const contextExpression: ContextExpressionDefinition = {
      __$$element: "context",
      "@_typeRef": dataType,
      contextEntry: [
        {
          variable: {
            "@_id": generateUuid(),
            "@_name": "ContextEntry-1",
          },
          expression: {
            "@_id": generateUuid(),
            __$$element: "literalExpression",
            "@_label": "ContextEntry-1",
          },
        },
      ],
    };
    return contextExpression;
  } else if (logicType === ExpressionDefinitionLogicType.List) {
    const listExpression: ListExpressionDefinition = {
      __$$element: "list",
      "@_typeRef": dataType,
      expression: [],
    };
    return listExpression;
  } else if (logicType === ExpressionDefinitionLogicType.Invocation) {
    const invocationExpression: InvocationExpressionDefinition = {
      __$$element: "invocation",
      "@_typeRef": dataType,
      binding: [
        {
          parameter: {
            "@_id": generateUuid(),
            "@_name": INVOCATION_EXPRESSION_DEFAULT_PARAMETER_NAME,
            "@_typeRef": INVOCATION_EXPRESSION_DEFAULT_PARAMETER_DATA_TYPE,
          },
        },
      ],
      expression: {
        "@_id": generateUuid(),
        __$$element: "literalExpression",
        text: { __$$text: "FUNCTION" },
      },
    };
    return invocationExpression;
  } else if (logicType === ExpressionDefinitionLogicType.Relation) {
    const relationExpression: RelationExpressionDefinition = {
      __$$element: "relation",
      "@_typeRef": dataType,
      column: [
        {
          "@_id": generateUuid(),
          "@_name": "column-1",
        },
      ],
      row: [
        {
          "@_id": generateUuid(),
        },
      ],
    };
    return relationExpression;
  } else if (logicType === ExpressionDefinitionLogicType.DecisionTable) {
    const decisionTableExpression: DecisionTableExpressionDefinition = {
      __$$element: "decisionTable",
      "@_typeRef": dataType,
      "@_hitPolicy": "UNIQUE",
      input: [
        {
          "@_id": generateUuid(),
          inputExpression: {
            "@_id": generateUuid(),
            text: { __$$text: "input-1" },
          },
        },
      ],
      output: [
        {
          "@_id": generateUuid(),
          "@_name": "output-1",
        },
      ],
      annotation: [
        {
          "@_name": "annotation-1",
        },
      ],
      rule: [
        {
          "@_id": generateUuid(),
          inputEntry: [{ "@_id": generateUuid(), text: { __$$text: DECISION_TABLE_INPUT_DEFAULT_VALUE } }],
          outputEntry: [{ "@_id": generateUuid(), text: { __$$text: DECISION_TABLE_OUTPUT_DEFAULT_VALUE } }],
          annotationEntry: [{ text: { __$$text: "// Your annotations here" } }],
        },
      ],
    };
    return decisionTableExpression;
  } else {
    throw new Error(`No default expression available for ${logicType}`);
  }
}

export const pmmlParams = [
  {
    document: "document",
    modelsFromDocument: [
      {
        model: "model",
        parametersFromModel: [{ "@_id": "p1", "@_name": "p-1", "@_typeRef": DmnBuiltInDataType.Number }],
      },
    ],
  },
  {
    document: "mining pmml",
    modelsFromDocument: [
      {
        model: "MiningModelSum",
        parametersFromModel: [{ "@_id": "i1", "@_name": "input1", "@_typeRef": DmnBuiltInDataType.Any }],
      },
    ],
  },
  {
    document: "regression pmml",
    modelsFromDocument: [
      {
        model: "RegressionLinear",
        parametersFromModel: [{ "@_id": "i1", "@_name": "i1", "@_typeRef": DmnBuiltInDataType.Number }],
      },
    ],
  },
];

export const dataTypes = [
  { typeRef: "Undefined", name: "<Undefined>", isCustom: false },
  { typeRef: "Any", name: "Any", isCustom: false },
  { typeRef: "Boolean", name: "boolean", isCustom: false },
  { typeRef: "Context", name: "context", isCustom: false },
  { typeRef: "Date", name: "date", isCustom: false },
  { typeRef: "DateTime", name: "date and time", isCustom: false },
  { typeRef: "DateTimeDuration", name: "days and time duration", isCustom: false },
  { typeRef: "Number", name: "number", isCustom: false },
  { typeRef: "String", name: "string", isCustom: false },
  { typeRef: "Time", name: "time", isCustom: false },
  { typeRef: "YearsMonthsDuration", name: "years and months duration", isCustom: false },
];

export const beeGwtService: BeeGwtService = {
  getDefaultExpressionDefinition(logicType: string, dataType: string): ExpressionDefinition {
    return getDefaultExpressionDefinitionByLogicType(logicType as ExpressionDefinitionLogicType, dataType, 0);
  },
  openDataTypePage(): void {},
  selectObject(): void {},
};

export function BoxedExpressionEditorWrapper(props?: Partial<BoxedExpressionEditorProps>) {
  const emptyRef = useRef<HTMLDivElement>(null);
  const [args, updateArgs] = useArgs<BoxedExpressionEditorProps>();
  const argsCopy = useRef(args);
  const [expressionDefinition, setExpressionDefinition] = useState<ExpressionDefinition>(args.expressionDefinition);

  const expression = useMemo(
    () => props?.expressionDefinition ?? expressionDefinition,
    [expressionDefinition, props?.expressionDefinition]
  );

  const setExpression = useMemo(
    () => (props?.setExpressionDefinition ? props.setExpressionDefinition : setExpressionDefinition),
    [props?.setExpressionDefinition]
  );

  useEffect(() => {
    updateArgs({ ...argsCopy.current, expressionDefinition: expression });
  }, [updateArgs, expression]);

  useEffect(() => {
    if (args === argsCopy.current) {
      return;
    }
    setExpression(args.expressionDefinition);
    argsCopy.current = args;
  }, [args, setExpression]);

  return (
    <div ref={emptyRef}>
      <BoxedExpressionEditor
        decisionNodeId={props?.decisionNodeId ?? args.decisionNodeId}
        expressionDefinition={expression}
        setExpressionDefinition={setExpression}
        dataTypes={props?.dataTypes ?? args.dataTypes}
        scrollableParentRef={props?.scrollableParentRef ?? emptyRef}
        beeGwtService={props?.beeGwtService ?? args.beeGwtService}
        pmmlParams={props?.pmmlParams ?? args.pmmlParams}
        isResetSupportedOnRootExpression={
          props?.isResetSupportedOnRootExpression ?? args.isResetSupportedOnRootExpression
        }
        widthsById={new Map<string, number[]>()}
        expressionName={expression?.["@_label"]}
      />
    </div>
  );
}
