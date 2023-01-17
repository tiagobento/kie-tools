import { useMemo, useEffect } from "react";
import { ExpressionDefinition } from "../api";
import {
  useNestedExpressionContainer,
  usePivotAwareNestedExpressionContainer,
  NestedExpressionContainerContextType,
} from "./NestedExpressionContainerContext";
import { ResizingWidth, useResizingWidths, useResizingWidthsDispatch } from "./ResizingWidthsContext";
import { getExpressionResizingWidth, getExpressionMinWidth } from "./WidthMaths";

export function useNestedExpressionResizingWidth(
  isPivoting: boolean,
  nestedExpressions: ExpressionDefinition[],
  fixedColumnActualWidth: number,
  fixedColumnResizingWidth: ResizingWidth,
  fixedColumnMinWidth: number,
  nestedExpressionMinWidth: number,
  extraWidth: number
) {
  const { resizingWidths } = useResizingWidths();
  const nestedExpressionContainer = useNestedExpressionContainer();
  const pivotAwareNestedExpressionContainer = usePivotAwareNestedExpressionContainer(isPivoting);

  const nestedExpressionResizingWidthValue = useMemo<number>(() => {
    if (nestedExpressionContainer.resizingWidth.isPivoting && !isPivoting) {
      return nestedExpressionContainer.resizingWidth.value - fixedColumnResizingWidth.value - extraWidth;
    }

    const nestedPivotingExpression: ExpressionDefinition | undefined = nestedExpressions.filter(
      ({ id }) => resizingWidths.get(id)?.isPivoting ?? false
    )[0];

    if (nestedPivotingExpression) {
      return Math.max(getExpressionResizingWidth(nestedPivotingExpression, resizingWidths), fixedColumnMinWidth);
    }

    const nestedExpressionContainerResizingWidthValue =
      fixedColumnResizingWidth.value >= fixedColumnActualWidth
        ? pivotAwareNestedExpressionContainer.resizingWidth.value
        : nestedExpressionContainer.actualWidth;

    return Math.max(
      nestedExpressionContainerResizingWidthValue - fixedColumnResizingWidth.value - extraWidth,
      ...nestedExpressions.map((e) => getExpressionResizingWidth(e, new Map())),
      nestedExpressionMinWidth
    );
  }, [
    nestedExpressionContainer.resizingWidth.isPivoting,
    nestedExpressionContainer.resizingWidth.value,
    nestedExpressionContainer.actualWidth,
    isPivoting,
    nestedExpressions,
    fixedColumnResizingWidth.value,
    fixedColumnActualWidth,
    pivotAwareNestedExpressionContainer.resizingWidth.value,
    extraWidth,
    nestedExpressionMinWidth,
    resizingWidths,
    fixedColumnMinWidth,
  ]);

  return nestedExpressionResizingWidthValue;
}

export function useNestedExpressionMinWidth(
  nestedExpressions: ExpressionDefinition[],
  fixedColumnResizingWidth: ResizingWidth,
  nestedExpressionMinWidth: number,
  extraWidth: number
) {
  const nestedExpressionContainer = useNestedExpressionContainer();
  return useMemo(() => {
    return Math.max(
      nestedExpressionContainer.minWidth - fixedColumnResizingWidth.value - extraWidth,
      ...nestedExpressions.map((e) => getExpressionMinWidth(e)),
      nestedExpressionMinWidth
    );
  }, [
    nestedExpressionMinWidth,
    fixedColumnResizingWidth.value,
    extraWidth,
    nestedExpressionContainer.minWidth,
    nestedExpressions,
  ]);
}

export function useNestedExpressionActualWidth(
  nestedExpressions: ExpressionDefinition[],
  fixedColumnActualWidth: number,
  extraWidth: number
) {
  const nestedExpressionContainer = useNestedExpressionContainer();
  const { resizingWidths } = useResizingWidths();

  return useMemo<number>(() => {
    return Math.max(
      nestedExpressionContainer.actualWidth - fixedColumnActualWidth - extraWidth,
      ...nestedExpressions
        .filter(({ id }) => !(resizingWidths.get(id)?.isPivoting ?? false))
        .map((expression) => getExpressionResizingWidth(expression, new Map()))
    );
  }, [fixedColumnActualWidth, extraWidth, nestedExpressionContainer.actualWidth, nestedExpressions, resizingWidths]);
}

export function useNestedExpressionContainerWithNestedExpressions({
  nestedExpressions,
  fixedColumnActualWidth,
  fixedColumnResizingWidth,
  fixedColumnMinWidth,
  nestedExpressionMinWidth,
  extraWidth,
  expression,
}: {
  nestedExpressions: ExpressionDefinition[];
  fixedColumnActualWidth: number;
  fixedColumnResizingWidth: ResizingWidth;
  fixedColumnMinWidth: number;
  nestedExpressionMinWidth: number;
  extraWidth: number;
  expression: ExpressionDefinition;
}) {
  const { resizingWidths } = useResizingWidths();
  const isPivoting = useMemo<boolean>(() => {
    return (
      fixedColumnResizingWidth.isPivoting || nestedExpressions.some(({ id }) => resizingWidths.get(id)?.isPivoting)
    );
  }, [fixedColumnResizingWidth.isPivoting, nestedExpressions, resizingWidths]);

  const nestedExpressionResizingWidthValue = useNestedExpressionResizingWidth(
    isPivoting,
    nestedExpressions,
    fixedColumnActualWidth,
    fixedColumnResizingWidth,
    fixedColumnMinWidth,
    nestedExpressionMinWidth,
    extraWidth
  );

  const maxNestedExpressionMinWidth = useNestedExpressionMinWidth(
    nestedExpressions,
    fixedColumnResizingWidth,
    nestedExpressionMinWidth,
    extraWidth
  );

  const nestedExpressionActualWidth = useNestedExpressionActualWidth(
    nestedExpressions,
    fixedColumnActualWidth,
    extraWidth
  );

  const nestedExpressionContainer = useNestedExpressionContainer();

  const nestedExpressionContainerValue = useMemo<NestedExpressionContainerContextType>(() => {
    return {
      minWidth: maxNestedExpressionMinWidth,
      actualWidth: nestedExpressionActualWidth,
      resizingWidth: {
        value: nestedExpressionResizingWidthValue,
        isPivoting: isPivoting || nestedExpressionContainer.resizingWidth.isPivoting,
      },
    };
  }, [
    maxNestedExpressionMinWidth,
    nestedExpressionActualWidth,
    nestedExpressionResizingWidthValue,
    isPivoting,
    nestedExpressionContainer.resizingWidth.isPivoting,
  ]);

  const { updateResizingWidth } = useResizingWidthsDispatch();

  useEffect(() => {
    updateResizingWidth(expression.id, (prev) => ({
      value: fixedColumnResizingWidth.value + nestedExpressionResizingWidthValue + extraWidth,
      isPivoting,
    }));
  }, [
    expression.id,
    nestedExpressionResizingWidthValue,
    isPivoting,
    updateResizingWidth,
    fixedColumnResizingWidth.value,
    extraWidth,
  ]);

  return useMemo(() => {
    return { nestedExpressionContainerValue };
  }, [nestedExpressionContainerValue]);
}
