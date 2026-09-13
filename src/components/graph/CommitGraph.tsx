import React, { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRepoStore } from "../../store/useRepoStore";
import { invokeCommand } from "../../ipc/client";
import { GraphSvgLane } from "./GraphSvgLane";

const PAGE_SIZE = 50;
const ROW_HEIGHT = 28;

export const CommitGraph: React.FC = () => {
  const { currentRepo, selectedCommitId, setSelectedCommit } = useRepoStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["commit-graph", currentRepo?.path],
    queryFn: ({ pageParam = 0 }) =>
      invokeCommand.getCommitGraph(currentRepo!.path, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.has_more) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    enabled: Boolean(currentRepo),
  });

  const commits = data ? data.pages.flatMap((page) => page.commits) : [];

  const maxCols = useMemo(() => {
    let max = 3;
    for (const c of commits) {
      if (c.col + 2 > max) max = c.col + 2;
      for (const l of c.lines) {
        if (l.from_col + 2 > max) max = l.from_col + 2;
        if (l.to_col + 2 > max) max = l.to_col + 2;
      }
    }
    return max;
  }, [commits]);

  const rowVirtualizer = useVirtualizer({
    count: commits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: "100%",
        width: "100%",
        overflowY: "auto",
        backgroundColor: "var(--bg-surface)",
        position: "relative",
      }}
      onScroll={(e) => {
        const target = e.currentTarget;
        if (
          target.scrollHeight - target.scrollTop - target.clientHeight < 200 &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const commit = commits[virtualRow.index];
          if (!commit) return null;
          const isSelected = selectedCommitId === commit.id;

          return (
            <div
              key={commit.id}
              role="button"
              tabIndex={0}
              aria-selected={isSelected}
              aria-label={`Commit ${commit.short_id}: ${commit.summary}`}
              onClick={() => setSelectedCommit(commit.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedCommit(commit.id);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const nextCommit = commits[virtualRow.index + 1];
                  if (nextCommit) {
                    setSelectedCommit(nextCommit.id);
                  }
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const prevCommit = commits[virtualRow.index - 1];
                  if (prevCommit) {
                    setSelectedCommit(prevCommit.id);
                  }
                }
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "0 var(--space-3)",
                backgroundColor: isSelected ? "var(--accent-subtle)" : "transparent",
                borderBottom: "1px solid var(--border-subtle)",
                cursor: "pointer",
                fontSize: "var(--font-size-xs)",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
              }}
              onFocus={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)";
              }}
              onBlur={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <GraphSvgLane
                col={commit.col}
                colorIndex={commit.color_index}
                lines={commit.lines}
                maxCols={maxCols}
              />

              {commit.refs.map((r, i) => (
                <span
                  key={i}
                  style={{
                    backgroundColor: r.ref_type === "head" ? "var(--accent)" : "var(--border-strong)",
                    color: r.ref_type === "head" ? "var(--accent-contrast)" : "var(--text-primary)",
                    padding: "1px 5px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  {r.name}
                </span>
              ))}

              <span
                style={{
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? "var(--accent)" : "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: 1,
                }}
              >
                {commit.summary}
              </span>

              <span style={{ color: "var(--text-secondary)", fontSize: "11px", whiteSpace: "nowrap" }}>
                {commit.author_name}
              </span>

              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-tertiary)",
                  fontSize: "11px",
                  whiteSpace: "nowrap",
                }}
              >
                {commit.short_id}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
