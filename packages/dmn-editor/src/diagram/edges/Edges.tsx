import * as React from "react";
import * as RF from "reactflow";
import { useCallback, useMemo } from "react";
import { DMNDI13__DMNEdge, DMNDI13__DMNShape } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_4/ts-gen/types";
import { getSnappedMultiPointAnchoredEdgePath } from "./getSnappedMultiPointAnchoredEdgePath";

export function KieEdge(props: RF.EdgeProps) {
  const sourceNode = RF.useStore(useCallback((store) => store.nodeInternals.get(props.source), [props.source]));
  const targetNode = RF.useStore(useCallback((store) => store.nodeInternals.get(props.target), [props.target]));
  const dmnEdge = props.data.dmnEdge as DMNDI13__DMNEdge | undefined;
  const dmnShapeSource = props.data.dmnShapeSource as DMNDI13__DMNShape | undefined;
  const dmnShapeTarget = props.data.dmnShapeTarget as DMNDI13__DMNShape | undefined;

  const { path, points } = useMemo(
    () =>
      getSnappedMultiPointAnchoredEdgePath({
        dmnEdge,
        sourceNode,
        targetNode,
        dmnShapeSource,
        dmnShapeTarget,
      }),
    [dmnEdge, dmnShapeSource, dmnShapeTarget, sourceNode, targetNode]
  );

  return (
    <>
      {path && (
        <>
          <path d={path} markerEnd={props.markerEnd} markerStart={props.markerStart} style={props.style} />
        </>
      )}

      {/* {points.map((p, i) => (
        <circle
          key={i}
          cx={p["@_x"]}
          cy={p["@_y"]}
          r={5}
          fill={i === 0 || i === points.length - 1 ? "lightblue" : "black"}
        />
      ))} */}

      {/* {(dmnEdge?.["di:waypoint"] ?? []).map((p, i) => (
        <circle key={i} cx={p["@_x"]} cy={p["@_y"]} r={5} fill={"red"} />
      ))} */}
    </>
  );
}

export function InformationRequirementEdge(props: RF.EdgeProps) {
  return (
    <>
      <KieEdge {...props} style={{ strokeWidth: 1, stroke: "black" }} />
    </>
  );
}

export function KnowledgeRequirementEdge(props: RF.EdgeProps) {
  return (
    <>
      <KieEdge {...props} style={{ strokeDasharray: "5,5", strokeWidth: 1, stroke: "black" }} />
    </>
  );
}

export function AuthorityRequirementEdge(props: RF.EdgeProps) {
  return (
    <>
      <KieEdge {...props} style={{ strokeDasharray: "5,5", strokeWidth: 1, stroke: "black" }} />
    </>
  );
}

export function AssociationEdge(props: RF.EdgeProps) {
  return (
    <>
      <KieEdge {...props} style={{ strokeDasharray: "2,10", strokeWidth: 1, stroke: "black" }} />
    </>
  );
}
