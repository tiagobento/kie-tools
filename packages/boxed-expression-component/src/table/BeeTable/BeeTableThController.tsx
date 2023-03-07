import * as React from "react";
import * as ReactTable from "react-table";
import {
  useBeeTableResizableColumns,
  useBeeTableResizableColumnsDispatch,
} from "../../resizing/BeeTableResizableColumnsContext";
import { useNestedExpressionContainer } from "../../resizing/NestedExpressionContainerContext";
import { ResizingWidth } from "../../resizing/ResizingWidthsContext";

export interface Props {
  columnIndex: number;
  column: ReactTable.ColumnInstance<any>;
  reactTableInstance: ReactTable.TableInstance<any>;
}

export function BeeTableThController({ columnIndex, column, reactTableInstance }: Props) {
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
  const [fillingResizingWidth, setFillingResizingWidth] = React.useState({
    isPivoting: false,
    value: 0,
  });

  // Flexible-sized columns should always be equal to nestedExpressionContainer.resizingWidth
  React.useEffect(() => {
    if (!column.width && !column.columns?.length) {
      updateColumnResizingWidths(new Map([[columnIndex, nestedExpressionContainer.resizingWidth]]));
    }
  }, [
    column.columns?.length,
    column.width,
    columnIndex,
    nestedExpressionContainer.resizingWidth,
    updateColumnResizingWidths,
  ]);

  const totalSubColumnsWidth = React.useMemo(() => {
    return getTotalResizingWidth(column, columnResizingWidths, reactTableInstance);
  }, [column, columnResizingWidths, reactTableInstance]);

  // Parent and flexible-sized columns should always have their width equal to the sum of its subColumns
  React.useEffect(() => {
    setFillingResizingWidth((prev) => {
      if (prev.value === totalSubColumnsWidth) {
        return prev; // Skip updating if nothing changed.
      } else {
        return { isPivoting: false, value: totalSubColumnsWidth };
      }
    });
  }, [column, column.accessor, totalSubColumnsWidth]);

  const fillingMinWidth = React.useMemo(
    () =>
      Math.max(
        nestedExpressionContainer.minWidth,
        computeFlexibleWidth(column, "minWidth", nestedExpressionContainer.minWidth)
      ),
    [column, nestedExpressionContainer.minWidth]
  );

  const fillingWidth = React.useMemo(
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
  col: ReactTable.ColumnInstance<any>,
  property: "width" | "minWidth",
  container: number
): number {
  // Flexible-sized column
  if (!col.width && !col.columns?.length) {
    return container ?? col.minWidth ?? 0;
  }

  // Parent column
  if (!col.width && col.columns?.length) {
    return col.columns.reduce((acc, c) => acc + computeFlexibleWidth(c, property, container), 0);
  }

  // Exact-sized column
  return col[property] ?? col.minWidth ?? 0;
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

  let total = 0;
  flatListOfSubColumns.forEach((_, index) => {
    total += columnResizingWidths.get(indexOfFirstSubColumn + index)?.value ?? 0;
  });
  return total;
}

export function getFlatListOfSubColumns(column: ReactTable.ColumnInstance<any>): ReactTable.ColumnInstance<any>[] {
  if (!column.columns?.length) {
    return [column];
  }

  return (column.columns ?? []).flatMap((c) => getFlatListOfSubColumns(c));
}
