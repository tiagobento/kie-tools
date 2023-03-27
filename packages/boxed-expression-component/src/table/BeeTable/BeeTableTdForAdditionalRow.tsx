/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
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

import * as ReactTable from "react-table";
import * as React from "react";
import { useRef } from "react";
import { Resizer } from "../../resizing/Resizer";
import { useBeeTableResizableCell } from "../../resizing/BeeTableResizableColumnsContext";
import { useBeeTableSelectableCell, useBeeTableSelection } from "../../selection/BeeTableSelectionContext";
import { ResizerStopBehavior } from "../../resizing/ResizingWidthsContext";
import { getTdZindex } from "../../stickyHeaders/StickyHeadersMaths";
import { useBeeTableStickyHeaders } from "../../stickyHeaders/BeeTableStickyHeadersContext";

export interface BeeTableTdForAdditionalRowProps<R extends object> {
  children?: React.ReactElement;
  isEmptyCell: boolean;
  isLastColumn: boolean;
  shouldRenderRowIndexColumn: boolean;
  rowIndex: number;
  row: ReactTable.Row<R>;
  columnIndex: number;
  resizerStopBehavior: ResizerStopBehavior;
  column: ReactTable.ColumnInstance<R>;
  lastColumnMinWidth?: number;
}

export function BeeTableTdForAdditionalRow<R extends object>({
  children,
  isEmptyCell,
  columnIndex,
  column,
  rowIndex,
  isLastColumn,
  shouldRenderRowIndexColumn,
  resizerStopBehavior,
  lastColumnMinWidth,
}: BeeTableTdForAdditionalRowProps<R>) {
  const tdRef = useRef<HTMLTableCellElement>(null);

  const { resizingWidth, setResizingWidth } = useBeeTableResizableCell(
    columnIndex,
    resizerStopBehavior,
    column.width,
    column.setWidth,
    // If the column specifies a width, then we should respect its minWidth as well.
    column.width ? Math.max(lastColumnMinWidth ?? column.minWidth ?? 0, column.width ?? 0) : undefined
  );

  const { cssClasses, onMouseDown, onDoubleClick } = useBeeTableSelectableCell(tdRef, rowIndex, columnIndex);

  const { depth } = useBeeTableSelection();
  const stickyHeaders = useBeeTableStickyHeaders();

  return isEmptyCell ? (
    <td
      ref={tdRef}
      role="cell"
      className={`empty-cell ${cssClasses}`}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      style={{
        position: "sticky",
        left: `${stickyHeaders.offsetLeft - stickyHeaders.selfLeft}px`,
        zIndex: getTdZindex(depth),
        height: "inherit",
        background: "white",
      }}
    >
      <br />
    </td>
  ) : (
    <td
      ref={tdRef}
      role={"cell"}
      className={`additional-row-content ${cssClasses}`}
      tabIndex={-1}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      style={
        !shouldRenderRowIndexColumn && columnIndex === 1
          ? {
              position: "sticky",
              left: `${stickyHeaders.offsetLeft - stickyHeaders.selfLeft}px`,
              zIndex: getTdZindex(depth),
              height: "inherit",
              background: "white",
            }
          : {}
      }
    >
      {children}

      {!column.isWidthConstant && (
        <Resizer
          minWidth={lastColumnMinWidth ?? column.minWidth}
          width={column.width}
          setWidth={column.setWidth}
          resizingWidth={resizingWidth}
          setResizingWidth={setResizingWidth}
        />
      )}
    </td>
  );
}
