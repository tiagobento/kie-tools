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
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ReactTable from "react-table";
import {
  BeeTableContextMenuAllowedOperationsConditions,
  BeeTableHeaderVisibility,
  BeeTableOperation,
  BeeTableOperationConfig,
  BeeTableProps,
  ContextExpressionDefinition,
  DmnBuiltInDataType,
  ExpressionDefinition,
  generateUuid,
  getNextAvailablePrefixedName,
  InsertRowColumnsDirection,
} from "../../api";
import { useBoxedExpressionEditorI18n } from "../../i18n";
import { useNestedExpressionContainerWithNestedExpressions } from "../../resizing/Hooks";
import { NestedExpressionContainerContext } from "../../resizing/NestedExpressionContainerContext";
import { ResizerStopBehavior, ResizingWidth } from "../../resizing/ResizingWidthsContext";
import {
  CONTEXT_ENTRY_EXPRESSION_MIN_WIDTH,
  CONTEXT_ENTRY_INFO_MIN_WIDTH,
  CONTEXT_EXPRESSION_EXTRA_WIDTH,
} from "../../resizing/WidthConstants";
import { useBeeTableCoordinates, useBeeTableSelectableCellRef } from "../../selection/BeeTableSelectionContext";
import { BeeTable, BeeTableColumnUpdate } from "../../table/BeeTable";
import {
  useBoxedExpressionEditor,
  useBoxedExpressionEditorDispatch,
} from "../BoxedExpressionEditor/BoxedExpressionEditorContext";
import { DEFAULT_EXPRESSION_NAME } from "../ExpressionDefinitionHeaderMenu";
import { ContextEntryExpressionCell } from "./ContextEntryExpressionCell";
import { ContextEntryInfoCell, Entry } from "./ContextEntryInfoCell";
import "./ContextExpression.css";
import { ContextResultExpressionCell } from "./ContextResultExpressionCell";
import { getExpressionTotalMinWidth, getWidth } from "../../resizing/WidthMaths";
import { DMN15__tContextEntry } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";

const CONTEXT_ENTRY_DEFAULT_DATA_TYPE = DmnBuiltInDataType.Undefined;
const CONTEXT_ENTRY_INFO_WIDTH_INDEX = 0;

type ROWTYPE = DMN15__tContextEntry;

export function ContextExpression(
  contextExpression: ContextExpressionDefinition & {
    isNested: boolean;
    parentElementId: string;
  }
) {
  const { i18n } = useBoxedExpressionEditorI18n();
  const { setExpression, setWidth } = useBoxedExpressionEditorDispatch();
  const { variables, widthsById } = useBoxedExpressionEditor();

  const id = contextExpression["@_id"]!;

  const widths = useMemo(() => widthsById.get(id) ?? [], [id, widthsById]);

  const entryInfoWidth = useMemo(
    () => widths?.[CONTEXT_ENTRY_INFO_WIDTH_INDEX] ?? CONTEXT_ENTRY_INFO_MIN_WIDTH,
    [widths]
  );

  const setEntryInfoWidth = useCallback(
    (newWidthAction: React.SetStateAction<number | undefined>) => {
      const newWidth = typeof newWidthAction === "function" ? newWidthAction(entryInfoWidth) : newWidthAction;

      if (newWidth) {
        const values = [...widths];
        values.splice(CONTEXT_ENTRY_INFO_WIDTH_INDEX, 1, newWidth);
        setWidth({ id, values });
      }
    },
    [entryInfoWidth, id, setWidth, widths]
  );

  const [entryInfoResizingWidth, setEntryInfoResizingWidth] = useState<ResizingWidth>({
    value: entryInfoWidth,
    isPivoting: false,
  });

  const onColumnResizingWidthChange1 = useCallback((args: Map<number, ResizingWidth | undefined>) => {
    const newResizingWidth = args.get(1);
    if (newResizingWidth) {
      setEntryInfoResizingWidth(newResizingWidth);
    }
  }, []);

  /// //////////////////////////////////////////////////////
  /// ///////////// RESIZING WIDTHS ////////////////////////
  /// //////////////////////////////////////////////////////

  const entryResult = useMemo(() => {
    return contextExpression.contextEntry?.find((e) => !e.variable)?.expression;
  }, [contextExpression.contextEntry]);

  const { nestedExpressionContainerValue, onColumnResizingWidthChange: onColumnResizingWidthChange2 } =
    useNestedExpressionContainerWithNestedExpressions(
      useMemo(() => {
        const entriesWidths = (contextExpression.contextEntry ?? []).map((e) =>
          getExpressionTotalMinWidth(0, e.expression, widthsById)
        );

        const resultWidth = getExpressionTotalMinWidth(0, entryResult, widthsById);
        const maxNestedExpressionMinWidth = Math.max(...entriesWidths, resultWidth, CONTEXT_ENTRY_EXPRESSION_MIN_WIDTH);
        const nestedExpressions: ExpressionDefinition[] = [];

        if (contextExpression.contextEntry) {
          nestedExpressions.push(...contextExpression.contextEntry.map((e) => e.expression));
        }

        return {
          nestedExpressions: nestedExpressions,
          fixedColumnActualWidth: entryInfoWidth,
          fixedColumnResizingWidth: entryInfoResizingWidth,
          fixedColumnMinWidth: CONTEXT_ENTRY_INFO_MIN_WIDTH,
          nestedExpressionMinWidth: maxNestedExpressionMinWidth,
          extraWidth: CONTEXT_EXPRESSION_EXTRA_WIDTH,
          expression: contextExpression,
          flexibleColumnIndex: 2,
          widthsById: widthsById,
        };
      }, [contextExpression, entryInfoResizingWidth, entryInfoWidth, entryResult, widthsById])
    );

  /// //////////////////////////////////////////////////////

  const onColumnResizingWidthChange = useCallback(
    (args: Map<number, ResizingWidth | undefined>) => {
      onColumnResizingWidthChange2?.(args);
      onColumnResizingWidthChange1(args);
    },
    [onColumnResizingWidthChange1, onColumnResizingWidthChange2]
  );

  const beeTableColumns = useMemo<ReactTable.Column<ROWTYPE>[]>(() => {
    return [
      {
        accessor: id as any, // FIXME: https://github.com/kiegroup/kie-issues/issues/169
        label: contextExpression["@_label"] ?? DEFAULT_EXPRESSION_NAME,
        isRowIndexColumn: false,
        dataType: contextExpression["@_typeRef"] ?? CONTEXT_ENTRY_DEFAULT_DATA_TYPE,
        width: undefined,
        columns: [
          {
            accessor: "variable",
            label: "variable",
            isRowIndexColumn: false,
            dataType: DmnBuiltInDataType.Undefined,
            isWidthPinned: true,
            minWidth: CONTEXT_ENTRY_INFO_MIN_WIDTH,
            width: entryInfoWidth,
            setWidth: setEntryInfoWidth,
          },
          {
            accessor: "expression",
            label: "expression",
            dataType: DmnBuiltInDataType.Undefined,
            isRowIndexColumn: false,
            minWidth: CONTEXT_ENTRY_EXPRESSION_MIN_WIDTH,
            width: undefined,
          },
        ],
      },
    ];
  }, [contextExpression, entryInfoWidth, id, setEntryInfoWidth]);

  const onColumnUpdates = useCallback(
    ([{ name, dataType }]: BeeTableColumnUpdate<ROWTYPE>[]) => {
      setExpression((prev) => ({
        ...prev,
        "@_label": name,
      }));
    },
    [setExpression]
  );

  const headerVisibility = useMemo(() => {
    return contextExpression.isNested ? BeeTableHeaderVisibility.None : BeeTableHeaderVisibility.SecondToLastLevel;
  }, [contextExpression.isNested]);

  const updateEntry = useCallback(
    (rowIndex: number, newEntry: Entry) => {
      setExpression((prev: ContextExpressionDefinition) => {
        const contextEntries = [...(prev.contextEntry ?? [])];

        variables?.repository.updateVariableType(
          newEntry.variable?.["@_id"] ?? "",
          newEntry.variable?.["@_typeRef"] ?? "<Undefined>"
        );
        variables?.repository.renameVariable(
          newEntry.variable?.["@_id"] ?? "",
          newEntry.variable?.["@_name"] ?? "<Undefined>"
        );

        contextEntries[rowIndex] = {
          ...contextEntries[rowIndex],
          expression: newEntry.expression ?? undefined!,
          variable: newEntry.variable ?? undefined!,
        };

        return {
          ...prev,
          contextEntry: contextEntries,
        };
      });
    },
    [setExpression, variables?.repository]
  );

  const cellComponentByColumnAccessor: BeeTableProps<ROWTYPE>["cellComponentByColumnAccessor"] = useMemo(() => {
    return {
      variable: (props) => {
        return (
          <ContextEntryInfoCell
            {...props}
            data={props.data.map((e) => {
              return { variable: e.variable ?? undefined!, expression: e.expression };
            })}
            onEntryUpdate={updateEntry}
          />
        );
      },
      expression: (props) => {
        return (
          <ContextEntryExpressionCell
            {...props}
            data={props.data.map((e) => {
              return { variable: e.variable, expression: e.expression };
            })}
            widthsById={widthsById}
          />
        );
      },
    };
  }, [widthsById, updateEntry]);

  const beeTableOperationConfig = useMemo<BeeTableOperationConfig>(() => {
    return [
      {
        group: i18n.contextEntry,
        items: [
          { name: i18n.rowOperations.reset, type: BeeTableOperation.RowReset },
          { name: i18n.rowOperations.insertAbove, type: BeeTableOperation.RowInsertAbove },
          { name: i18n.rowOperations.insertBelow, type: BeeTableOperation.RowInsertBelow },
          { name: i18n.insert, type: BeeTableOperation.RowInsertN },
          { name: i18n.rowOperations.delete, type: BeeTableOperation.RowDelete },
        ],
      },
      {
        group: i18n.terms.selection.toUpperCase(),
        items: [
          { name: i18n.terms.copy, type: BeeTableOperation.SelectionCopy },
          { name: i18n.terms.cut, type: BeeTableOperation.SelectionCut },
          { name: i18n.terms.paste, type: BeeTableOperation.SelectionPaste },
          { name: i18n.terms.reset, type: BeeTableOperation.SelectionReset },
        ],
      },
    ];
  }, [i18n]);

  const getRowKey = useCallback((row: ReactTable.Row<ROWTYPE>) => {
    return row.id;
  }, []);

  const beeTableAdditionalRow = useMemo(() => {
    return [
      <ContextResultInfoCell key={"context-result-info"} />,
      <ContextResultExpressionCell
        key={"context-result-expression"}
        contextExpression={contextExpression}
        rowIndex={(contextExpression.contextEntry ?? []).length - 1}
        columnIndex={2}
        widthsById={widthsById}
      />,
    ];
  }, [contextExpression, widthsById]);

  const getDefaultContextEntry = useCallback(
    (name?: string): DMN15__tContextEntry => {
      const variableName =
        name ||
        getNextAvailablePrefixedName(
          (contextExpression.contextEntry ?? []).map((e) => e["@_label"] ?? ""),
          "ContextEntry"
        );
      return {
        expression: undefined as any, // SPEC DISCREPANCY: Starting without an expression gives users the ability to select the expression type.
        "@_id": generateUuid(),
        variable: {
          "@_name": variableName,
          "@_typeRef": DmnBuiltInDataType.Undefined,
          description: { __$$text: "" },
        },
        "@_label": variableName,
      };
    },
    [contextExpression]
  );

  const addVariable = useCallback(
    (
      args: {
        beforeIndex: number;
      },
      newContextEntries: DMN15__tContextEntry[],
      prev: ContextExpressionDefinition,
      newVariable: DMN15__tContextEntry
    ) => {
      const parentIndex = args.beforeIndex - 1;
      let parentId = contextExpression.parentElementId;
      if (parentIndex >= 0 && parentIndex < newContextEntries.length) {
        parentId = newContextEntries[parentIndex].variable?.["@_id"] ?? "";
      }

      let childId: undefined | string;
      if (args.beforeIndex < newContextEntries.length) {
        childId = newContextEntries[args.beforeIndex].variable?.["@_id"];
      } else {
        childId = prev.contextEntry?.find((e) => !e.variable)?.["@_id"] ?? "";
      }

      variables?.repository.addVariableToContext(
        newVariable.variable?.["@_id"] ?? "",
        newVariable.variable?.["@_name"] ?? "",
        parentId,
        childId
      );
    },
    [contextExpression.parentElementId, variables?.repository]
  );

  const onRowAdded = useCallback(
    (args: { beforeIndex: number; rowsCount: number; insertDirection: InsertRowColumnsDirection }) => {
      setExpression((prev: ContextExpressionDefinition) => {
        const newContextEntries = [...(prev.contextEntry ?? [])];

        const newEntries = [];
        const names = newContextEntries.map((e) => e.variable?.["@_name"] ?? "");
        for (let i = 0; i < args.rowsCount; i++) {
          const name = getNextAvailablePrefixedName(names, "ContextEntry");
          names.push(name);

          const defaultContextEntry = getDefaultContextEntry(name);
          addVariable(args, newContextEntries, prev, defaultContextEntry);
          newEntries.push(defaultContextEntry);
        }

        for (const newEntry of newEntries) {
          let index = args.beforeIndex;
          newContextEntries.splice(index, 0, newEntry);
          if (args.insertDirection === InsertRowColumnsDirection.AboveOrRight) {
            index++;
          }
        }

        return {
          ...prev,
          contextEntry: newContextEntries,
        };
      });
    },
    [addVariable, getDefaultContextEntry, setExpression]
  );

  const onRowDeleted = useCallback(
    (args: { rowIndex: number }) => {
      setExpression((prev: ContextExpressionDefinition) => {
        const newContextEntries = [...(prev.contextEntry ?? [])];

        if (prev.contextEntry) {
          variables?.repository.removeVariable(prev.contextEntry[args.rowIndex]["@_id"]!);
        }

        newContextEntries.splice(args.rowIndex, 1);
        return {
          ...prev,
          contextEntry: newContextEntries,
        };
      });
    },
    [setExpression, variables?.repository]
  );

  const onRowReset = useCallback(
    (args: { rowIndex: number }) => {
      setExpression((prev: ContextExpressionDefinition) => {
        // That's the additionalRow, meaning the contextExpression result.
        if (args.rowIndex === prev.contextEntry?.length) {
          return {
            ...prev,
            result: {
              ...getDefaultContextEntry().expression,
            },
          };
        }

        // That's a normal context entry
        else {
          const newContextEntries = [...(prev.contextEntry ?? [])];
          newContextEntries.splice(args.rowIndex, 1, {
            ...getDefaultContextEntry(newContextEntries[args.rowIndex]["@_label"] ?? ""),
          });
          return {
            ...prev,
            contextEntry: newContextEntries,
          };
        }
      });
    },
    [getDefaultContextEntry, setExpression]
  );

  const allowedOperations = useCallback(
    (conditions: BeeTableContextMenuAllowedOperationsConditions) => {
      if (!conditions.selection.selectionStart || !conditions.selection.selectionEnd) {
        return [];
      }

      const columnIndex = conditions.selection.selectionStart.columnIndex;
      const rowIndex = conditions.selection.selectionStart.rowIndex;

      return [
        BeeTableOperation.SelectionCopy,
        ...(columnIndex > 1
          ? [BeeTableOperation.SelectionCut, BeeTableOperation.SelectionPaste, BeeTableOperation.SelectionReset]
          : []),
        ...(conditions.selection.selectionStart.rowIndex >= 0
          ? [
              BeeTableOperation.RowInsertAbove,
              ...(rowIndex !== contextExpression.contextEntry?.length ? [BeeTableOperation.RowInsertBelow] : []), // do not insert below <result>
              ...(rowIndex !== contextExpression.contextEntry?.length ? [BeeTableOperation.RowInsertN] : []), // Because we can't insert multiple lines below <result>
              ...((contextExpression.contextEntry?.length ?? 0) > 1 &&
              rowIndex !== contextExpression.contextEntry?.length
                ? [BeeTableOperation.RowDelete]
                : []), // do not delete <result>
              BeeTableOperation.RowReset,
            ]
          : []),
      ];
    },
    [contextExpression.contextEntry?.length]
  );

  return (
    <NestedExpressionContainerContext.Provider value={nestedExpressionContainerValue}>
      <div className={`context-expression ${id}`}>
        <BeeTable<ROWTYPE>
          resizerStopBehavior={ResizerStopBehavior.SET_WIDTH_WHEN_SMALLER}
          tableId={id}
          headerLevelCountForAppendingRowIndexColumn={1}
          headerVisibility={headerVisibility}
          cellComponentByColumnAccessor={cellComponentByColumnAccessor}
          columns={beeTableColumns}
          rows={contextExpression.contextEntry?.filter((e, i, { length }) => i < length - 1) ?? []}
          onColumnUpdates={onColumnUpdates}
          operationConfig={beeTableOperationConfig}
          allowedOperations={allowedOperations}
          getRowKey={getRowKey}
          additionalRow={beeTableAdditionalRow}
          onRowAdded={onRowAdded}
          onRowReset={onRowReset}
          onRowDeleted={onRowDeleted}
          onColumnResizingWidthChange={onColumnResizingWidthChange}
          shouldRenderRowIndexColumn={false}
          shouldShowRowsInlineControls={true}
          shouldShowColumnsInlineControls={false}
          variables={variables}
          widthsById={widthsById}
        />
      </div>
    </NestedExpressionContainerContext.Provider>
  );
}

export function ContextResultInfoCell() {
  const { containerCellCoordinates } = useBeeTableCoordinates();

  const value = useMemo(() => {
    return `<result>`;
  }, []);

  const getValue = useCallback(() => {
    return value;
  }, [value]);

  const { isActive } = useBeeTableSelectableCellRef(
    containerCellCoordinates?.rowIndex ?? 0,
    containerCellCoordinates?.columnIndex ?? 0,
    undefined,
    getValue
  );

  const { beeGwtService } = useBoxedExpressionEditor();

  useEffect(() => {
    if (isActive) {
      beeGwtService?.selectObject("");
    }
  }, [beeGwtService, isActive]);

  return <div className="context-result">{value}</div>;
}
