import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import * as ReactTable from "react-table";
import {
  useBeeTableResizableColumns,
  useBeeTableResizableColumnsDispatch,
} from "../../resizing/BeeTableResizableColumnsContext";
import { useNestedExpressionContainer } from "../../resizing/NestedExpressionContainerContext";
import { ResizingWidth } from "../../resizing/ResizingWidthsContext";

export function BeeTableThController({
  columnIndex,
  column,
  reactTableInstance,
}: {
  columnIndex: number;
  column: ReactTable.ColumnInstance<any>;
  reactTableInstance: ReactTable.TableInstance<any>;
}) {
  useBeeTableFillingResizingWidth(columnIndex, column, reactTableInstance);
  return <></>;
}

export function useBeeTableFillingResizingWidth(
  columnIndex: number,
  column: ReactTable.ColumnInstance<any>,
  reactTableInstance: ReactTable.TableInstance<any>
) {
  const nestedExpressionContainer = useNestedExpressionContainer();
  const { columnResizingWidths } = useBeeTableResizableColumns();
  const { updateColumnResizingWidths } = useBeeTableResizableColumnsDispatch();

  // That's be be used for:
  // a) Flexible-sized columns -> Terminal columns that don't have a width, and adapt to the size of their cells; or
  // b) Parent columns -> Columns with subColumns.
  const [fillingResizingWidth, setFillingResizingWidth] = useState({
    isPivoting: false,
    value: 0,
  });

  const subColumnsResizingWidth = useMemo(() => {
    return getTotalResizingWidth(column, columnResizingWidths, reactTableInstance);
  }, [column, columnResizingWidths, reactTableInstance]);

  const isPivoting = useMemo(() => {
    return subColumnsResizingWidth.isPivoting || nestedExpressionContainer.resizingWidth.isPivoting;
  }, [nestedExpressionContainer.resizingWidth.isPivoting, subColumnsResizingWidth.isPivoting]);

  // Flexible-sized columns should always be equal to nestedExpressionContainer.resizingWidth
  useEffect(() => {
    if (isFlexbileColumn(column)) {
      updateColumnResizingWidths(
        new Map([
          [
            columnIndex,
            {
              isPivoting,
              value: nestedExpressionContainer.resizingWidth.value,
            },
          ],
        ])
      );
    }
  }, [
    column,
    column.columns?.length,
    column.width,
    columnIndex,
    isPivoting,
    nestedExpressionContainer.resizingWidth,
    updateColumnResizingWidths,
  ]);

  // Parent and flexible-sized columns should always have their width equal to the sum of its subColumns
  useEffect(() => {
    if (isFlexbileColumn(column) || isParentColumn(column))
      setFillingResizingWidth((prev) => {
        if (prev.value === subColumnsResizingWidth.value && prev.isPivoting === subColumnsResizingWidth.isPivoting) {
          return prev; // Skip updating if nothing changed.
        } else {
          return subColumnsResizingWidth;
        }
      });
  }, [column, column.accessor, subColumnsResizingWidth]);

  const fillingMinWidth = useMemo(
    () =>
      Math.max(
        nestedExpressionContainer.minWidth,
        computeFlexibleWidth(column, "minWidth", nestedExpressionContainer.minWidth)
      ),
    [column, nestedExpressionContainer.minWidth]
  );

  const fillingWidth = useMemo(
    () =>
      Math.max(
        nestedExpressionContainer.minWidth,
        computeFlexibleWidth(column, "width", nestedExpressionContainer.actualWidth)
      ),
    [column, nestedExpressionContainer.actualWidth, nestedExpressionContainer.minWidth]
  );

  return { fillingResizingWidth, setFillingResizingWidth, fillingMinWidth, fillingWidth };
}

export function computeFlexibleWidth(
  column: ReactTable.ColumnInstance<any>,
  property: "width" | "minWidth",
  container: number
): number {
  // Flexible-sized column
  if (isFlexbileColumn(column)) {
    return container ?? column.minWidth ?? 0;
  }

  // Parent column
  if (isParentColumn(column)) {
    return (column.columns ?? []).reduce((acc, c) => acc + computeFlexibleWidth(c, property, container), 0);
  }

  // Exact-sized column
  return column[property] ?? column.minWidth ?? 0;
}

export function findIndexOfColumn(
  column: ReactTable.ColumnInstance<any> | undefined,
  reactTableInstance: ReactTable.TableInstance<any>
) {
  return reactTableInstance.allColumns.findIndex(({ id }) => id === column?.id);
}

export function getTotalResizingWidth(
  column: ReactTable.ColumnInstance<any>,
  columnResizingWidths: Map<number, ResizingWidth | undefined>,
  reactTableInstance: ReactTable.TableInstance<any>
) {
  const flatListOfSubColumns = getFlatListOfSubColumns(column);
  const indexOfFirstSubColumn = findIndexOfColumn(flatListOfSubColumns[0], reactTableInstance);

  let value = 0;
  let isPivoting = false;
  flatListOfSubColumns.forEach((_, index) => {
    const resizingWidth = columnResizingWidths.get(indexOfFirstSubColumn + index);
    value += resizingWidth?.value ?? 0;
    isPivoting = isPivoting || (resizingWidth?.isPivoting ?? false);
  });

  return { isPivoting, value };
}

export function getFlatListOfSubColumns(column: ReactTable.ColumnInstance<any>): ReactTable.ColumnInstance<any>[] {
  if (isParentColumn(column)) {
    return (column.columns ?? []).flatMap((c) => getFlatListOfSubColumns(c));
  }

  return [column];
}

export function isParentColumn(column: ReactTable.ColumnInstance<any>) {
  return (column.columns?.length ?? 0) > 0;
}

export function isFlexbileColumn(column: ReactTable.ColumnInstance<any>) {
  return !column.width && !column.columns?.length;
}
