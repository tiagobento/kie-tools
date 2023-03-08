import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ReactTable from "react-table";
import {
  useBeeTableResizableColumns,
  useBeeTableResizableColumnsDispatch,
} from "../../resizing/BeeTableResizableColumnsContext";
import { apportionColumnWidths } from "../../resizing/Hooks";
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
  // a) Flexible columns -> Terminal columns that don't have a width, and adapt to the size of their cells; or
  // b) Parent columns -> Columns with subColumns.
  const [fillingResizingWidth, setFillingResizingWidth] = useState({
    isPivoting: false,
    value: 0,
  });

  const totalColumnResizingWidth = useMemo(() => {
    return getTotalColumnResizingWidth(column, columnResizingWidths, reactTableInstance);
  }, [column, columnResizingWidths, reactTableInstance]);

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

  const setFillingWidth = useCallback(
    (newWidth: number) => {
      if (isFlexbileColumn(column)) {
        updateColumnResizingWidths(new Map([[columnIndex, { isPivoting: false, value: newWidth }]]));
      }

      if (isParentColumn(column)) {
        const flatListOfSubColumns = getFlatListOfSubColumns(column);
        const indexOfFirstSubColumn = findIndexOfColumn(flatListOfSubColumns[0], reactTableInstance);

        const subColumns = flatListOfSubColumns.map(({ minWidth, width, isWidthPinned }) => ({
          minWidth: minWidth ?? 0,
          currentWidth: width ?? minWidth ?? 0,
          isFrozen: isWidthPinned ?? false,
        }));

        const fixedWidthAmount = subColumns.reduce(
          (acc, { isFrozen, currentWidth, minWidth }) => (isFrozen ? acc + (currentWidth ?? minWidth) : acc),
          0
        );

        const nextTotalWidth = newWidth - fixedWidthAmount;
        const apportionedWidths = apportionColumnWidths(nextTotalWidth, subColumns);

        const newColumnWidths = apportionedWidths.reduce((acc, nextWidth, index) => {
          const columnIndex = indexOfFirstSubColumn + index;
          if (subColumns[index]?.isFrozen) {
            return acc; // Skip updating frozen columns.
          }

          acc.set(columnIndex, { isPivoting: false, value: nextWidth });
          return acc;
        }, new Map());

        updateColumnResizingWidths(newColumnWidths);
      }
    },
    [column, columnIndex, reactTableInstance, updateColumnResizingWidths]
  );

  // SYNC
  useEffect(() => {
    if (fillingResizingWidth.isPivoting) {
      return;
    }

    if (isFlexbileColumn(column)) {
      updateColumnResizingWidths(
        new Map([
          [
            columnIndex,
            {
              isPivoting: totalColumnResizingWidth.isPivoting, // Keep whatever this column has.
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
    nestedExpressionContainer.resizingWidth.value,
    totalColumnResizingWidth.isPivoting,
    updateColumnResizingWidths,
  ]);

  // WRITE
  useEffect(() => {
    if (!fillingResizingWidth.isPivoting) {
      return;
    }

    // Flexible column.
    if (isFlexbileColumn(column)) {
      updateColumnResizingWidths(new Map([[columnIndex, fillingResizingWidth]]));
      return;
    }

    // Exact column
    if (!isParentColumn(column)) {
      return;
    }

    // Parent column.
    const flatListOfSubColumns = getFlatListOfSubColumns(column);
    const indexOfFirstSubColumn = findIndexOfColumn(flatListOfSubColumns[0], reactTableInstance);

    const subColumns = flatListOfSubColumns.map(({ minWidth, width, isWidthPinned }) => ({
      minWidth: minWidth ?? 0,
      currentWidth: width ?? minWidth ?? 0,
      isFrozen: isWidthPinned ?? false,
    }));

    const fixedWidthAmount = subColumns.reduce(
      (acc, { isFrozen, currentWidth, minWidth }) => (isFrozen ? acc + (currentWidth ?? minWidth) : acc),
      0
    );

    const nextTotalWidth = fillingResizingWidth.value - fixedWidthAmount;
    const apportionedWidths = apportionColumnWidths(nextTotalWidth, subColumns);

    const newColumnWidths = apportionedWidths.reduce((acc, nextWidth, index) => {
      const columnIndex = indexOfFirstSubColumn + index;
      if (subColumns[index]?.isFrozen) {
        return acc; // Skip updating frozen columns.
      }

      acc.set(columnIndex, { isPivoting: true, value: nextWidth });
      return acc;
    }, new Map());

    updateColumnResizingWidths(newColumnWidths);
  }, [
    column.columns,
    updateColumnResizingWidths,
    fillingResizingWidth,
    columnIndex,
    column.width,
    column,
    reactTableInstance,
  ]);

  return { fillingResizingWidth, setFillingResizingWidth, fillingMinWidth, fillingWidth, setFillingWidth };
}

export function sumColumnPropertyRecursively(
  column: ReactTable.ColumnInstance<any>,
  property: "width" | "minWidth",
  containerValue: number
): number {
  // Flexible column
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

  // Exact column
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
  return !column.width && !isParentColumn(column);
}
