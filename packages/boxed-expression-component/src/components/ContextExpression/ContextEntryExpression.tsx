/*
 * Copyright 2021 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ExpressionDefinition, ExpressionDefinitionLogicType, generateUuid } from "../../api";
import * as React from "react";
import { useCallback, useRef } from "react";
import { ExpressionDefinitionLogicTypeSelector } from "../ExpressionDefinitionLogicTypeSelector";
import * as _ from "lodash";
import { useBoxedExpressionEditorDispatch } from "../BoxedExpressionEditor/BoxedExpressionEditorContext";
import { getDefaultExpressionDefinitionByLogicType } from "../ExpressionDefinitionRoot/ExpressionDefinitionRoot";

export interface ContextEntryExpressionProps {
  expression: ExpressionDefinition;
}

export const ContextEntryExpression: React.FunctionComponent<ContextEntryExpressionProps> = ({ expression }) => {
  const logicTypeContainerref = useRef<HTMLDivElement>(null);

  const { setExpression } = useBoxedExpressionEditorDispatch();

  const getLogicTypeSelectorRef = useCallback(() => {
    return logicTypeContainerref.current!;
  }, []);

  const onLogicTypeSelected = useCallback(
    (logicType) => {
      setExpression((prev) => ({
        ...getDefaultExpressionDefinitionByLogicType(logicType, prev),
        logicType,
        isHeadless: true,
        id: prev.id ?? generateUuid(),
      }));
    },
    [setExpression]
  );

  const onLogicTypeReset = useCallback(() => {
    setExpression((prev) => ({
      id: prev.id,
      name: prev.name,
      dataType: prev.dataType,
      logicType: ExpressionDefinitionLogicType.Undefined,
    }));
  }, [setExpression]);

  return (
    <div className="entry-expression" ref={logicTypeContainerref}>
      <ExpressionDefinitionLogicTypeSelector
        expression={expression}
        onLogicTypeSelected={onLogicTypeSelected}
        onLogicTypeReset={onLogicTypeReset}
        getPlacementRef={getLogicTypeSelectorRef}
      />
    </div>
  );
};
