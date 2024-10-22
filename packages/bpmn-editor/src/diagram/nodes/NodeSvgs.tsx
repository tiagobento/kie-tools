/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import * as React from "react";
import { DEFAULT_INTRACTION_WIDTH } from "@kie-tools/xyflow-react-kie-diagram/dist/maths/DcMaths";
import { DEFAULT_NODE_FILL, DEFAULT_NODE_STROKE_COLOR } from "./NodeStyle";
import {
  containerNodeInteractionRectCssClassName,
  DEFAULT_NODE_STROKE_WIDTH,
  NodeSvgProps,
  normalize,
} from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/NodeSvgs";
import { containerNodeVisibleRectCssClassName } from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/NodeSvgs";
import { ActivityNodeMarker, EventVariant, GatewayVariant, SubProcessVariant, TaskVariant } from "../BpmnDiagramDomain";
import { useMemo } from "react";

export function DataObjectNodeSvg(
  __props: NodeSvgProps & { isIcon?: boolean; showFoldedPage?: boolean; showArrow?: boolean; transform?: string }
) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { isIcon: _isIcon, showFoldedPage: _showFoldedPage, showArrow: _showArrow, ...props },
  } = normalize(__props);

  const bevel = 25;
  const arrowStartingX = 6;
  const arrowStartingY = 10;

  const showFoldedPage = _showFoldedPage ?? false;
  const showArrow = _showArrow ?? false;
  const isIcon = _isIcon ?? false;

  return (
    <>
      <polygon
        {...props}
        points={`0,0 0,${height} ${width},${height} ${width},${bevel} ${width - bevel},0 ${width - bevel},0`}
        fill={DEFAULT_NODE_FILL}
        stroke={DEFAULT_NODE_STROKE_COLOR}
        strokeLinejoin={"round"}
        strokeWidth={strokeWidth}
        transform={isIcon ? __props.transform : `translate(${x},${y})`}
      />
      {showFoldedPage === true && (
        <polygon
          {...props}
          points={`${width - bevel},0 ${width - bevel},${bevel} ${width},${bevel}`}
          fill={DEFAULT_NODE_FILL}
          stroke={DEFAULT_NODE_STROKE_COLOR}
          strokeLinejoin={"round"}
          strokeWidth={strokeWidth}
          transform={`translate(${x},${y})`}
        />
      )}
      {showArrow === true && (
        <polygon
          {...props}
          points={`${arrowStartingX},${arrowStartingY} ${arrowStartingX},20 20,20 20,26 30,15 20,4 20,${arrowStartingY} `}
          fill={DEFAULT_NODE_FILL}
          stroke={DEFAULT_NODE_STROKE_COLOR}
          strokeLinejoin={"round"}
          strokeWidth={strokeWidth}
          transform={`translate(${x},${y})`}
        />
      )}
    </>
  );
}

const deg30 = Math.PI / 6;
const cos30 = Math.cos(deg30);
const sin30 = Math.sin(deg30);

export const NODE_COLORS = {
  startEvent: {
    foreground: "#4aa241",
    background: "#e8fae6",
  },
  intermediateCatchEvent: {
    foreground: "#e6a000",
    background: "#fbefcf",
  },
  boundaryEvent: {
    foreground: "#e6a000",
    background: "#fbefcf",
  },
  intermediateThrowEvent: {
    foreground: "#007a87",
    background: "#bddee1",
  },
  endEvent: {
    foreground: "#a30000",
    background: "#fce7e7",
  },
  gateway: {
    background: "#fef5ea",
    foreground: "#ec7b08",
  },
  task: {
    foreground: "black",
    background: "#efefef",
  },
  subProcess: {
    foreground: "black",
    background: "#efefef",
  },
} as const;

export function StartEventNodeSvg(__props: NodeSvgProps & { variant: EventVariant | "none" }) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ..._props },
  } = normalize(__props);

  const { variant, ...props } = { ..._props };

  const cx = x + width / 2;
  const cy = y + height / 2;

  const r = width / 2;

  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={NODE_COLORS.startEvent.background}
        stroke={NODE_COLORS.startEvent.foreground}
        strokeLinejoin={"round"}
        r={r}
        {...props}
      />
      <EventVariantSymbolSvg
        variant={variant}
        fill={NODE_COLORS.startEvent.background}
        filled={false}
        stroke={NODE_COLORS.startEvent.foreground}
        x={x}
        y={y}
        cx={cx}
        cy={cy}
        innerCircleRadius={r - 5}
        outerCircleRadius={r}
      />
    </>
  );
}
export function IntermediateCatchEventNodeSvg(
  __props: NodeSvgProps & { rimWidth?: number; variant: EventVariant | "none" }
) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ..._props },
  } = normalize(__props);

  const { rimWidth, variant, ...props } = { ..._props };

  const outerCircleRadius = width / 2;
  const innerCircleRadius = outerCircleRadius - (rimWidth ?? 5);

  const cx = x + width / 2;
  const cy = y + height / 2;

  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={NODE_COLORS.intermediateCatchEvent.background}
        stroke={NODE_COLORS.intermediateCatchEvent.foreground}
        strokeLinejoin={"round"}
        r={outerCircleRadius}
        {...props}
      />
      <circle
        cx={cx}
        cy={cy}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={NODE_COLORS.intermediateCatchEvent.background}
        stroke={NODE_COLORS.intermediateCatchEvent.foreground}
        strokeLinejoin={"round"}
        r={innerCircleRadius}
        {...props}
      />
      <EventVariantSymbolSvg
        variant={variant}
        fill={NODE_COLORS.intermediateCatchEvent.background}
        filled={false}
        stroke={NODE_COLORS.intermediateCatchEvent.foreground}
        x={x}
        y={y}
        cx={cx}
        cy={cy}
        innerCircleRadius={innerCircleRadius}
        outerCircleRadius={outerCircleRadius}
      />
    </>
  );
}
export function IntermediateThrowEventNodeSvg(
  __props: NodeSvgProps & { rimWidth?: number; variant: EventVariant | "none" }
) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ..._props },
  } = normalize(__props);

  const { rimWidth, variant, ...props } = { ..._props };

  const outerCircleRadius = width / 2;
  const innerCircleRadius = outerCircleRadius - (rimWidth ?? 5);

  const cx = x + width / 2;
  const cy = y + height / 2;

  return (
    <>
      <circle
        cx={x + width / 2}
        cy={y + height / 2}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={NODE_COLORS.intermediateThrowEvent.background}
        stroke={NODE_COLORS.intermediateThrowEvent.foreground}
        strokeLinejoin={"round"}
        r={outerCircleRadius}
        {...props}
      />
      <circle
        cx={x + width / 2}
        cy={y + height / 2}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={NODE_COLORS.intermediateThrowEvent.background}
        stroke={NODE_COLORS.intermediateThrowEvent.foreground}
        strokeLinejoin={"round"}
        r={innerCircleRadius}
        {...props}
      />
      <EventVariantSymbolSvg
        variant={variant}
        fill={NODE_COLORS.intermediateThrowEvent.background}
        filled={true}
        stroke={NODE_COLORS.intermediateThrowEvent.foreground}
        x={x}
        y={y}
        cx={cx}
        cy={cy}
        innerCircleRadius={innerCircleRadius}
        outerCircleRadius={outerCircleRadius}
      />
    </>
  );
}
export function EndEventNodeSvg(__props: NodeSvgProps & { variant: EventVariant | "none" }) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ..._props },
  } = normalize(__props);

  const { variant, ...props } = { ..._props };

  const cx = x + width / 2;
  const cy = y + height / 2;

  const r = width / 2;

  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={NODE_COLORS.endEvent.background}
        stroke={NODE_COLORS.endEvent.foreground}
        strokeLinejoin={"round"}
        r={r}
        {...props}
      />
      <EventVariantSymbolSvg
        variant={variant}
        fill={NODE_COLORS.endEvent.background}
        filled={true}
        stroke={NODE_COLORS.endEvent.foreground}
        x={x}
        y={y}
        cx={cx}
        cy={cy}
        innerCircleRadius={r - 5}
        outerCircleRadius={r}
      />
    </>
  );
}
export function TaskNodeSvg(
  __props: NodeSvgProps & {
    markers?: (ActivityNodeMarker | "CallActivityPaletteIcon")[];
    variant?: TaskVariant | "none";
  }
) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ..._props },
  } = normalize(__props);

  const { markers: _markers, variant: _variant, ...props } = { ..._props };

  const markers = useMemo(() => new Set(_markers), [_markers]);
  const variant = _variant ?? "none";

  return (
    <>
      <rect
        x={x}
        y={y}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={DEFAULT_NODE_FILL}
        stroke={DEFAULT_NODE_STROKE_COLOR}
        strokeLinejoin={"round"}
        rx="3"
        ry="3"
        {...props}
      />
      {markers.has("CallActivityPaletteIcon") && (
        <rect
          x={x + (width / 2 - width / 3 / 2)}
          y={y + (height - height / 3)}
          strokeWidth={strokeWidth}
          width={width / 3}
          height={height / 3}
          fill={"black"}
          stroke={"black"}
          strokeLinejoin={"round"}
          rx="0"
          ry="0"
          {...props}
        />
      )}
      <ActivityNodeIcons x={x} y={y} width={width} height={height} icons={markers as Set<ActivityNodeMarker>} />
    </>
  );
}
export function GatewayNodeSvg(
  __props: NodeSvgProps & { variant: GatewayVariant | "none"; isMorphingPanel?: boolean }
) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ..._props },
  } = normalize(__props);

  const { variant, isMorphingPanel, ...props } = { ..._props };
  const morphingPanelOffset = isMorphingPanel ? 25 : 0;

  return (
    <>
      {!isMorphingPanel && (
        <rect
          x={8 + x}
          y={8 + y}
          transform={`rotate(45,${x + width / 2},${y + height / 2})`}
          strokeWidth={strokeWidth}
          width={width / 1.4} // sqrt(2)
          height={height / 1.4} // sqrt(2)
          fill={NODE_COLORS.gateway.background}
          stroke={NODE_COLORS.gateway.foreground}
          strokeLinejoin={"round"}
          rx="5"
          ry="5"
          {...props}
        />
      )}
      {variant === "parallelGateway" && (
        <ParallelGatewaySvg
          stroke={NODE_COLORS.gateway.foreground}
          strokeWidth={isMorphingPanel ? 30 : 4.5}
          cx={x + width / 2}
          cy={y + height / 2 - morphingPanelOffset}
          size={isMorphingPanel ? 210 : 30}
        />
      )}
      {variant === "exclusiveGateway" && (
        <ExclusiveGatewaySvg
          stroke={NODE_COLORS.gateway.foreground}
          strokeWidth={isMorphingPanel ? 30 : 4.5}
          cx={x + width / 2}
          cy={y + height / 2 - morphingPanelOffset}
          size={isMorphingPanel ? 210 : 30}
        />
      )}
      {variant === "inclusiveGateway" && (
        <InclusiveGatewaySvg
          stroke={NODE_COLORS.gateway.foreground}
          strokeWidth={isMorphingPanel ? 30 : 4.5}
          cx={x + width / 2}
          cy={y + height / 2 - morphingPanelOffset}
          size={isMorphingPanel ? 275 : 40}
        />
      )}
      {variant === "eventBasedGateway" && (
        <EventBasedGatewaySvg
          stroke={NODE_COLORS.gateway.foreground}
          circleStrokeWidth={isMorphingPanel ? 10 : 1.5}
          strokeWidth={isMorphingPanel ? 30 : 2}
          cx={x + width / 2}
          cy={y + height / 2 - morphingPanelOffset}
          size={isMorphingPanel ? 275 : 40}
        />
      )}
      {variant === "complexGateway" && (
        <ComplexGatewaySvg
          stroke={NODE_COLORS.gateway.foreground}
          strokeWidth={isMorphingPanel ? 30 : 4.5}
          cx={x + width / 2}
          cy={y + height / 2 - morphingPanelOffset}
          size={isMorphingPanel ? 300 : 50}
        />
      )}
    </>
  );
}

export function ParallelGatewaySvg({
  stroke,
  strokeWidth,
  cx,
  cy,
  size,
}: {
  stroke: string;
  strokeWidth?: number;
  cx: number;
  cy: number;
  size: number;
}) {
  return (
    <>
      <line x1={cx} y1={cy - size / 2} x2={cx} y2={cy + size / 2} stroke={stroke} strokeWidth={strokeWidth ?? 1.5} />
      <line x1={cx - size / 2} y1={cy} x2={cx + size / 2} y2={cy} stroke={stroke} strokeWidth={strokeWidth ?? 1.5} />
    </>
  );
}

export function ExclusiveGatewaySvg({
  stroke,
  strokeWidth,
  cx,
  cy,
  size,
}: {
  stroke: string;
  strokeWidth?: number;
  cx: number;
  cy: number;
  size: number;
}) {
  return (
    <>
      <line
        x1={cx - size / 3}
        y1={cy - size / 3}
        x2={cx + size / 3}
        y2={cy + size / 3}
        stroke={stroke}
        strokeWidth={strokeWidth ?? 2}
      />
      <line
        x1={cx + size / 3}
        y1={cy - size / 3}
        x2={cx - size / 3}
        y2={cy + size / 3}
        stroke={stroke}
        strokeWidth={strokeWidth ?? 2}
      />
    </>
  );
}

export function InclusiveGatewaySvg({
  stroke,
  strokeWidth,
  cx,
  cy,
  size,
}: {
  stroke: string;
  strokeWidth?: number;
  cx: number;
  cy: number;
  size: number;
}) {
  return (
    <>
      <circle cx={cx} cy={cy} r={size / 3} stroke={stroke} strokeWidth={strokeWidth ?? 1.5} fill="none" />
    </>
  );
}

export function EventBasedGatewaySvg({
  stroke,
  strokeWidth,
  circleStrokeWidth,
  cx,
  cy,
  size,
}: {
  stroke: string;
  strokeWidth?: number;
  circleStrokeWidth?: number;
  cx: number;
  cy: number;
  size: number;
}) {
  const pentagonPoints = Array.from({ length: 5 }, (_, i) => {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    return {
      x: cx + (size / 4) * Math.cos(angle),
      y: cy + (size / 4) * Math.sin(angle),
    };
  });

  return (
    <>
      <circle cx={cx} cy={cy} r={size / 3} stroke={stroke} strokeWidth={circleStrokeWidth} fill="none" />
      <circle cx={cx} cy={cy} r={size / 2.5} stroke={stroke} strokeWidth={circleStrokeWidth} fill="none" />
      <polygon
        points={pentagonPoints.map((point) => `${point.x},${point.y}`).join(" ")}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
      />
    </>
  );
}

export function ComplexGatewaySvg({
  stroke,
  strokeWidth,
  cx,
  cy,
  size,
}: {
  stroke: string;
  strokeWidth?: number;
  cx: number;
  cy: number;
  size: number;
}) {
  const lineLength = size / 3;
  const diagonalLength = lineLength / Math.sqrt(2);

  return (
    <>
      <line x1={cx} y1={cy - lineLength} x2={cx} y2={cy + lineLength} stroke={stroke} strokeWidth={strokeWidth ?? 2} />
      <line x1={cx - lineLength} y1={cy} x2={cx + lineLength} y2={cy} stroke={stroke} strokeWidth={strokeWidth ?? 2} />
      <line
        x1={cx - diagonalLength}
        y1={cy - diagonalLength}
        x2={cx + diagonalLength}
        y2={cy + diagonalLength}
        stroke={stroke}
        strokeWidth={strokeWidth ?? 2}
      />
      <line
        x1={cx + diagonalLength}
        y1={cy - diagonalLength}
        x2={cx - diagonalLength}
        y2={cy + diagonalLength}
        stroke={stroke}
        strokeWidth={strokeWidth ?? 2}
      />
    </>
  );
}

export const LaneNodeSvg = React.forwardRef<SVGRectElement, NodeSvgProps & { gutterWidth?: number }>((__props, ref) => {
  const { gutterWidth: _gutterWidth, ..._props } = { ...__props };
  const { x, y, width, height, strokeWidth, props } = normalize(_props);

  const {
    strokeWidth: interactionRectStrokeWidth,
    x: interactionRectX,
    y: interactionRectY,
    width: interactionRectWidth,
    height: interactionRectHeight,
    props: _interactionRectProps,
  } = normalize({ ..._props, strokeWidth: DEFAULT_INTRACTION_WIDTH / 2 });

  const { ...interactionRectProps } = _interactionRectProps;

  const gutterWidth = _gutterWidth ?? 40;

  return (
    <>
      <rect
        {...props}
        x={x}
        y={y}
        width={width}
        height={height}
        strokeWidth={strokeWidth}
        fill={"transparent"}
        stroke={DEFAULT_NODE_STROKE_COLOR}
        strokeLinejoin={"round"}
        rx={"3"}
        ry={"3"}
        className={containerNodeVisibleRectCssClassName}
      />
      <line
        x1={x + gutterWidth}
        y1={y}
        x2={x + gutterWidth}
        y2={y + height}
        stroke={DEFAULT_NODE_STROKE_COLOR}
        strokeWidth={strokeWidth}
      />
      <rect
        {...interactionRectProps}
        ref={ref}
        x={interactionRectX}
        y={interactionRectY}
        width={interactionRectWidth}
        height={interactionRectHeight}
        strokeWidth={interactionRectStrokeWidth}
        fill={"transparent"}
        stroke={"transparent"}
        strokeLinejoin={"round"}
        rx={"0"}
        ry={"0"}
        className={containerNodeInteractionRectCssClassName}
      />
    </>
  );
});

export const SubProcessNodeSvg = React.forwardRef<
  SVGRectElement,
  NodeSvgProps & {
    borderRadius?: number;
    rimWidth?: number;
    icons?: ActivityNodeMarker[];
    variant?: SubProcessVariant;
  }
>((__props, ref) => {
  const {
    rimWidth: _rimWidth,
    borderRadius: _borderRadius,
    icons: _icons,
    variant: _variant,
    ..._props
  } = { ...__props };
  const { x, y, width, height, strokeWidth, props } = normalize(_props);

  const {
    strokeWidth: interactionRectStrokeWidth,
    x: interactionRectX,
    y: interactionRectY,
    width: interactionRectWidth,
    height: interactionRectHeight,
    props: _interactionRectProps,
  } = normalize({ ..._props, strokeWidth: DEFAULT_INTRACTION_WIDTH / 2 });

  const { ...interactionRectProps } = _interactionRectProps;

  const icons = useMemo(() => new Set(_icons), [_icons]);
  const variant = _variant ?? "other";
  const rimWidth = variant === "transaction" ? _rimWidth ?? 5 : 0;
  const borderRadius = variant === "transaction" ? _borderRadius ?? 10 : 2;

  return (
    <>
      {variant === "transaction" && (
        <rect
          {...props}
          x={x + rimWidth}
          y={y + rimWidth}
          width={width - rimWidth * 2}
          height={height - rimWidth * 2}
          strokeWidth={strokeWidth}
          fill={"transparent"}
          stroke={DEFAULT_NODE_STROKE_COLOR}
          strokeLinejoin={"round"}
          rx={borderRadius - rimWidth}
          ry={borderRadius - rimWidth}
          className={containerNodeVisibleRectCssClassName}
        />
      )}
      <rect
        {...props}
        x={x}
        y={y}
        width={width}
        height={height}
        strokeWidth={strokeWidth}
        fill={"transparent"}
        stroke={DEFAULT_NODE_STROKE_COLOR}
        strokeDasharray={variant === "event" ? "10,5" : undefined}
        strokeLinejoin={"round"}
        rx={borderRadius}
        ry={borderRadius}
        className={containerNodeVisibleRectCssClassName}
      />
      {/* ↓ interaction rect */}
      <rect
        {...interactionRectProps}
        ref={ref}
        x={interactionRectX}
        y={interactionRectY}
        width={interactionRectWidth}
        height={interactionRectHeight}
        strokeWidth={interactionRectStrokeWidth}
        fill={"transparent"}
        stroke={"transparent"}
        strokeLinejoin={"round"}
        rx={"0"}
        ry={"0"}
        className={containerNodeInteractionRectCssClassName}
      />
      <ActivityNodeIcons x={x} y={y} width={width} height={height} icons={icons} />
    </>
  );
});

export function TextAnnotationNodeSvg(__props: NodeSvgProps & { showPlaceholder?: boolean }) {
  const { strokeWidth, x, y, width, height, props: _props } = normalize(__props);
  const { showPlaceholder, ...props } = _props;
  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={"transparent"}
        stroke={"transparent"}
        strokeLinejoin={"round"}
        transform={`translate(${x},${y})`}
      />
      <path
        {...props}
        x={x}
        y={y}
        fill={"transparent"}
        d={`M20,0 L0,0 M0,0 L0,${height} M0,${height} L20,${height}`}
        stroke={DEFAULT_NODE_STROKE_COLOR}
        strokeWidth={strokeWidth}
        strokeLinejoin={"round"}
        transform={`translate(${x},${y})`}
      />
      {showPlaceholder && (
        <text x={"20%"} y={"62.5%"} style={{ fontSize: "5em", fontWeight: "bold" }}>
          Text
        </text>
      )}
    </>
  );
}

export const GroupNodeSvg = React.forwardRef<SVGRectElement, NodeSvgProps & { strokeDasharray?: string }>(
  (__props, ref) => {
    const { strokeWidth, x, y, width, height, props } = normalize(__props);
    const {
      strokeWidth: interactionRectStrokeWidth,
      x: interactionRectX,
      y: interactionRectY,
      width: interactionRectWidth,
      height: interactionRectHeight,
      props: _interactionRectProps,
    } = normalize({ ...__props, strokeWidth: DEFAULT_INTRACTION_WIDTH / 2 });

    const { strokeDasharray: interactionRectStrokeDasharray, ...interactionRectProps } = _interactionRectProps;

    const strokeDasharray = props.strokeDasharray ?? "14,10,3,10";
    return (
      <>
        <rect
          {...props}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={"transparent"}
          stroke={DEFAULT_NODE_STROKE_COLOR}
          strokeLinejoin={"round"}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          rx={40}
          ry={40}
        />
        <rect
          {...interactionRectProps}
          ref={ref}
          x={interactionRectX}
          y={interactionRectY}
          width={interactionRectWidth}
          height={interactionRectHeight}
          strokeWidth={interactionRectStrokeWidth}
          fill={"transparent"}
          stroke={"transparent"}
          rx={"30"}
          ry={"30"}
          className={containerNodeInteractionRectCssClassName}
        />
      </>
    );
  }
);

export function UnknownNodeSvg(_props: NodeSvgProps & { strokeDasharray?: string }) {
  const { strokeWidth, x, y, width, height, props } = normalize(_props);
  const strokeDasharray = props.strokeDasharray ?? "2,4";
  return (
    <>
      <rect
        {...props}
        x={x}
        y={y}
        width={width}
        height={height}
        fill={"transparent"}
        stroke={"red"}
        strokeLinejoin={"round"}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />
    </>
  );
}

export function EventVariantSymbolSvg({
  variant,
  stroke,
  strokeWidth,
  isMorphingPanel,
  cx,
  cy,
  x,
  y,
  innerCircleRadius,
  outerCircleRadius,
  fill,
  filled,
}: {
  variant: EventVariant | "none";
  stroke: string;
  strokeWidth?: number;
  isMorphingPanel?: boolean;
  cx: number;
  cy: number;
  x: number;
  y: number;
  innerCircleRadius: number;
  outerCircleRadius: number;
  fill?: string;
  filled: boolean;
}) {
  return (
    <>
      {variant === "messageEventDefinition" && (
        <MessageEventSymbolSvg
          fill={fill ?? "none"}
          filled={filled}
          stroke={stroke}
          strokeWidth={strokeWidth}
          isMorphingPanel={isMorphingPanel}
          cx={cx}
          cy={cy}
          innerCircleRadius={innerCircleRadius}
        />
      )}
      {variant === "timerEventDefinition" && (
        <TimerEventSymbolSvg
          filled={filled}
          stroke={stroke}
          strokeWidth={strokeWidth}
          isMorphingPanel={isMorphingPanel}
          cx={cx}
          cy={cy}
          innerCircleRadius={innerCircleRadius}
          outerCircleRadius={outerCircleRadius}
        />
      )}
      {variant === "errorEventDefinition" && (
        <ErrorEventSymbolSvg
          filled={filled}
          stroke={stroke}
          strokeWidth={strokeWidth}
          cx={cx}
          cy={cy}
          innerCircleRadius={innerCircleRadius}
          outerCircleRadius={outerCircleRadius}
        />
      )}
      {variant === "escalationEventDefinition" && (
        <EscalationEventSymbolSvg
          filled={filled}
          stroke={stroke}
          strokeWidth={strokeWidth}
          isMorphingPanel={isMorphingPanel}
          cx={cx}
          cy={cy}
          innerCircleRadius={innerCircleRadius}
        />
      )}
      {variant === "cancelEventDefinition" && (
        <CancelEventSymbolSvg
          filled={filled}
          stroke={stroke}
          strokeWidth={strokeWidth}
          cx={cx}
          cy={cy}
          innerCircleRadius={innerCircleRadius}
        />
      )}
      {variant === "compensateEventDefinition" && (
        <CompensationEventSymbolSvg
          filled={filled}
          stroke={stroke}
          strokeWidth={strokeWidth}
          x={x}
          y={y}
          cx={cx}
          cy={cy}
          innerCircleRadius={innerCircleRadius}
          outerCircleRadius={outerCircleRadius}
        />
      )}
      {variant === "conditionalEventDefinition" && (
        <ConditionalEventSymbolSvg
          filled={filled}
          stroke={stroke}
          strokeWidth={strokeWidth}
          isMorphingPanel={isMorphingPanel}
          cx={cx}
          cy={cy}
          outerCircleRadius={outerCircleRadius}
        />
      )}
      {variant === "linkEventDefinition" && (
        <LinkEventSymbolSvg
          filled={filled}
          stroke={stroke}
          strokeWidth={strokeWidth}
          isMorphingPanel={isMorphingPanel}
          cx={cx}
          cy={cy}
          innerCircleRadius={innerCircleRadius}
        />
      )}
      {variant === "signalEventDefinition" && (
        <SignalEventSymbolSvg
          filled={filled}
          stroke={stroke}
          strokeWidth={strokeWidth}
          isMorphingPanel={isMorphingPanel}
          x={x}
          y={y}
          cx={cx}
          cy={cy}
          innerCircleRadius={innerCircleRadius}
          outerCircleRadius={outerCircleRadius}
        />
      )}
      {variant === "terminateEventDefinition" && (
        <>
          <circle
            cx={cx}
            cy={cy}
            strokeWidth={strokeWidth ?? 2.5}
            fill={NODE_COLORS.endEvent.foreground}
            stroke={NODE_COLORS.endEvent.foreground}
            strokeLinejoin={"round"}
            r={outerCircleRadius / 2}
          />
        </>
      )}
      {/* multiple */}
      {/* parallel multiple */}
    </>
  );
}

export function MessageEventSymbolSvg({
  stroke,
  strokeWidth,
  isMorphingPanel,
  cx,
  cy,
  innerCircleRadius,
  fill,
  filled,
}: {
  stroke: string;
  strokeWidth?: number;
  isMorphingPanel?: boolean;
  cx: number;
  cy: number;
  innerCircleRadius: number;
  fill: string;
  filled: boolean;
}) {
  const scaleFactor = isMorphingPanel ? 1.9 : 1;

  const scaledBodyWidth = innerCircleRadius * 1.2 * scaleFactor;
  const scaledBodyHeight = innerCircleRadius * 0.8 * scaleFactor;

  const envelopeBody = {
    topLeft: { x: cx - scaledBodyWidth / 2, y: cy - scaledBodyHeight / 2 },
    bottomRight: { x: cx + scaledBodyWidth / 2, y: cy + scaledBodyHeight / 2 },
  };

  const scaledFlapHeight = scaledBodyHeight * 0.5;
  const envelopeFlap = [
    { x: envelopeBody.topLeft.x, y: envelopeBody.topLeft.y }, // top-left
    { x: envelopeBody.bottomRight.x, y: envelopeBody.topLeft.y }, // top-right
    { x: cx, y: envelopeBody.topLeft.y + scaledFlapHeight }, // center flap
  ];

  return (
    <>
      <rect
        x={envelopeBody.topLeft.x}
        y={envelopeBody.topLeft.y}
        width={scaledBodyWidth}
        height={scaledBodyHeight}
        strokeWidth={strokeWidth ?? 1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : fill}
        stroke={stroke}
      />

      <polygon
        points={envelopeFlap.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={strokeWidth ?? 1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : fill}
        stroke={stroke}
      />

      {filled && (
        <>
          <line
            x1={envelopeFlap[0].x}
            y1={envelopeFlap[0].y}
            x2={envelopeFlap[2].x}
            y2={envelopeFlap[2].y}
            stroke={fill}
            strokeWidth={strokeWidth ?? 1.5}
          />
          <line
            x1={envelopeFlap[1].x}
            y1={envelopeFlap[1].y}
            x2={envelopeFlap[2].x}
            y2={envelopeFlap[2].y}
            stroke={fill}
            strokeWidth={strokeWidth ?? 1.5}
          />
        </>
      )}
    </>
  );
}

export function TimerEventSymbolSvg({
  stroke,
  strokeWidth,
  isMorphingPanel,
  cx,
  cy,
  innerCircleRadius,
  outerCircleRadius,
  filled,
}: {
  stroke: string;
  strokeWidth?: number;
  isMorphingPanel?: boolean;
  cx: number;
  cy: number;
  innerCircleRadius: number;
  outerCircleRadius: number;
  filled: boolean;
}) {
  const scaleFactor = isMorphingPanel ? 1.4 : 1;

  const scaledPadding = 1.2 * (outerCircleRadius - innerCircleRadius) * scaleFactor;
  const scaledClockRadius = (innerCircleRadius - scaledPadding) * scaleFactor;

  const scaledShortHandLength = scaledClockRadius * 0.5;
  const scaledLongHandLength = scaledClockRadius * 0.9;

  const hourHandAngle = Math.PI / 12;
  const minuteHandAngle = (-5 * Math.PI) / 12;

  const hourHand = {
    x: cx + scaledShortHandLength * Math.cos(hourHandAngle),
    y: cy + scaledShortHandLength * Math.sin(hourHandAngle),
  };

  const minuteHand = {
    x: cx + scaledLongHandLength * Math.cos(minuteHandAngle),
    y: cy + scaledLongHandLength * Math.sin(minuteHandAngle),
  };

  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        r={scaledClockRadius}
        stroke={stroke}
        strokeWidth={strokeWidth ?? 1.5}
        fill={filled ? stroke : "transparent"}
      />

      <line
        x1={cx}
        y1={cy}
        x2={hourHand.x}
        y2={hourHand.y}
        stroke={filled ? "transparent" : stroke}
        strokeWidth={strokeWidth ?? 1.5}
      />

      <line
        x1={cx}
        y1={cy}
        x2={minuteHand.x}
        y2={minuteHand.y}
        stroke={filled ? "transparent" : stroke}
        strokeWidth={strokeWidth ?? 1.5}
      />

      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * 2 * Math.PI;
        const x1 = cx + scaledClockRadius * Math.cos(angle);
        const y1 = cy + scaledClockRadius * Math.sin(angle);
        const x2 = cx + (scaledClockRadius - scaledPadding * 0.5) * Math.cos(angle);
        const y2 = cy + (scaledClockRadius - scaledPadding * 0.5) * Math.sin(angle);

        return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={1.5} />;
      })}
    </>
  );
}

export function ErrorEventSymbolSvg({
  stroke,
  strokeWidth,
  cx,
  cy,
  innerCircleRadius,
  outerCircleRadius,
  filled,
}: {
  stroke: string;
  strokeWidth?: number;
  isMorphingPanel?: boolean;
  cx: number;
  cy: number;
  innerCircleRadius: number;
  outerCircleRadius: number;
  filled: boolean;
}) {
  const padding = 1.5 * (outerCircleRadius - innerCircleRadius);
  const hx = innerCircleRadius - padding;
  const hy = innerCircleRadius - padding;

  const scaleFactor = 20;
  const shiftLeft = 3.5;
  const shiftUp = 1;

  const points = [
    { x: cx - shiftLeft, y: cy },
    { x: cx - hx * 0.037 * scaleFactor - shiftLeft, y: cy + hy * 0.052 * scaleFactor - shiftUp },
    { x: cx - hx * 0.003 * scaleFactor - shiftLeft, y: cy - hy * 0.05 * scaleFactor - shiftUp },
    { x: cx + hx * 0.027 * scaleFactor - shiftLeft, y: cy + hy * 0.016 * scaleFactor - shiftUp },
    { x: cx + hx * 0.058 * scaleFactor - shiftLeft, y: cy - hy * 0.046 * scaleFactor - shiftUp },
    { x: cx + hx * 0.029 * scaleFactor - shiftLeft, y: cy + hy * 0.066 * scaleFactor - shiftUp },
    { x: cx - shiftLeft, y: cy },
  ];

  return (
    <>
      <polygon
        points={points.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={strokeWidth ?? 1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
      />
    </>
  );
}

export function EscalationEventSymbolSvg({
  stroke,
  strokeWidth,
  isMorphingPanel,
  cx,
  cy,
  innerCircleRadius,
  filled,
}: {
  stroke: string;
  strokeWidth?: number;
  isMorphingPanel?: boolean;
  cx: number;
  cy: number;
  innerCircleRadius: number;
  filled: boolean;
}) {
  const scaleFactor = isMorphingPanel ? 1.8 : 1;
  const scaledArrowHeight = innerCircleRadius * 1.2 * scaleFactor;
  const scaledArrowBaseWidth = innerCircleRadius * scaleFactor;
  const midCenterYOffset = ((innerCircleRadius * 1.2) / 20) * scaleFactor;

  const arrow = [
    { x: cx - scaledArrowBaseWidth / 2, y: cy + scaledArrowHeight / 2 }, // left
    { x: cx, y: cy - scaledArrowHeight / 2 }, // top center
    { x: cx + scaledArrowBaseWidth / 2, y: cy + scaledArrowHeight / 2 }, // right
    { x: cx, y: cy + midCenterYOffset }, // mid center
  ] as const;

  return (
    <>
      <polygon
        points={arrow.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={strokeWidth ?? 1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
      />
    </>
  );
}

export function CancelEventSymbolSvg({
  stroke,
  strokeWidth,
  cx,
  cy,
  innerCircleRadius,
  filled,
}: {
  stroke: string;
  strokeWidth?: number;
  cx: number;
  cy: number;
  innerCircleRadius: number;
  filled: boolean;
}) {
  const farXPoint = 1.3;
  const closeXPoint = 1.7;
  const lowYPoint = 9;
  const highYPoint = 5;

  const cross = [
    { x: cx - innerCircleRadius / farXPoint, y: cy - innerCircleRadius + lowYPoint }, // upper left point 1
    { x: cx - innerCircleRadius / closeXPoint, y: cy - innerCircleRadius + highYPoint }, // upper left point 2
    { x: cx, y: cy - innerCircleRadius / highYPoint }, // upper joiner
    { x: cx + innerCircleRadius / closeXPoint, y: cy - innerCircleRadius + highYPoint }, // upper right point 2
    { x: cx + innerCircleRadius / farXPoint, y: cy - innerCircleRadius + lowYPoint }, // upper right point 1
    { x: cx + innerCircleRadius / highYPoint, y: cy }, // right joiner
    { x: cx + innerCircleRadius / farXPoint, y: cy + innerCircleRadius - lowYPoint }, // lower right point 2
    { x: cx + innerCircleRadius / closeXPoint, y: cy + innerCircleRadius - highYPoint }, // lower right point 1
    { x: cx, y: cy + innerCircleRadius / highYPoint }, // lower joiner
    { x: cx - innerCircleRadius / closeXPoint, y: cy + innerCircleRadius - highYPoint }, // lower left point 1
    { x: cx - innerCircleRadius / farXPoint, y: cy + innerCircleRadius - lowYPoint }, // lower left point 2
    { x: cx - innerCircleRadius / highYPoint, y: cy }, // left joiner
  ] as const;

  return (
    <>
      <polygon
        points={cross.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={strokeWidth ?? 1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
      />
    </>
  );
}

export function CompensationEventSymbolSvg({
  stroke,
  strokeWidth,
  cx,
  cy,
  x,
  y,
  innerCircleRadius,
  outerCircleRadius,
  filled,
}: {
  stroke: string;
  strokeWidth?: number;
  cx: number;
  cy: number;
  x: number;
  y: number;
  innerCircleRadius: number;
  outerCircleRadius: number;
  filled: boolean;
}) {
  const padding = 1.5 * (outerCircleRadius - innerCircleRadius);

  const hx = x + innerCircleRadius - padding * 0.6;
  const hy = y + innerCircleRadius - padding * 0.2;

  const rightOffset = 0.15 * innerCircleRadius;

  const firstTriangle = [
    { x: cx + hx - rightOffset, y: cy - hy + (outerCircleRadius - innerCircleRadius) },
    { x: cx - rightOffset, y: cy },
    { x: cx + hx - rightOffset, y: cy + hy - (outerCircleRadius - innerCircleRadius) },
  ] as const;

  const secondTriangle = [
    { x: cx - rightOffset, y: cy - hy + (outerCircleRadius - innerCircleRadius) },
    { x: cx - hx - rightOffset, y: cy },
    { x: cx - rightOffset, y: cy + hy - (outerCircleRadius - innerCircleRadius) },
  ] as const;

  return (
    <>
      <polygon
        points={firstTriangle.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={strokeWidth ?? 1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
      />
      <polygon
        points={secondTriangle.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={strokeWidth ?? 1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
      />
    </>
  );
}

export function ConditionalEventSymbolSvg({
  stroke,
  strokeWidth,
  isMorphingPanel,
  cx,
  cy,
  outerCircleRadius,
  filled,
}: {
  stroke: string;
  strokeWidth?: number;
  isMorphingPanel?: boolean;
  cx: number;
  cy: number;
  outerCircleRadius: number;
  filled: boolean;
}) {
  const scaleFactor = isMorphingPanel ? 1.8 : 1;

  const squareSize = outerCircleRadius * 1.1 * scaleFactor;
  const halfSquareSize = squareSize / 2;
  const lineSpacing = squareSize / 5;
  const lineBuffer = isMorphingPanel ? 50 : 5;
  const x1 = cx - halfSquareSize + lineBuffer;
  const x2 = cx + halfSquareSize - lineBuffer;

  const squareX = cx - halfSquareSize;
  const squareY = cy - halfSquareSize;

  return (
    <>
      <rect
        x={squareX}
        y={squareY}
        width={squareSize}
        height={squareSize}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
        strokeWidth={strokeWidth ?? 1.5}
      />

      {[...Array(4)].map((_, index) => {
        const lineY = squareY + lineSpacing * (index + 1);
        return (
          <line key={index} x1={x1} y1={lineY} x2={x2} y2={lineY} stroke={stroke} strokeWidth={strokeWidth ?? 2} />
        );
      })}
    </>
  );
}
export function LinkEventSymbolSvg({
  stroke,
  strokeWidth,
  isMorphingPanel,
  cx,
  cy,
  innerCircleRadius,
  filled,
}: {
  stroke: string;
  strokeWidth?: number;
  isMorphingPanel?: boolean;
  cx: number;
  cy: number;
  innerCircleRadius: number;
  filled: boolean;
}) {
  const scaleFactor = isMorphingPanel ? 50 : 1;

  const arrowHeight = innerCircleRadius * 1.2;
  const arrowBaseWidth = innerCircleRadius * 1;
  const shiftLeft = 6;
  const rectangleHeight = 5;
  const arrowPadding = 1;

  const arrow = [
    { x: cx - arrowBaseWidth / 2 - shiftLeft - scaleFactor, y: cy + arrowHeight / 2 - rectangleHeight }, // bottom left rectangle
    { x: cx - arrowBaseWidth / 2 - shiftLeft - scaleFactor, y: cy - arrowHeight / 2 + rectangleHeight }, // top left rectangle
    { x: cx + arrowBaseWidth / 2, y: cy - arrowHeight / 2 + rectangleHeight }, // top right rectangle
    { x: cx + arrowBaseWidth / 2, y: cy - arrowHeight / 2 - arrowPadding - scaleFactor }, // upper arrow start
    { x: cx + arrowBaseWidth / 2 + 7 + scaleFactor, y: cy }, // arrow point
    { x: cx + arrowBaseWidth / 2, y: cy + arrowHeight / 2 + arrowPadding + scaleFactor }, // lower arrow start
    { x: cx + arrowBaseWidth / 2, y: cy + arrowHeight / 2 - rectangleHeight }, // bottom right rectangle
  ] as const;

  return (
    <>
      <polygon
        points={arrow.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={strokeWidth ?? 1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
      />
    </>
  );
}

export function SignalEventSymbolSvg({
  stroke,
  strokeWidth,
  isMorphingPanel,
  cx,
  cy,
  x,
  y,
  innerCircleRadius,
  outerCircleRadius,
  filled,
}: {
  stroke: string;
  strokeWidth?: number;
  isMorphingPanel?: boolean;
  cx: number;
  cy: number;
  x: number;
  y: number;
  innerCircleRadius: number;
  outerCircleRadius: number;
  filled: boolean;
}) {
  const scaleFactor = isMorphingPanel ? 1.2 : 1;

  const padding = 1.5 * (outerCircleRadius - innerCircleRadius);
  const hx = (x + innerCircleRadius - padding) * scaleFactor;
  const hy = (y + innerCircleRadius - padding) * scaleFactor;

  const triangle = [
    { x: cx + cos30 * hx, y: (padding / 4) * scaleFactor + cy + sin30 * hy }, // right
    { x: cx - cos30 * hx, y: (padding / 4) * scaleFactor + cy + sin30 * hy }, // left
    { x: cx, y: (padding / 4) * scaleFactor + cy - hy }, // top
  ] as const;

  return (
    <>
      <polygon
        points={triangle.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={strokeWidth ?? 1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
      />
    </>
  );
}

export function ActivityNodeIcons({
  x,
  y,
  width,
  height,
  icons,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  icons: Set<ActivityNodeMarker>;
}) {
  return (
    <>
      {icons.has(ActivityNodeMarker.Loop) && (
        <text
          fontSize="2em"
          textAnchor={"middle"}
          dominantBaseline={"auto"}
          fontWeight={"bold"}
          transform={`translate(${x + width / 2}, ${y + height - 5}) rotate(0)`}
        >
          ↻
        </text>
      )}
      {icons.has(ActivityNodeMarker.AdHocSubProcess) && (
        <text
          fontSize="2em"
          textAnchor={"middle"}
          dominantBaseline={"auto"}
          fontWeight={"bold"}
          transform={`translate(${x + width / 2}, ${y + height - 5}) rotate(0)`}
        >
          ~
        </text>
      )}
      {icons.has(ActivityNodeMarker.Compensation) && (
        <text
          fontSize="2em"
          textAnchor={"middle"}
          dominantBaseline={"auto"}
          transform={`translate(${x + width / 2}, ${y + height - 5}) rotate(0)`}
        >
          ⏪
        </text>
      )}
      {icons.has(ActivityNodeMarker.Collapsed) && (
        <>
          <rect
            x={x + width / 2 - 15}
            y={y + height - 20 - DEFAULT_NODE_STROKE_WIDTH}
            width={30}
            height={20}
            fill={"transparent"}
            stroke={DEFAULT_NODE_STROKE_COLOR}
            strokeWidth={DEFAULT_NODE_STROKE_WIDTH}
          />
          <text
            fontSize="2em"
            textAnchor={"middle"}
            dominantBaseline={"auto"}
            fontWeight={"bold"}
            x={x + width / 2}
            y={1 + y + height}
          >
            +
          </text>
        </>
      )}
      {icons.has(ActivityNodeMarker.MultiInstanceParallel) && (
        <text
          fontSize="2em"
          textAnchor={"middle"}
          dominantBaseline={"auto"}
          fontWeight={"bold"}
          transform={`translate(${x + width / 2 - 7}, ${y + height - 15}) rotate(90)`}
        >
          ☰
        </text>
      )}
      {icons.has(ActivityNodeMarker.MultiInstanceSequential) && (
        <text
          fontSize="2em"
          textAnchor={"middle"}
          dominantBaseline={"auto"}
          fontWeight={"bold"}
          transform={`translate(${x + width / 2}, ${y + height - 5}) rotate(0)`}
        >
          ☰
        </text>
      )}
    </>
  );
}
