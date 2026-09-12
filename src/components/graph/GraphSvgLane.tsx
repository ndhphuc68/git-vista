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

const COL_WIDTH = 14;
const ROW_HEIGHT = 28;

interface GraphSvgLaneProps {
  col: number;
  colorIndex: number;
  lines: GraphEdge[];
}

export const GraphSvgLane: React.FC<GraphSvgLaneProps> = ({ col, colorIndex, lines }) => {
  const nodeX = col * COL_WIDTH + COL_WIDTH / 2;
  const nodeY = ROW_HEIGHT / 2;
  const nodeColor = LANE_COLORS[colorIndex % LANE_COLORS.length];

  return (
    <svg
      style={{
        width: `${Math.max(col + 2, 3) * COL_WIDTH}px`,
        height: `${ROW_HEIGHT}px`,
        flexShrink: 0,
        overflow: "visible",
      }}
    >
      {lines.map((edge, idx) => {
        const x1 = edge.from_col * COL_WIDTH + COL_WIDTH / 2;
        const x2 = edge.to_col * COL_WIDTH + COL_WIDTH / 2;
        const strokeColor = LANE_COLORS[edge.color_index % LANE_COLORS.length];

        if (edge.edge_type === "straight") {
          return (
            <line
              key={idx}
              x1={x1}
              y1={0}
              x2={x2}
              y2={ROW_HEIGHT}
              stroke={strokeColor}
              strokeWidth={2}
            />
          );
        }

        return (
          <path
            key={idx}
            d={`M ${x1} ${nodeY} C ${x1} ${ROW_HEIGHT}, ${x2} 0, ${x2} ${ROW_HEIGHT}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
          />
        );
      })}

      <circle cx={nodeX} cy={nodeY} r={4.5} fill={nodeColor} />
      <circle cx={nodeX} cy={nodeY} r={2} fill="var(--bg-surface)" />
    </svg>
  );
};
