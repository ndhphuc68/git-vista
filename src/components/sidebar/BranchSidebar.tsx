import React, { useState } from "react";
import { GitBranch, Globe, Tag, ChevronDown, ChevronRight, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRepoStore } from "../../store/useRepoStore";
import { invokeCommand } from "../../ipc/client";

export const BranchSidebar: React.FC = () => {
  const { currentRepo, selectedBranch, setSelectedBranch } = useRepoStore();
  const [search, setSearch] = useState("");
  const [localOpen, setLocalOpen] = useState(true);
  const [remoteOpen, setRemoteOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);

  const { data: branchData } = useQuery({
    queryKey: ["branches", currentRepo?.path],
    queryFn: () => invokeCommand.getBranches(currentRepo!.path),
    enabled: Boolean(currentRepo),
  });

  if (!currentRepo) return null;

  const localBranches = (branchData?.local || []).filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );
  const remoteBranches = (branchData?.remote || []).filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );
  const tags = (branchData?.tags || []).filter((t) =>
    t.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        width: "240px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "var(--space-2) var(--space-3)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "var(--bg-window)",
            borderRadius: "var(--radius-sm)",
            padding: "4px 8px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Search size={12} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Tìm nhánh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "var(--font-size-xs)",
              color: "var(--text-primary)",
              width: "100%",
            }}
          />
        </div>
      </div>

      <div style={{ padding: "var(--space-2)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div>
          <button
            onClick={() => setLocalOpen(!localOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              width: "100%",
              padding: "4px",
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontWeight: 600,
              fontSize: "var(--font-size-xs)",
              cursor: "pointer",
            }}
          >
            {localOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <GitBranch size={13} />
            <span>NHÁNH CỤC BỘ ({localBranches.length})</span>
          </button>

          {localOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
              {localBranches.map((branch) => {
                const isSelected = selectedBranch === branch.name;
                return (
                  <button
                    key={branch.name}
                    onClick={() => setSelectedBranch(branch.name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      backgroundColor: isSelected ? "var(--accent-subtle)" : "transparent",
                      color: isSelected ? "var(--accent)" : "var(--text-primary)",
                      fontWeight: branch.is_head || isSelected ? 600 : 400,
                      fontSize: "var(--font-size-xs)",
                      cursor: "pointer",
                      textAlign: "left",
                      minHeight: "26px",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: branch.is_head ? "var(--accent)" : "transparent",
                        border: branch.is_head ? "none" : "1px solid var(--text-tertiary)",
                      }}
                    />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {branch.name}
                    </span>
                    {branch.is_head && (
                      <span style={{ fontSize: "10px", color: "var(--accent)", marginLeft: "auto" }}>HEAD</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => setRemoteOpen(!remoteOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              width: "100%",
              padding: "4px",
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontWeight: 600,
              fontSize: "var(--font-size-xs)",
              cursor: "pointer",
            }}
          >
            {remoteOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <Globe size={13} />
            <span>NHÁNH MÁY CHỦ ({remoteBranches.length})</span>
          </button>

          {remoteOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
              {remoteBranches.map((branch) => (
                <div
                  key={branch.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-secondary)",
                    fontSize: "var(--font-size-xs)",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {branch.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => setTagsOpen(!tagsOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              width: "100%",
              padding: "4px",
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontWeight: 600,
              fontSize: "var(--font-size-xs)",
              cursor: "pointer",
            }}
          >
            {tagsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <Tag size={13} />
            <span>TAGS ({tags.length})</span>
          </button>

          {tagsOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
              {tags.map((tag) => (
                <div
                  key={tag}
                  style={{
                    padding: "4px 8px",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
