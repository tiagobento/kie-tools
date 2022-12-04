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

import { ExpressionDefinitionLogicType, ExpressionDefinition } from "../../api";
import * as React from "react";
import { useCallback, useRef } from "react";
import { ExpressionDefinitionLogicTypeSelector } from "../ExpressionDefinitionLogicTypeSelector";
import * as _ from "lodash";

export interface ContextEntryExpressionProps {
  /** The expression wrapped by the entry */
  expression: ExpressionDefinition;
  /** Function invoked when updating expression */
  onUpdatingRecursiveExpression: (expression: ExpressionDefinition) => void;
  /** Function invoked when resetting expression */
  onExpressionReset?: () => void;
}

export const ContextEntryExpression: React.FunctionComponent<ContextEntryExpressionProps> = ({
  expression,
  onUpdatingRecursiveExpression,
  onExpressionReset,
}) => {
  const expressionContainerRef = useRef<HTMLDivElement>(null);

  const getLogicTypeSelectorRef = useCallback(() => {
    return expressionContainerRef.current!;
  }, []);

  const onLogicTypeSelected = useCallback(
    (logicType) => {
      onUpdatingRecursiveExpression(_.omit({ ...expression, logicType }, "isHeadless"));
    },
    [onUpdatingRecursiveExpression, expression]
  );

  const onLogicTypeReset = useCallback(() => {
    onExpressionReset?.();
    onUpdatingRecursiveExpression(
      _.omit(
        { ...expression, logicType: ExpressionDefinitionLogicType.Undefined },
        "isHeadless"
      ) as ExpressionDefinition
    );
  }, [onExpressionReset, onUpdatingRecursiveExpression, expression]);

  return (
    <div className="entry-expression" ref={expressionContainerRef}>
      <ExpressionDefinitionLogicTypeSelector
        isHeadless={true}
        onUpdatingRecursiveExpression={onUpdatingRecursiveExpression}
        selectedExpression={expression}
        onLogicTypeSelected={onLogicTypeSelected}
        onLogicTypeReset={onLogicTypeReset}
        getPlacementRef={getLogicTypeSelectorRef}
      />
    </div>
  );
};