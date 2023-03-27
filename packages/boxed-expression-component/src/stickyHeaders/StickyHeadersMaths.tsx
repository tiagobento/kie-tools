export const MAX_DEPTH_FOR_STICKY_HEADERS = 100;
export const HEADER_HEIGHT_FOR_STICKY_HEADERS = 52; // Not 100% correct, but looks good on screen.
export const ROW_INDEX_COLUMN_WIDTH_FOR_STICKY_HEADERS = 59 + 1 + 1 + 1; // Not 100% correct, but looks good on screen.

export function getThZindex(depth: number) {
  return (MAX_DEPTH_FOR_STICKY_HEADERS - (depth + 1)) * 100;
}

export function getTheadTrZindex(depth: number) {
  return (MAX_DEPTH_FOR_STICKY_HEADERS - (depth + 1)) * 99;
}

export function getTdZindex(depth: number) {
  return (MAX_DEPTH_FOR_STICKY_HEADERS - (depth + 1)) * 98;
}
