import { useTranslation } from "../../../i18n";

export function CommitGraphHeader() {
  const { t } = useTranslation();
  return (
    <div className="h-8 px-3 flex items-center border-b border-border-subtle bg-window text-[11px] font-mono text-secondary uppercase tracking-wider select-none shrink-0">
      <span className="w-80 shrink-0 pl-2">{t.graph.columns.branchTag}</span>
      <span className="w-32 shrink-0 pl-2">{t.graph.columns.graph}</span>
      <span className="flex-1 pl-2">{t.graph.columns.commitMessage}</span>
      <span className="w-36 text-right pr-2">{t.graph.columns.author}</span>
      <span className="w-24 text-right pr-3">{t.graph.columns.sha}</span>
    </div>
  );
}
