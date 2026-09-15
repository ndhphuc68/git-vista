import React from "react";
import { GraphEdge } from "../../ipc/bindings";

const LANE_COLORS = [
  "#2F6FEB",
  "#8E44AD",
  "#27AE60",
  "#E67E22",
  "#E74C3C",
  "#16A085",
];

const DEFAULT_COL_WIDTH = 16;
const DEFAULT_ROW_HEIGHT = 32;

interface GraphSvgLaneProps {
  col: number;
  colorIndex: number;
  lines: GraphEdge[];
  maxCols?: number;
  isHead?: boolean;
  isMerge?: boolean;
  rowHeight?: number;
  colWidth?: number;
}

export const GraphSvgLane: React.FC<GraphSvgLaneProps> = ({
  col,
  colorIndex,
  lines,
  maxCols,
  isHead = false,
  isMerge = false,
  rowHeight = DEFAULT_ROW_HEIGHT,
  colWidth = DEFAULT_COL_WIDTH,
}) => {
  const nodeX = col * colWidth + colWidth / 2;
  const nodeY = rowHeight / 2;
  const nodeColor = LANE_COLORS[colorIndex % LANE_COLORS.length];
  const laneCols = maxCols ? Math.max(maxCols, col + 1, 3) : Math.max(col + 2, 3);
  const width = laneCols * colWidth;

  return (
    <svg
      className="shrink-0 overflow-visible"
      style={{
        width: `${width}px`,
        height: `${rowHeight}px`,
      }}
    >
      {lines.map((edge, idx) => {
        const x1 = edge.from_col * colWidth + colWidth / 2;
        const x2 = edge.to_col * colWidth + colWidth / 2;
        const strokeColor = LANE_COLORS[edge.color_index % LANE_COLORS.length];

        if (edge.edge_type === "straight") {
          return (
            <line
              key={idx}
              x1={x1}
              y1={0}
              x2={x2}
              y2={rowHeight}
              stroke={strokeColor}
              strokeWidth={2.2}
            />
          );
        }

        if (edge.edge_type === "merge") {
          // Upper parent lane (at y=0) curves into the current node (at nodeY)
          return (
            <path
              key={idx}
              d={`M ${x1} 0 C ${x1} ${nodeY * 0.75}, ${x2} ${nodeY * 0.75}, ${x2} ${nodeY}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={2.2}
            />
          );
        }

        // Fork curve: from current node down to child branch lane
        return (
          <path
            key={idx}
            d={`M ${x1} ${nodeY} C ${x1} ${(nodeY + rowHeight) / 2}, ${x2} ${(nodeY + rowHeight) / 2}, ${x2} ${rowHeight}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2.2}
          />
        );
      })}

      {isHead ? (
        <g>
          <circle cx={nodeX} cy={nodeY} r={8} fill={nodeColor} opacity={0.25} />
          <circle cx={nodeX} cy={nodeY} r={5.5} fill={nodeColor} />
          <circle cx={nodeX} cy={nodeY} r={2.5} className="fill-surface" />
          <circle cx={nodeX} cy={nodeY} r={1.2} fill={nodeColor} />
        </g>
      ) : isMerge ? (
        <g>
          <circle cx={nodeX} cy={nodeY} r={6.5} fill={nodeColor} />
          <circle cx={nodeX} cy={nodeY} r={4} className="fill-surface" />
          <circle cx={nodeX} cy={nodeY} r={2} fill={nodeColor} />
        </g>
      ) : (
        <g>
          <circle cx={nodeX} cy={nodeY} r={4.5} fill={nodeColor} />
          <circle cx={nodeX} cy={nodeY} r={2} className="fill-surface" />
        </g>
      )}
    </svg>
  );
};
