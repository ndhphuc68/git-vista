import React, { useRef, useMemo } from "react";
import clsx from "clsx";
import { GitBranch, Tag } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRepoStore } from "../../store/useRepoStore";
import { useViewStore } from "../../store/useViewStore";
import { useLayoutStore } from "../../store/useLayoutStore";
import { invokeCommand } from "../../ipc/client";
import { GraphSvgLane } from "./GraphSvgLane";

const PAGE_SIZE = 50;
const ROW_HEIGHT = 32;

const BRANCH_PALETTES = [
  {
    bg: "bg-blue-50/95 dark:bg-blue-950/50",
    border: "border-blue-300 dark:border-blue-700/80",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  {
    bg: "bg-purple-50/95 dark:bg-purple-950/50",
    border: "border-purple-300 dark:border-purple-700/80",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  {
    bg: "bg-emerald-50/95 dark:bg-emerald-950/50",
    border: "border-emerald-300 dark:border-emerald-700/80",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  {
    bg: "bg-amber-50/95 dark:bg-amber-950/50",
    border: "border-amber-300 dark:border-amber-700/80",
    text: "text-amber-800 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-rose-50/95 dark:bg-rose-950/50",
    border: "border-rose-300 dark:border-rose-700/80",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  {
    bg: "bg-teal-50/95 dark:bg-teal-950/50",
    border: "border-teal-300 dark:border-teal-700/80",
    text: "text-teal-700 dark:text-teal-300",
    dot: "bg-teal-500",
  },
  {
    bg: "bg-indigo-50/95 dark:bg-indigo-950/50",
    border: "border-indigo-300 dark:border-indigo-700/80",
    text: "text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  {
    bg: "bg-orange-50/95 dark:bg-orange-950/50",
    border: "border-orange-300 dark:border-orange-700/80",
    text: "text-orange-800 dark:text-orange-300",
    dot: "bg-orange-500",
  },
];

function getBranchPillStyle(name: string, isHead: boolean, isTag: boolean) {
  if (isHead) {
    return {
      container: "bg-accent text-accent-contrast border-accent font-bold",
      dot: "bg-white",
      isHead: true,
    };
  }
  if (isTag) {
    return {
      container:
        "bg-amber-100/85 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/80 font-semibold",
      dot: "bg-amber-500",
      isHead: false,
    };
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const palette = BRANCH_PALETTES[Math.abs(hash) % BRANCH_PALETTES.length]!;
  return {
    container: `${palette.bg} ${palette.text} ${palette.border} font-semibold`,
    dot: palette.dot,
    isHead: false,
  };
}

export const CommitGraph: React.FC = () => {
  const { currentRepo, selectedCommitId, setSelectedCommit } = useRepoStore();
  const { setActiveScreen } = useViewStore();
  const { setDetailPanelOpen } = useLayoutStore();
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

  const { data: repoStatus } = useQuery({
    queryKey: ["repo_status", currentRepo?.path],
    queryFn: () => invokeCommand.getRepoStatus(currentRepo!.path),
    enabled: Boolean(currentRepo),
  });

  const hasUncommittedChanges = Boolean(
    repoStatus &&
      (repoStatus.staged.length > 0 ||
        repoStatus.unstaged.length > 0 ||
        repoStatus.untracked.length > 0)
  );

  const modifiedCount =
    (repoStatus?.staged.length || 0) + (repoStatus?.unstaged.length || 0);
  const untrackedCount = repoStatus?.untracked.length || 0;

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

  const handleSelectCommit = (commitId: string) => {
    setSelectedCommit(commitId);
    setDetailPanelOpen(true);
  };

  return (
    <div className="h-full w-full flex flex-col bg-surface overflow-hidden select-none">
      {/* 3-Column Header */}
      <div className="h-8 px-3 flex items-center border-b border-border-subtle bg-window text-[11px] font-mono text-secondary uppercase tracking-wider select-none shrink-0">
        <span className="w-64 shrink-0 pl-2">BRANCH / TAG</span>
        <span className="w-32 shrink-0 pl-2">GRAPH</span>
        <span className="flex-1 pl-2">COMMIT MESSAGE</span>
        <span className="w-36 text-right pr-2">TÁC GIẢ</span>
        <span className="w-24 text-right pr-3">SHA</span>
      </div>

      {/* Main Scrollable Canvas */}
      <div
        ref={parentRef}
        className="flex-1 w-full overflow-y-auto bg-surface relative"
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
        {/* ROW 0: // WIP Row (Working directory changes) */}
        {hasUncommittedChanges && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveScreen("changes")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveScreen("changes");
              }
            }}
            aria-label="Xem thay đổi chưa lưu (Working directory changes)"
            className="flex items-center px-3 h-8 bg-amber-50/50 dark:bg-amber-950/25 hover:bg-amber-100/60 dark:hover:bg-amber-950/45 border-b border-border-subtle cursor-pointer transition-colors group shrink-0"
          >
            <div className="w-64 shrink-0 pr-2 flex items-center justify-end">
              <span className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 px-1.5 py-0.5 rounded">
                // WIP
              </span>
              <span className="w-2.5 h-[1.5px] bg-sky-400 ml-1 shrink-0" />
            </div>

            <div className="w-32 shrink-0 flex items-center">
              <svg width="128" height="32" className="overflow-visible">
                <line
                  x1="16"
                  y1="16"
                  x2="16"
                  y2="32"
                  stroke="#0284C7"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="6"
                  className="fill-surface stroke-[#0284C7]"
                  strokeWidth="2"
                  strokeDasharray="2.5,2.5"
                />
                <circle cx="16" cy="16" r="2.5" fill="#0284C7" />
              </svg>
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-0 pl-2">
              <span className="font-semibold text-primary truncate text-xs group-hover:text-accent transition-colors">
                Thư mục làm việc đang có thay đổi chưa lưu
              </span>
              <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                {modifiedCount > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    ✏️ {modifiedCount} sửa đổi
                  </span>
                )}
                {untrackedCount > 0 && (
                  <span className="text-diff-add-text font-semibold">
                    + {untrackedCount} thêm mới
                  </span>
                )}
              </div>
            </div>

            <div className="w-36 text-right pr-2 shrink-0 text-secondary font-mono text-[11px]">
              <span className="px-1.5 py-0.5 rounded bg-window text-secondary font-medium">
                Vừa xong
              </span>
            </div>
            <div className="w-24 shrink-0"></div>
          </div>
        )}

        {/* Virtualized Commits */}
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
            const isHead = commit.refs.some((r) => r.ref_type === "head");
            const isMerge = commit.lines.some((l) => l.edge_type === "merge");

            return (
              <div
                key={commit.id}
                role="button"
                tabIndex={0}
                aria-selected={isSelected}
                aria-label={`Commit ${commit.short_id}: ${commit.summary}`}
                onClick={() => handleSelectCommit(commit.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectCommit(commit.id);
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const nextCommit = commits[virtualRow.index + 1];
                    if (nextCommit) {
                      handleSelectCommit(nextCommit.id);
                    }
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const prevCommit = commits[virtualRow.index - 1];
                    if (prevCommit) {
                      handleSelectCommit(prevCommit.id);
                    }
                  }
                }}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={clsx(
                  "absolute top-0 left-0 w-full flex items-center px-3 border-b border-border-subtle cursor-pointer text-xs outline-none transition-colors group",
                  isSelected
                    ? "bg-accent-subtle"
                    : "bg-transparent hover:bg-surface-hover focus:bg-surface-hover"
                )}
              >
                {/* Col 1: Branch / Tag Pills */}
                <div className="w-64 shrink-0 pr-2 flex items-center justify-end overflow-visible gap-1.5">
                  {commit.refs.map((r, i) => {
                    const isHeadRef = r.ref_type === "head";
                    const isTagRef = r.ref_type === "tag";
                    const style = getBranchPillStyle(r.name, isHeadRef, isTagRef);

                    return (
                      <div key={i} className="relative group/pill shrink-0 max-w-[210px]">
                        <div
                          title={r.name}
                          className={clsx(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-mono border shadow-2xs cursor-pointer transition-all hover:brightness-95 hover:shadow-xs",
                            style.container
                          )}
                        >
                          {isHeadRef ? (
                            <GitBranch size={10.5} className="shrink-0 text-white" />
                          ) : isTagRef ? (
                            <Tag size={10.5} className="shrink-0 text-amber-700 dark:text-amber-300" />
                          ) : (
                            <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />
                          )}
                          <span className="truncate max-w-[170px]">{r.name}</span>
                          {isHeadRef && (
                            <span className="text-[8.5px] px-1 bg-white/25 rounded font-bold ml-0.5">
                              HEAD
                            </span>
                          )}
                        </div>

                        {/* Hover floating tooltip displaying full branch name */}
                        <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/pill:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-mono rounded-md shadow-xl z-50 pointer-events-none whitespace-nowrap border border-slate-700/60">
                          <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />
                          <span>{r.name}</span>
                        </div>
                      </div>
                    );
                  })}
                  {commit.refs.length > 0 && (
                    <span className="w-2.5 h-[1.5px] bg-border-strong ml-0.5 shrink-0" />
                  )}
                </div>

                {/* Col 2: Multi-lane SVG Tracks */}
                <div className="w-32 shrink-0 flex items-center">
                  <GraphSvgLane
                    col={commit.col}
                    colorIndex={commit.color_index}
                    lines={commit.lines}
                    maxCols={maxCols}
                    isHead={isHead}
                    isMerge={isMerge}
                    rowHeight={ROW_HEIGHT}
                    colWidth={16}
                  />
                </div>

                {/* Col 3: Commit Message */}
                <div className="flex-1 min-w-0 flex items-center gap-2 pl-2">
                  <span
                    className={clsx(
                      "whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-xs",
                      isSelected
                        ? "font-semibold text-accent"
                        : "font-normal text-primary group-hover:text-accent transition-colors"
                    )}
                  >
                    {commit.summary}
                  </span>
                </div>

                {/* Col 4: Author (Bolder and clearer) */}
                <span
                  title={commit.author_name}
                  className="w-36 text-right pr-2 text-primary font-semibold text-xs whitespace-nowrap truncate shrink-0"
                >
                  {commit.author_name}
                </span>

                {/* Col 5: Short SHA (Bolder, clearer font & styled badge) */}
                <div className="w-24 text-right pr-3 shrink-0">
                  <span
                    title={`Mã commit: ${commit.id}`}
                    className="font-mono font-bold text-accent dark:text-accent text-xs px-1.5 py-0.5 rounded bg-surface hover:bg-surface-hover border border-border-subtle shadow-2xs inline-block"
                  >
                    {commit.short_id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
