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

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as PfReactTable from "@patternfly/react-table";
import { Resizer } from "../Resizer";
import * as ReactTable from "react-table";
import { BeeTableTdsAndThsProps } from "../../api";
import PlusIcon from "@patternfly/react-icons/dist/js/icons/plus-icon";

export interface BeeTableTdProps<R extends object> extends BeeTableTdsAndThsProps {
  // Individual cells are not immutable referecens, By referencing the row, we avoid multiple re-renders and bugs.
  row: ReactTable.Row<R>;
  column: ReactTable.ColumnInstance<R>;
  shouldUseCellDelegate: boolean;
  getColumnKey: (column: ReactTable.ColumnInstance<R>) => string;
  getContextMenuTdProps: (cellIndex: number, rowIndex: number) => Pick<PfReactTable.TdProps, "onContextMenu">;
  onRowAdded?: (args: { beforeIndex: number }) => void;
}

export type HoverInfo =
  | {
      isHovered: false;
    }
  | {
      isHovered: true;
      part: "upper" | "lower";
    };

export function BeeTableTd<R extends object>({
  columnIndex,
  row,
  column,
  rowIndex,
  shouldUseCellDelegate,
  onKeyDown,
  getColumnKey,
  getContextMenuTdProps,
  onRowAdded,
  yPosition,
}: BeeTableTdProps<R>) {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>({
    isHovered: false,
  });

  const tdRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    const handler = onKeyDown();
    const td = tdRef.current;
    td?.addEventListener("keydown", handler);
    return () => {
      td?.removeEventListener("keydown", handler);
    };
  }, [onKeyDown, rowIndex]);

  let cssClass = column.isRowIndexColumn ? "counter-cell" : "data-cell";
  if (column.cellDelegate) {
    cssClass += " input"; // FIXME: Tiago -> DMN Runner/DecisionTable-specific logic
  }

  const cell = useMemo(() => {
    return row.cells[columnIndex];
  }, [columnIndex, row]);

  const tdContent = useMemo(() => {
    return shouldUseCellDelegate && column.cellDelegate
      ? column.cellDelegate?.(`cell-delegate-${rowIndex}`)
      : cell.render("Cell");
  }, [cell, rowIndex, shouldUseCellDelegate, column]);

  const onMouseEnter = useCallback((e: React.MouseEvent<HTMLTableCellElement>) => {
    e.stopPropagation();
    return setHoverInfo(getHoverInfo(e, tdRef.current!));
  }, []);

  const onMouseLeave = useCallback((e: React.MouseEvent<HTMLTableCellElement>) => {
    e.stopPropagation();
    return setHoverInfo({ isHovered: false });
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    return setHoverInfo((prev) => {
      e.stopPropagation();
      return getHoverInfo(e, tdRef.current!);
    });
  }, []);

  const onAddRowButtonClick = useCallback(
    (e: React.MouseEvent) => {
      if (!hoverInfo.isHovered) {
        return;
      }
      e.stopPropagation();
      console.info(
        `Adding row ${hoverInfo.isHovered && hoverInfo.part === "lower" ? "below" : "above"} line number ${
          rowIndex + 1
        }.`
      );

      onRowAdded?.({ beforeIndex: hoverInfo.part === "upper" ? rowIndex : rowIndex + 1 });

      if (hoverInfo.part === "upper") {
        setHoverInfo({ isHovered: false });
      }
    },
    [hoverInfo, onRowAdded, rowIndex]
  );

  const inlineRowAddingCapabilities = useMemo(() => {
    if (!column.isRowIndexColumn || !onRowAdded) {
      return {};
    }

    return {
      onMouseEnter,
      onMouseLeave,
      onMouseMove,
    };
  }, [column.isRowIndexColumn, onMouseEnter, onMouseLeave, onMouseMove, onRowAdded]);

  const style = useMemo(() => {
    return {
      flexGrow: columnIndex === row.cells.length - 1 ? "1" : "0",
      overflow: "visible",
    };
  }, [columnIndex, row.cells.length]);

  const contextMenuTdProps = useMemo(() => {
    return getContextMenuTdProps(columnIndex, rowIndex);
  }, [columnIndex, getContextMenuTdProps, rowIndex]);

  return (
    <PfReactTable.Td
      {...contextMenuTdProps}
      {...inlineRowAddingCapabilities}
      key={`${rowIndex}-${getColumnKey(column)}-${columnIndex}`}
      ref={tdRef}
      tabIndex={-1}
      className={cssClass}
      data-ouia-component-id={`expression-column-${columnIndex}`} // FIXME: Tiago -> Bad name
      data-xposition={columnIndex}
      data-yposition={yPosition ?? rowIndex}
      style={style}
    >
      {column.isRowIndexColumn ? (
        <>{rowIndex + 1}</>
      ) : (
        <Resizer
          width={cell.column.width}
          setWidth={cell.column.setWidth}
          minWidth={cell.column.minWidth}
          setResizingWidth={cell.column.setResizingWidth}
          resizingWidth={cell.column.resizingWidth}
          actualWidth={cell.column.width}
        >
          <>{tdContent}</>
        </Resizer>
      )}

      {hoverInfo.isHovered && column.isRowIndexColumn && onRowAdded && (
        <div
          onClick={onAddRowButtonClick}
          className={"add-row-button"}
          style={{ ...(hoverInfo.part === "lower" ? { bottom: "-10px" } : { top: "-10px" }) }}
        >
          <PlusIcon size="sm" />
        </div>
      )}
    </PfReactTable.Td>
  );
}

function getHoverInfo(e: React.MouseEvent, elem: HTMLElement): HoverInfo {
  const rect = elem.getBoundingClientRect();
  const localY = e.clientY - rect.top; // y position within the element.
  const part = localY < rect.height / 3 ? "upper" : "lower"; // upper part is the upper third
  return { isHovered: true, part };
}
