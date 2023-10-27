import * as React from "react";
import { useMemo } from "react";
import * as RF from "reactflow";

export enum PositionalNodeHandleId {
  Left = "positional-handle-left",
  Top = "positional-handle-top",
  Right = "positional-handle-right",
  Bottom = "positional-handle-bottom",
  Center = "positional-handle-center",
}

export function PositionalNodeHandles(props: { isTargeted: boolean; nodeId: string }) {
  const targetsStyle: React.CSSProperties = useMemo(
    () => (props.isTargeted ? {} : { opacity: 0, pointerEvents: "none" }),
    [props.isTargeted]
  );

  const type: RF.HandleType = "target"; // Has to be target, because those are the only target handles present on nodes. Without them, edges cannot be rendered.

  return (
    <>
      <RF.Handle
        id={PositionalNodeHandleId.Left}
        className={"kie-dmn-editor--node-handle left"}
        style={{ ...targetsStyle }}
        type={type}
        position={RF.Position.Left}
      />
      <RF.Handle
        id={PositionalNodeHandleId.Top}
        className={"kie-dmn-editor--node-handle top"}
        style={{ ...targetsStyle }}
        type={type}
        position={RF.Position.Top}
      />
      <RF.Handle
        id={PositionalNodeHandleId.Right}
        className={"kie-dmn-editor--node-handle right"}
        style={{ ...targetsStyle }}
        type={type}
        position={RF.Position.Right}
      />
      <RF.Handle
        id={PositionalNodeHandleId.Bottom}
        className={"kie-dmn-editor--node-handle bottom"}
        style={{ ...targetsStyle }}
        type={type}
        position={RF.Position.Bottom}
      />
      <RF.Handle
        id={PositionalNodeHandleId.Center}
        className={"kie-dmn-editor--node-handle center"}
        style={{ ...targetsStyle }}
        type={type}
        position={RF.Position.Top}
      />
    </>
  );
}
