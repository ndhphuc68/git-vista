import React from "react";
import { FolderGit2, GitCommit, Plus, Minus, Info, FileText } from "lucide-react";
import { useTranslation } from "../i18n";
import { Skeleton } from "./Skeleton";

export const Shell: React.FC = () => {
  const { t } = useTranslation();

  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr 280px",
        height: "calc(100vh - 40px - 85px)",
        backgroundColor: "var(--bg-window)",
        overflow: "hidden",
      }}
    >
      {/* 1. SIDEBAR COLUMN */}
      <aside
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRight: "1px solid var(--border-subtle)",
          padding: "var(--space-3)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", textTransform: "uppercase" }}>
          <FolderGit2 size={13} />
          <span>{t.shell.sidebarTitle}</span>
        </div>

        {/* Working changes card */}
        <div
          style={{
            padding: "var(--space-2) var(--space-3)",
            backgroundColor: "var(--bg-window)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{t.screens.changes}</span>
            <span style={{ fontSize: "var(--font-size-xs)", backgroundColor: "var(--accent)", color: "var(--accent-contrast)", padding: "1px 6px", borderRadius: "var(--radius-full)" }}>
              0
            </span>
          </div>
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>Working tree sạch</p>
        </div>

        {/* Branches skeleton list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)", fontWeight: 500 }}>
            {t.shell.localBranches}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--accent-subtle)", color: "var(--accent)", fontWeight: 500, fontSize: "var(--font-size-xs)" }}>
            <span>● main (HEAD)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px", fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>
            <span>○ feature/m0-scaffold</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "auto" }}>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>
            Sẵn sàng tải lịch sử repo ở M1
          </span>
          <Skeleton height={12} width="80%" />
          <Skeleton height={12} width="60%" />
        </div>
      </aside>

      {/* 2. GRAPH / DIFF CENTER COLUMN */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "var(--space-4)",
          gap: "var(--space-4)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <GitCommit size={16} color="var(--accent)" />
            <h2 style={{ fontSize: "var(--font-size-md)", fontWeight: 600 }}>{t.shell.graphTitle}</h2>
          </div>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>
            {t.shell.emptyPlaceholder}
          </span>
        </div>

        {/* Token verification & theme demonstration preview */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-3)",
          }}
        >
          {/* Diff Add Sample Block */}
          <div
            style={{
              padding: "var(--space-3)",
              backgroundColor: "var(--diff-add-bg)",
              color: "var(--diff-add-text)",
              border: "1px solid var(--diff-add-border)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-size-xs)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
              <Plus size={13} />
              <span>Diff Thêm (Design Token: --diff-add-*)</span>
            </div>
            <span>+ feat(m0): scaffold Tauri 2 + React + TS architecture</span>
            <span>+ const designTokens = verified; // Contrast ratio &gt;= 4.5:1</span>
          </div>

          {/* Diff Remove Sample Block */}
          <div
            style={{
              padding: "var(--space-3)",
              backgroundColor: "var(--diff-remove-bg)",
              color: "var(--diff-remove-text)",
              border: "1px solid var(--diff-remove-border)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-size-xs)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
              <Minus size={13} />
              <span>Diff Xoá (Design Token: --diff-remove-*)</span>
            </div>
            <span>- legacy_manual_sync_types();</span>
            <span>- raw_git_cli_calls_in_ui();</span>
          </div>
        </div>

        {/* Skeleton Preview of Virtualized Graph for M1 */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            padding: "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--text-secondary)" }}>
              Khung hình đầu tiên của Graph (Ngân sách &lt; 200ms)
            </span>
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>
              Virtualization 30 hàng trong DOM
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
              <Skeleton width="45%" height={14} />
              <Skeleton width="15%" height={12} style={{ marginLeft: "auto" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--border-strong)" }} />
              <Skeleton width="60%" height={14} />
              <Skeleton width="15%" height={12} style={{ marginLeft: "auto" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--border-strong)" }} />
              <Skeleton width="38%" height={14} />
              <Skeleton width="15%" height={12} style={{ marginLeft: "auto" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--border-strong)" }} />
              <Skeleton width="52%" height={14} />
              <Skeleton width="15%" height={12} style={{ marginLeft: "auto" }} />
            </div>
          </div>
        </div>
      </section>

      {/* 3. DETAIL COLUMN */}
      <aside
        style={{
          backgroundColor: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-subtle)",
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", textTransform: "uppercase" }}>
          <FileText size={13} />
          <span>{t.shell.detailTitle}</span>
        </div>

        <div
          style={{
            padding: "var(--space-3)",
            backgroundColor: "var(--bg-window)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent)" }}>
            <Info size={14} />
            <span style={{ fontWeight: 600, fontSize: "var(--font-size-xs)" }}>Mục tiêu M0 đạt được:</span>
          </div>
          <ul style={{ fontSize: "var(--font-size-xs)", paddingLeft: "16px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "4px" }}>
            <li>Tauri 2 + React 19 + TS</li>
            <li>Design token: Light & Dark</li>
            <li>Độ tương phản đạt WCAG 4.5:1</li>
            <li>i18n: Tiếng Việt + Tiếng Anh</li>
            <li>Simple & Advanced Git mode</li>
            <li>Khung IPC typed hai chiều</li>
            <li>Bộ fixture test Git repo</li>
          </ul>
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>
            Base font: 13px desktop
          </span>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>
            Easing: cubic-bezier(0.32, 0.72, 0, 1)
          </span>
        </div>
      </aside>
    </main>
  );
};

