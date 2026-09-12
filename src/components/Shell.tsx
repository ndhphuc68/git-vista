import React from "react";
import { BranchSidebar } from "./sidebar/BranchSidebar";
import { CommitGraph } from "./graph/CommitGraph";
import { CommitDetailPanel } from "./diff/CommitDetailPanel";

export const Shell: React.FC = () => {
  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr 380px",
        flex: 1,
        minHeight: 0,
        backgroundColor: "var(--bg-window)",
        overflow: "hidden",
      }}
    >
      <BranchSidebar />
      <CommitGraph />
      <CommitDetailPanel />
    </main>
  );
};
