import React from "react";
import { type GraphEdge } from "../../ipc/bindings.generated";
import { GraphSvgEdge } from "./GraphSvgEdge";
import { LANE_COLORS } from "./graphLaneColors";

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
      {lines.map((edge) => (
        <GraphSvgEdge
          key={`${edge.edge_type}:${edge.from_col}:${edge.to_col}`}
          edge={edge}
          colWidth={colWidth}
          rowHeight={rowHeight}
          nodeY={nodeY}
        />
      ))}

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
