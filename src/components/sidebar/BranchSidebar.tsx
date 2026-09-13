import React, { useState } from "react";
import clsx from "clsx";
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
    <aside className="bg-surface border-r border-border-subtle w-60 shrink-0 h-full flex flex-col overflow-y-auto">
      <div className="px-3 py-2 border-b border-border-subtle">
        <div className="flex items-center gap-1.5 bg-window rounded-sm px-2 py-1 border border-border-subtle">
          <Search size={12} className="text-tertiary shrink-0" />
          <input
            type="text"
            placeholder="Tìm nhánh..."
            aria-label="Tìm nhánh"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-0 outline-none text-xs text-primary w-full"
          />
        </div>
      </div>

      <div className="p-2 flex flex-col gap-3">
        <div>
          <button
            onClick={() => setLocalOpen(!localOpen)}
            aria-expanded={localOpen}
            aria-label="Nhánh cục bộ"
            className="flex items-center gap-1 w-full p-1 bg-transparent border-0 text-secondary hover:text-primary font-semibold text-xs cursor-pointer transition-colors"
          >
            {localOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <GitBranch size={13} />
            <span>NHÁNH CỤC BỘ ({localBranches.length})</span>
          </button>

          {localOpen && (
            <div className="flex flex-col gap-0.5 mt-1">
              {localBranches.map((branch) => {
                const isSelected = selectedBranch === branch.name;
                return (
                  <button
                    key={branch.name}
                    onClick={() => setSelectedBranch(branch.name)}
                    aria-selected={isSelected}
                    className={clsx(
                      "flex items-center gap-1.5 px-2 py-1 rounded-sm border-0 cursor-pointer text-left min-h-[26px] text-xs",
                      isSelected
                        ? "bg-accent-subtle text-accent font-semibold"
                        : "bg-transparent text-primary hover:bg-surface-hover font-normal",
                      branch.is_head && "font-semibold"
                    )}
                  >
                    <span
                      className={clsx(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        branch.is_head
                          ? "bg-accent"
                          : "border border-tertiary bg-transparent"
                      )}
                    />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {branch.name}
                    </span>
                    {branch.is_head && (
                      <span className="text-[10px] text-accent ml-auto">HEAD</span>
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
            aria-expanded={remoteOpen}
            aria-label="Nhánh máy chủ"
            className="flex items-center gap-1 w-full p-1 bg-transparent border-0 text-secondary font-semibold text-xs cursor-pointer"
          >
            {remoteOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <Globe size={13} />
            <span>NHÁNH MÁY CHỦ ({remoteBranches.length})</span>
          </button>

          {remoteOpen && (
            <div className="flex flex-col gap-0.5 mt-1">
              {remoteBranches.map((branch) => (
                <div
                  key={branch.name}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-sm text-secondary text-xs overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  <Globe size={11} className="text-tertiary shrink-0" />
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
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
            aria-expanded={tagsOpen}
            aria-label="Tags"
            className="flex items-center gap-1 w-full p-1 bg-transparent border-0 text-secondary font-semibold text-xs cursor-pointer"
          >
            {tagsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <Tag size={13} />
            <span>TAGS ({tags.length})</span>
          </button>

          {tagsOpen && (
            <div className="flex flex-col gap-0.5 mt-1">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="px-2 py-1 text-xs text-secondary"
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
