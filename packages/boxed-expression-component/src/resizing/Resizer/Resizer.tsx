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
import { Resizable } from "react-resizable";
import { ResizerStopBehavior, ResizingWidth, useResizingWidthsDispatch } from "../../resizing/ResizingWidthsContext";
import { DEFAULT_MIN_WIDTH } from "../WidthConstants";
import "./Resizer.css";

export interface ResizerProps {
  minWidth: number | undefined;
  width: number | undefined;
  setWidth: React.Dispatch<React.SetStateAction<number | undefined>> | undefined;
  resizingWidth: ResizingWidth | undefined;
  setResizingWidth: (newResizingWidth: ResizingWidth) => void;
  setResizing?: React.Dispatch<React.SetStateAction<boolean>>;
  getWidthToFitData?: () => number | undefined;
}

export const Resizer: React.FunctionComponent<ResizerProps> = ({
  minWidth,
  width,
  setWidth,
  resizingWidth,
  setResizingWidth,
  setResizing,
  getWidthToFitData,
}) => {
  //
  // onResizeStop batching strategy (begin)
  //
  // This is a hack to make React batch the multiple state updates we're doing here with the calls to `setWidth`.
  // Every call to `setWidth` mutates the expression, so batching is essential for performance reasons.
  // This effect runs once when resizingStop__data is truthy. Then, after running, it sets resizingStop__data to a falsy value, which short-circuits it.
  //
  // This can be refactored to be simpler when upgrading to React 18, as batching is automatic, even outside event handlers and hooks.
  //
  // This whole thing is responsible for allowing any cell to shrink the entire table when resized.

  const { getResizerRefs, setResizing: _setResizing } = useResizingWidthsDispatch();

  const [resizingStop__data, setResizingStop__data] = useState({ width: 0 });
  const [startResizingWidth, setStartResizingWidth] = useState({ width: 0 });
  const onResizeStop = useCallback((e, data) => {
    if (e.detail === 2) {
      console.debug("Skipping resizeStop onMouseUp because onDoubleClick will handle it.");
      return;
    }

    setResizingStop__data({ width: data.size.width });
  }, []);

  useEffect(() => {
    const resizingStopWidth = Math.floor(resizingStop__data.width);
    if (!resizingStopWidth) {
      return;
    }

    if (resizingStopWidth === startResizingWidth.width) {
      console.debug(`Stop resizing (equal): ${resizingStopWidth}`);
    } else {
      console.debug(`Stop resizing (different): ${resizingStopWidth}`);
      for (const resizerRef of getResizerRefs()) {
        if (resizerRef.resizingWidth?.value !== resizerRef.width) {
          resizerRef.setWidth?.((prev) => {
            const prevWidth = prev ?? 0;
            const resizingWidthValue = resizerRef.resizingWidth?.value ?? prevWidth;
            if (resizerRef.resizerStopBehavior === ResizerStopBehavior.SET_WIDTH_ALWAYS) {
              return resizingWidthValue;
            } else if (resizerRef.resizerStopBehavior === ResizerStopBehavior.SET_WIDTH_WHEN_SMALLER) {
              return Math.min(resizingWidthValue, prevWidth);
            } else {
              throw new Error("Shouldn't ever reach this point");
            }
          });
        }
      }

      if (resizingStopWidth !== width) {
        setWidth?.(resizingStopWidth);
      }
    }

    setResizing?.(false);
    _setResizing(false);
    setResizingWidth?.({ value: resizingStopWidth, isPivoting: false });
    setResizingStop__data({ width: 0 }); // Prevent this effect from running after it just ran. Let onResizeStop trigger it.
  }, [
    _setResizing,
    getResizerRefs,
    setResizing,
    setResizingWidth,
    setWidth,
    resizingStop__data.width,
    startResizingWidth.width,
    width,
  ]);

  //
  // onResizeStop batching strategy (end)
  //

  const minConstraints = useMemo<[number, number]>(() => {
    return [minWidth ?? DEFAULT_MIN_WIDTH, 0];
  }, [minWidth]);

  const onResize = useCallback(
    (_, data) => {
      setResizingWidth?.({ value: Math.floor(data.size.width), isPivoting: true });
    },
    [setResizingWidth]
  );

  const onResizeStart = useCallback(
    (_, data) => {
      const startResizingWidth = Math.floor(data.size.width);

      console.debug(`Start resizing: ${startResizingWidth}`);
      setStartResizingWidth({ width: startResizingWidth });
      setResizingWidth?.({ value: startResizingWidth, isPivoting: true });
      setResizing?.(true);
      _setResizing(true);
    },
    [_setResizing, setResizing, setResizingWidth]
  );

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      let widthToFitData;
      try {
        widthToFitData = getWidthToFitData?.();
      } catch (e) {
        // Ignore, as bugs can appear...
      }

      const newWidth = Math.max(widthToFitData ?? minWidth ?? DEFAULT_MIN_WIDTH, minWidth ?? DEFAULT_MIN_WIDTH);

      // This starts the resizing process again with the correct width.
      onResizeStart(undefined, { size: { width: newWidth } });

      // Wait for an event loop iteration, leaving time for the resizeStart to propagate.
      // Then, pretend that the startResizingWidth is different from the one we're going to stop with.
      setTimeout(() => {
        setStartResizingWidth({ width: 0 });
        setResizingStop__data({ width: newWidth });
      }, 0);
    },
    [getWidthToFitData, minWidth, onResizeStart]
  );

  const style = useMemo(() => {
    return { width: resizingWidth?.value, minWidth };
  }, [minWidth, resizingWidth?.value]);

  const debuggingHandleClassNames = `
    ${minWidth === resizingWidth?.value ? "min" : ""} 
    ${(resizingWidth?.value ?? 0) < (minWidth ?? 0) ? "error" : ""}
  `;

  return (
    <>
      {width && (
        <div className="pf-c-drawer" style={{ position: "absolute", left: width - 10 }}>
          <div className={`pf-c-drawer__splitter pf-m-vertical actual`}>
            <div className={`pf-c-drawer__splitter-handle`} />
          </div>
        </div>
      )}

      {width && minWidth && (
        <div className="pf-c-drawer" style={{ position: "absolute", left: minWidth - 10 }}>
          <div className={`pf-c-drawer__splitter pf-m-vertical min-basis`}>
            <div className={`pf-c-drawer__splitter-handle`} />
          </div>
        </div>
      )}

      {width && resizingWidth && (
        <Resizable
          width={resizingWidth?.value}
          height={0}
          onResize={onResize}
          onResizeStop={onResizeStop}
          onResizeStart={onResizeStart}
          minConstraints={minConstraints}
          className={"resizable-div"}
          axis={"x"}
          handle={
            <div className="pf-c-drawer" onDoubleClick={onDoubleClick}>
              <div className={`pf-c-drawer__splitter pf-m-vertical `}>
                <div className={`pf-c-drawer__splitter-handle`} />
              </div>
            </div>
          }
        >
          <div style={style} />
        </Resizable>
      )}
    </>
  );
};
