import React from "react";
import { type GraphEdge } from "../../ipc/bindings.generated";
import { LANE_COLORS } from "./graphLaneColors";

interface GraphSvgEdgeProps {
  edge: GraphEdge;
  colWidth: number;
  rowHeight: number;
  nodeY: number;
}

/** One connecting line/curve between adjacent rows in a commit graph lane. */
export const GraphSvgEdge: React.FC<GraphSvgEdgeProps> = ({ edge, colWidth, rowHeight, nodeY }) => {
  const x1 = edge.from_col * colWidth + colWidth / 2;
  const x2 = edge.to_col * colWidth + colWidth / 2;
  const strokeColor = LANE_COLORS[edge.color_index % LANE_COLORS.length];

  if (edge.edge_type === "straight") {
    return <line x1={x1} y1={0} x2={x2} y2={rowHeight} stroke={strokeColor} strokeWidth={2.2} />;
  }

  if (edge.edge_type === "incoming") {
    return <line x1={x1} y1={0} x2={x2} y2={nodeY} stroke={strokeColor} strokeWidth={2.2} />;
  }

  if (edge.edge_type === "merge") {
    // Upper parent lane (at y=0) curves into the current node (at nodeY)
    return (
      <path
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
      d={`M ${x1} ${nodeY} C ${x1} ${(nodeY + rowHeight) / 2}, ${x2} ${(nodeY + rowHeight) / 2}, ${x2} ${rowHeight}`}
      fill="none"
      stroke={strokeColor}
      strokeWidth={2.2}
    />
  );
};
