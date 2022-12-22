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

import * as React from "react";
import { useContext, useMemo } from "react";
import { BeeGwtService, DmnDataType, ExpressionDefinition, PmmlParam } from "../../api";
import { useRef, useState } from "react";
import "./BoxedExpressionEditorContext.css";
import * as _ from "lodash";
import { CellSelectionBox } from "../../selection/SelectionBox";
import { BoxedExpressionEditorProps } from "./BoxedExpressionEditor";

export interface BoxedExpressionEditorContextType {
  // Plumbing
  beeGwtService?: BeeGwtService;
  editorRef: React.RefObject<HTMLDivElement>;

  // Props
  decisionNodeId: string;
  pmmlParams?: PmmlParam[];
  dataTypes: DmnDataType[];

  // State
  currentlyOpenContextMenu: string | undefined;
  setCurrentlyOpenContextMenu: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export interface BoxedExpressionEditorDispatchContextType {
  setExpression: React.Dispatch<React.SetStateAction<ExpressionDefinition>>;
}

export const BoxedExpressionEditorContext = React.createContext<BoxedExpressionEditorContextType>(
  {} as BoxedExpressionEditorContextType
);

export const BoxedExpressionEditorDispatchContext = React.createContext<BoxedExpressionEditorDispatchContextType>(
  {} as BoxedExpressionEditorDispatchContextType
);

export function useBoxedExpressionEditor() {
  return useContext(BoxedExpressionEditorContext);
}

export function useBoxedExpressionEditorDispatch() {
  return useContext(BoxedExpressionEditorDispatchContext);
}

export function BoxedExpressionEditorContextProvider({
  setExpressionDefinition,
  dataTypes,
  decisionNodeId,
  beeGwtService,
  children,
  pmmlParams,
}: React.PropsWithChildren<BoxedExpressionEditorProps>) {
  const [currentlyOpenContextMenu, setCurrentlyOpenContextMenu] = useState<string | undefined>(undefined);

  const editorRef = useRef<HTMLDivElement>(null);

  const dispatch = useMemo(
    () => ({
      setExpression: setExpressionDefinition,
    }),
    [setExpressionDefinition]
  );

  return (
    <BoxedExpressionEditorContext.Provider
      value={{
        //plumbing
        beeGwtService, // FIXME: Tiago -> Move to a separate context
        editorRef,

        // props
        decisionNodeId,
        dataTypes,
        pmmlParams,

        //state // FIXME: Tiago -> Move to a separate context
        currentlyOpenContextMenu,
        setCurrentlyOpenContextMenu,
      }}
    >
      <BoxedExpressionEditorDispatchContext.Provider value={dispatch}>
        <div className="boxed-expression-provider" ref={editorRef}>
          {children}
        </div>
        <CellSelectionBox />
      </BoxedExpressionEditorDispatchContext.Provider>
    </BoxedExpressionEditorContext.Provider>
  );
}
