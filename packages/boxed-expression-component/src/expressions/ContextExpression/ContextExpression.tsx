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
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ReactTable from "react-table";
import {
  BeeTableHeaderVisibility,
  BeeTableOperation,
  BeeTableOperationConfig,
  BeeTableProps,
  ContextExpressionDefinition,
  ContextExpressionDefinitionEntry,
  DmnBuiltInDataType,
  ExpressionDefinition,
  ExpressionDefinitionLogicType,
  generateUuid,
  getNextAvailablePrefixedName,
} from "../../api";
import { useBoxedExpressionEditorI18n } from "../../i18n";
import { useNestedExpressionContainer } from "../../resizing/NestedExpressionContainerContext";
import { ResizingWidth, useResizingWidths, useResizingWidthsDispatch } from "../../resizing/ResizingWidthsContext";
import { getExpressionMinWidth, getExpressionResizingWidth } from "../../resizing/Widths";
import {
  CONTEXT_ENTRY_EXPRESSION_MIN_WIDTH,
  CONTEXT_ENTRY_EXTRA_WIDTH,
  CONTEXT_ENTRY_INFO_MIN_WIDTH,
} from "../../resizing/WidthValues";
import { BeeTable, BeeTableColumnUpdate } from "../../table/BeeTable";
import { useBeeTableCell } from "../../table/BeeTable/BeeTableSelectionContext";
import {
  useBoxedExpressionEditor,
  useBoxedExpressionEditorDispatch,
} from "../BoxedExpressionEditor/BoxedExpressionEditorContext";
import { ContextEntryExpressionCell } from "./ContextEntryExpressionCell";
import { ContextEntryInfoCell } from "./ContextEntryInfoCell";
import "./ContextExpression.css";
import { ContextResultExpressionCell } from "./ContextResultExpressionCell";

const CONTEXT_ENTRY_DEFAULT_NAME = "ContextEntry-1";

const CONTEXT_ENTRY_DEFAULT_DATA_TYPE = DmnBuiltInDataType.Undefined;

type ROWTYPE = ContextExpressionDefinitionEntry;

export const ContextExpression: React.FunctionComponent<ContextExpressionDefinition> = (
  contextExpression: ContextExpressionDefinition
) => {
  const { i18n } = useBoxedExpressionEditorI18n();
  const { decisionNodeId } = useBoxedExpressionEditor();
  const { setExpression } = useBoxedExpressionEditorDispatch();
  const nestedExpressionContainer = useNestedExpressionContainer();

  const nestedExpressions = useMemo<ExpressionDefinition[]>(
    () => [...contextExpression.contextEntries.map((e) => e.entryExpression), contextExpression.result],
    [contextExpression.contextEntries, contextExpression.result]
  );

  //// RESIZING WIDTHS

  const { updateResizingWidth } = useResizingWidthsDispatch();
  const { resizingWidths } = useResizingWidths();

  const [entryInfoResizingWidth, setEntryInfoResizingWidth] = useState<ResizingWidth>({
    value: contextExpression.entryInfoWidth ?? CONTEXT_ENTRY_INFO_MIN_WIDTH,
    isPivoting: false,
  });

  const isContextExpressionPivoting = useMemo<boolean>(() => {
    return entryInfoResizingWidth.isPivoting || nestedExpressions.some(({ id }) => resizingWidths.get(id!)?.isPivoting);
  }, [entryInfoResizingWidth.isPivoting, nestedExpressions, resizingWidths]);

  const nonPivotingEntryExpressionsMaxActualWidth = useMemo<number>(() => {
    return Math.max(
      nestedExpressionContainer.actualWidth -
        (contextExpression.entryInfoWidth ?? CONTEXT_ENTRY_INFO_MIN_WIDTH) -
        CONTEXT_ENTRY_EXTRA_WIDTH,
      ...nestedExpressions
        .filter(({ id }) => !(resizingWidths.get(id!)?.isPivoting ?? false))
        .map((expression) => getExpressionResizingWidth(expression, new Map()))
    );
  }, [contextExpression.entryInfoWidth, nestedExpressionContainer.actualWidth, nestedExpressions, resizingWidths]);

  const [pivotAwareExpressionContainer, setPivotAwareNestedExpressionContainer] = useState(nestedExpressionContainer);
  useEffect(() => {
    setPivotAwareNestedExpressionContainer((prev) => {
      return isContextExpressionPivoting ? prev : nestedExpressionContainer;
    });
  }, [isContextExpressionPivoting, nestedExpressionContainer, nestedExpressionContainer.resizingWidth.value]);

  const entryExpressionsResizingWidthValue = useMemo<number>(() => {
    const nestedPivotingExpressions = nestedExpressions.filter(({ id }) => resizingWidths.get(id!)?.isPivoting);
    if (nestedPivotingExpressions.length === 1) {
      return Math.max(
        getExpressionResizingWidth(nestedPivotingExpressions[0]!, resizingWidths),
        CONTEXT_ENTRY_INFO_MIN_WIDTH
      );
    }

    return Math.max(
      entryInfoResizingWidth.value >= (contextExpression.entryInfoWidth ?? CONTEXT_ENTRY_INFO_MIN_WIDTH)
        ? pivotAwareExpressionContainer.resizingWidth.value - entryInfoResizingWidth.value - CONTEXT_ENTRY_EXTRA_WIDTH
        : nestedExpressionContainer.actualWidth - entryInfoResizingWidth.value - CONTEXT_ENTRY_EXTRA_WIDTH,
      ...nestedExpressions.map((e) => getExpressionResizingWidth(e, new Map())),
      CONTEXT_ENTRY_EXPRESSION_MIN_WIDTH
    );
  }, [
    contextExpression.entryInfoWidth,
    entryInfoResizingWidth.value,
    nestedExpressionContainer.actualWidth,
    nestedExpressions,
    pivotAwareExpressionContainer.resizingWidth.value,
    resizingWidths,
  ]);

  useEffect(() => {
    updateResizingWidth(contextExpression.id!, (prev) => {
      return {
        value: entryInfoResizingWidth.value + entryExpressionsResizingWidthValue + CONTEXT_ENTRY_EXTRA_WIDTH,
        isPivoting: isContextExpressionPivoting,
      };
    });
  }, [
    contextExpression.id,
    entryExpressionsResizingWidthValue,
    entryInfoResizingWidth.value,
    isContextExpressionPivoting,
    updateResizingWidth,
  ]);

  const entryExpressionsMinWidthLocal = useMemo(() => {
    return Math.max(
      ...nestedExpressions.map((e) => getExpressionMinWidth(e)), //
      CONTEXT_ENTRY_EXPRESSION_MIN_WIDTH
    );
  }, [nestedExpressions]);

  const entryExpressionsMinWidthGlobal = useMemo(() => {
    return Math.max(
      nestedExpressionContainer.minWidthGlobal - entryInfoResizingWidth.value - CONTEXT_ENTRY_EXTRA_WIDTH,
      ...nestedExpressions.map((e) => getExpressionMinWidth(e)),
      CONTEXT_ENTRY_EXPRESSION_MIN_WIDTH
    );
  }, [entryInfoResizingWidth.value, nestedExpressionContainer.minWidthGlobal, nestedExpressions]);

  const contextExpressionContextValue = useMemo<ContextExpressionContextType>(() => {
    return {
      entryExpressionsMinWidthLocal: entryExpressionsMinWidthLocal,
      entryExpressionsMinWidthGlobal: entryExpressionsMinWidthGlobal,
      entryExpressionsActualWidth: nonPivotingEntryExpressionsMaxActualWidth,
      entryExpressionsResizingWidth: {
        value: entryExpressionsResizingWidthValue,
        isPivoting: isContextExpressionPivoting,
      },
    };
  }, [
    entryExpressionsMinWidthLocal,
    entryExpressionsMinWidthGlobal,
    nonPivotingEntryExpressionsMaxActualWidth,
    entryExpressionsResizingWidthValue,
    isContextExpressionPivoting,
  ]);

  const setEntryInfoWidth = useCallback(
    (newEntryInfoWidth: number) => {
      setExpression((prev) => ({ ...prev, entryInfoWidth: newEntryInfoWidth }));
    },
    [setExpression]
  );

  ///

  const beeTableColumns = useMemo<ReactTable.Column<ROWTYPE>[]>(() => {
    return [
      {
        accessor: decisionNodeId as any,
        label: contextExpression.name ?? CONTEXT_ENTRY_DEFAULT_NAME,
        isRowIndexColumn: false,
        dataType: contextExpression.dataType ?? CONTEXT_ENTRY_DEFAULT_DATA_TYPE,
        width: undefined,
        columns: [
          {
            accessor: "entryInfo",
            label: "entryInfo",
            isRowIndexColumn: false,
            dataType: DmnBuiltInDataType.Undefined,
            minWidth: CONTEXT_ENTRY_INFO_MIN_WIDTH,
            width: contextExpression.entryInfoWidth ?? CONTEXT_ENTRY_INFO_MIN_WIDTH,
            setWidth: setEntryInfoWidth,
          },
          {
            accessor: "entryExpression",
            label: "entryExpression",
            isRowIndexColumn: false,
            dataType: DmnBuiltInDataType.Undefined,
            minWidth: CONTEXT_ENTRY_EXPRESSION_MIN_WIDTH,
            width: undefined,
          },
        ],
      },
    ];
  }, [
    contextExpression.name,
    contextExpression.dataType,
    contextExpression.entryInfoWidth,
    decisionNodeId,
    setEntryInfoWidth,
  ]);

  const onColumnUpdates = useCallback(
    ([{ name, dataType }]: BeeTableColumnUpdate<ROWTYPE>[]) => {
      setExpression((prev) => ({
        ...prev,
        name,
        dataType,
      }));
    },
    [setExpression]
  );

  const headerVisibility = useMemo(() => {
    return contextExpression.isHeadless ? BeeTableHeaderVisibility.None : BeeTableHeaderVisibility.SecondToLastLevel;
  }, [contextExpression.isHeadless]);

  const updateEntry = useCallback(
    (rowIndex: number, newEntry: ContextExpressionDefinitionEntry) => {
      setExpression((prev: ContextExpressionDefinition) => {
        const contextEntries = [...prev.contextEntries];
        contextEntries[rowIndex] = newEntry;
        return { ...prev, contextEntries };
      });
    },
    [setExpression]
  );

  const cellComponentByColumnId: BeeTableProps<ROWTYPE>["cellComponentByColumnId"] = useMemo(() => {
    return {
      entryInfo: (props) => {
        return <ContextEntryInfoCell {...props} onEntryUpdate={updateEntry} />;
      },
      entryExpression: (props) => {
        return <ContextEntryExpressionCell {...props} />;
      },
    };
  }, [updateEntry]);

  const beeTableOperationConfig = useMemo<BeeTableOperationConfig>(() => {
    return [
      {
        group: i18n.contextEntry,
        items: [
          { name: i18n.rowOperations.reset, type: BeeTableOperation.RowReset },
          { name: i18n.rowOperations.insertAbove, type: BeeTableOperation.RowInsertAbove },
          { name: i18n.rowOperations.insertBelow, type: BeeTableOperation.RowInsertBelow },
          { name: i18n.rowOperations.delete, type: BeeTableOperation.RowDelete },
        ],
      },
    ];
  }, [i18n]);

  const getRowKey = useCallback((row: ReactTable.Row<ROWTYPE>) => {
    return row.original.entryInfo.id;
  }, []);

  const beeTableAdditionalRow = useMemo(() => {
    return contextExpression.renderResult ?? true
      ? [
          <ContextResultInfoCell key={"context-result-info"} rowIndex={contextExpression.contextEntries.length} />,
          <ContextResultExpressionCell key={"context-result-expression"} contextExpression={contextExpression} />,
        ]
      : undefined;
  }, [contextExpression]);

  const getDefaultContextEntry = useCallback(
    (name?: string): ContextExpressionDefinitionEntry => {
      return {
        nameAndDataTypeSynchronized: true,
        entryExpression: {
          logicType: ExpressionDefinitionLogicType.Undefined,
          dataType: DmnBuiltInDataType.Undefined,
          id: generateUuid(),
        },
        entryInfo: {
          dataType: DmnBuiltInDataType.Undefined,
          id: generateUuid(),
          name:
            name ||
            getNextAvailablePrefixedName(
              contextExpression.contextEntries.map((e) => e.entryInfo.name),
              "ContextEntry"
            ),
        },
      };
    },
    [contextExpression]
  );

  const onRowAdded = useCallback(
    (args: { beforeIndex: number }) => {
      setExpression((prev: ContextExpressionDefinition) => {
        const newContextEntries = [...(prev.contextEntries ?? [])];
        newContextEntries.splice(args.beforeIndex, 0, getDefaultContextEntry());

        return {
          ...prev,
          contextEntries: newContextEntries,
        };
      });
    },
    [getDefaultContextEntry, setExpression]
  );

  const onColumnResizingWidthChange = useCallback((args: { columnIndex: number; newResizingWidth: ResizingWidth }) => {
    if (args.columnIndex === 1) {
      setEntryInfoResizingWidth(args.newResizingWidth);
    }
  }, []);

  const onRowDeleted = useCallback(
    (args: { rowIndex: number }) => {
      setExpression((prev: ContextExpressionDefinition) => {
        const newContextEntries = [...(prev.contextEntries ?? [])];
        newContextEntries.splice(args.rowIndex, 1);
        return {
          ...prev,
          contextEntries: newContextEntries,
        };
      });
    },
    [setExpression]
  );

  const onRowReset = useCallback(
    (args: { rowIndex: number }) => {
      setExpression((prev: ContextExpressionDefinition) => {
        // That's the additionalRow, meaning the contextExpression result.
        if (args.rowIndex === prev.contextEntries.length) {
          return {
            ...prev,
            result: {
              ...getDefaultContextEntry().entryExpression,
            },
          };
        }
        // That's a normal context entry
        else {
          const newContextEntries = [...(prev.contextEntries ?? [])];
          newContextEntries.splice(args.rowIndex, 1, {
            ...getDefaultContextEntry(newContextEntries[args.rowIndex].entryInfo.name),
          });
          return {
            ...prev,
            contextEntries: newContextEntries,
          };
        }
      });
    },
    [getDefaultContextEntry, setExpression]
  );

  return (
    <ContextExpressionContext.Provider value={contextExpressionContextValue}>
      <div className={`context-expression ${contextExpression.id}`}>
        <BeeTable
          tableId={contextExpression.id}
          headerLevelCount={1}
          headerVisibility={headerVisibility}
          cellComponentByColumnId={cellComponentByColumnId}
          columns={beeTableColumns}
          rows={contextExpression.contextEntries}
          onColumnUpdates={onColumnUpdates}
          operationConfig={beeTableOperationConfig}
          getRowKey={getRowKey}
          additionalRow={beeTableAdditionalRow}
          onRowAdded={onRowAdded}
          onRowReset={onRowReset}
          onRowDeleted={onRowDeleted}
          onColumnResizingWidthChange={onColumnResizingWidthChange}
          shouldRenderRowIndexColumn={false}
        />
      </div>
    </ContextExpressionContext.Provider>
  );
};

export interface ContextExpressionContextType {
  entryExpressionsMinWidthLocal: number;
  entryExpressionsMinWidthGlobal: number;
  entryExpressionsActualWidth: number;
  entryExpressionsResizingWidth: ResizingWidth;
}

export const ContextExpressionContext = React.createContext<ContextExpressionContextType>({
  entryExpressionsMinWidthLocal: -2,
  entryExpressionsMinWidthGlobal: -2,
  entryExpressionsActualWidth: -2,
  entryExpressionsResizingWidth: {
    value: -2,
    isPivoting: false,
  },
});

export function useContextExpressionContext() {
  return React.useContext(ContextExpressionContext);
}

export function ContextResultInfoCell(props: { rowIndex: number }) {
  const value = useMemo(() => {
    return `<result>`;
  }, []);

  const getValue = useCallback(() => {
    return value;
  }, [value]);

  useBeeTableCell(props.rowIndex, 1, undefined, getValue);

  return <div className="context-result">{value}</div>;
}
