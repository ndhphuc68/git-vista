import React, { useRef, useMemo } from "react";
import clsx from "clsx";
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
      className="h-full w-full overflow-y-auto bg-surface relative"
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
        }}
        className="w-full relative"
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
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={clsx(
                "absolute top-0 left-0 w-full flex items-center gap-2 px-3 border-b border-border-subtle cursor-pointer text-xs outline-none transition-colors",
                isSelected
                  ? "bg-accent-subtle"
                  : "bg-transparent hover:bg-surface-hover focus:bg-surface-hover"
              )}
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
                  className={clsx(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0",
                    r.ref_type === "head"
                      ? "bg-accent text-accent-contrast"
                      : "bg-border-strong text-primary"
                  )}
                >
                  {r.name}
                </span>
              ))}

              <span
                className={clsx(
                  "whitespace-nowrap overflow-hidden text-ellipsis flex-1",
                  isSelected ? "font-semibold text-accent" : "font-normal text-primary"
                )}
              >
                {commit.summary}
              </span>

              <span className="text-secondary text-[11px] whitespace-nowrap">
                {commit.author_name}
              </span>

              <span className="font-mono text-tertiary text-[11px] whitespace-nowrap">
                {commit.short_id}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
