import * as React from "react";
import { useContext, useMemo } from "react";

export interface BeeTableStickyHeadersType {
  offsetTop: number;
  offsetLeft: number;
  selfTop: number;
  selfLeft: number;
}

const BeeTableStickyHeaders = React.createContext({
  offsetTop: 0,
  offsetLeft: 0,
  selfTop: 0,
  selfLeft: 0,
});

export function useBeeTableStickyHeaders() {
  return useContext(BeeTableStickyHeaders);
}

export function BeeTableStickyHeadersProvider({
  value,
  children,
}: React.PropsWithChildren<{ value: BeeTableStickyHeadersType }>) {
  const val = useMemo(() => {
    return {
      offsetTop: value.offsetTop + 20,
      offsetLeft: value.offsetLeft,
      selfTop: value.selfTop,
      selfLeft: value.selfLeft,
    };
  }, [value.offsetLeft, value.offsetTop, value.selfLeft, value.selfTop]);

  return <BeeTableStickyHeaders.Provider value={val}>{children}</BeeTableStickyHeaders.Provider>;
}
