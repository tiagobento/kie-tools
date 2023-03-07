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

  const fillingMinWidth = useMemo(
    () =>
      Math.max(
        nestedExpressionContainer.minWidth,
        sumColumnPropertyRecursively(column, "minWidth", nestedExpressionContainer.minWidth)
      ),
    [column, nestedExpressionContainer.minWidth]
  );

  const fillingWidth = useMemo(
    () =>
      Math.max(
        nestedExpressionContainer.minWidth,
        sumColumnPropertyRecursively(column, "width", nestedExpressionContainer.actualWidth)
      ),
    [column, nestedExpressionContainer.actualWidth, nestedExpressionContainer.minWidth]
  );

  const { columnResizingWidths } = useBeeTableResizableColumns();
  const { updateColumnResizingWidths } = useBeeTableResizableColumnsDispatch();

  // That's be be used for:
  // a) Flexible-sized columns -> Terminal columns that don't have a width, and adapt to the size of their cells; or
  // b) Parent columns -> Columns with subColumns.
  const [fillingResizingWidth, setFillingResizingWidth] = useState({
    isPivoting: false,
    value: 0,
  });

  const totalColumnResizingWidth = useMemo(() => {
    return getTotalColumnResizingWidth(column, columnResizingWidths, reactTableInstance);
  }, [column, columnResizingWidths, reactTableInstance]);

  // Flexible-sized columns should always be equal to nestedExpressionContainer.resizingWidth
  useEffect(() => {
    if (isFlexbileColumn(column)) {
      updateColumnResizingWidths(
        new Map([
          [
            columnIndex,
            {
              isPivoting: fillingResizingWidth.isPivoting,
              value: nestedExpressionContainer.resizingWidth.value,
            },
          ],
        ])
      );
    }
  }, [
    column,
    columnIndex,
    fillingResizingWidth.isPivoting,
    nestedExpressionContainer.resizingWidth,
    updateColumnResizingWidths,
  ]);

  useEffect(() => {
    setFillingResizingWidth((prev) => {
      if (prev.isPivoting) {
        return prev; // In this case, the resize handle from fillingResizingWidth is in use, therefore, we shouldn't interfere.
      } else if (prev.value === totalColumnResizingWidth.value) {
        return prev; // Skip updating if nothing changed.
      } else if (isFlexbileColumn(column)) {
        return { isPivoting: false, value: totalColumnResizingWidth.value }; // Something changed on a parent column or on the column's cells.
      } else if (isParentColumn(column)) {
        return { isPivoting: false, value: totalColumnResizingWidth.value }; // Something changed on sub columns or on the sub column's cells.
      } else {
        return prev; // Ignore
      }
    });
  }, [column, totalColumnResizingWidth]);

  return { fillingResizingWidth, setFillingResizingWidth, fillingMinWidth, fillingWidth };
}

export function sumColumnPropertyRecursively(
  column: ReactTable.ColumnInstance<any>,
  property: "width" | "minWidth",
  containerValue: number
): number {
  // Flexible-sized column
  if (isFlexbileColumn(column)) {
    return containerValue ?? column.minWidth ?? 0;
  }

  // Parent column
  if (isParentColumn(column)) {
    return (column.columns ?? []).reduce(
      (acc, c) => acc + sumColumnPropertyRecursively(c, property, containerValue),
      0
    );
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

export function getTotalColumnResizingWidth(
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
