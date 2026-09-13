import React, { useState, useEffect } from "react";
import { Trash2, X, AlertTriangle, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { invokeCommand } from "../../ipc/client";

export interface DeleteBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  branchName: string;
  onSuccess?: (backupRef: string) => void;
}

export const DeleteBranchModal: React.FC<DeleteBranchModalProps> = ({
  isOpen,
  onClose,
  repoPath,
  branchName,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnmerged, setIsUnmerged] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setError(null);
      setIsUnmerged(false);
    }
  }, [isOpen, branchName]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDelete = async (force: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const backupRef = await invokeCommand.deleteBranch(repoPath, branchName, force);
      if (onSuccess) onSuccess(backupRef);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("UNMERGED_BRANCH")) {
        setIsUnmerged(true);
      } else {
        setError(msg || "Không thể xoá nhánh");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-branch-title"
    >
      <div
        className="bg-surface rounded-lg border border-border-subtle w-full max-w-115 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Trash2 size={16} className="text-diff-remove-text" />
            <h3
              id="delete-branch-title"
              className="text-xs font-semibold text-primary m-0"
            >
              Xoá nhánh
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center bg-transparent border-none cursor-pointer text-secondary hover:text-primary hover:bg-surface-hover p-1 rounded-sm transition-colors"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-primary leading-normal m-0">
            Bạn có chắc chắn muốn xoá nhánh sau đây không?
          </p>

          <div className="px-3 py-2 bg-window rounded-sm border border-border-subtle font-mono text-xs text-primary font-semibold break-all">
            {branchName}
          </div>

          {isUnmerged && (
            <div className="flex items-start gap-2 p-2.5 bg-diff-remove-bg border border-diff-remove-text/30 rounded-sm text-diff-remove-text text-xs leading-normal">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold m-0">Cảnh báo: Nhánh chưa được gộp (Unmerged)</p>
                <p className="m-0 mt-1">
                  Nhánh này chứa các commit chưa được gộp vào nhánh HEAD. Nếu bạn xoá, các commit này sẽ không còn xuất hiện trên nhánh nào nữa.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-2 bg-accent-subtle/40 border border-accent-subtle rounded-sm text-secondary text-[11px] leading-normal">
            <ShieldCheck size={14} className="shrink-0 text-accent mt-0.5" />
            <span>
              An toàn: Hệ thống sẽ tự động tạo một ref sao lưu trong{" "}
              <code className="text-primary font-mono font-semibold">refs/gitui-backup/</code>{" "}
              để bạn có thể khôi phục bất kỳ lúc nào trong 30 ngày.
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-1.5 p-2 bg-diff-remove-bg border border-diff-remove-text/30 rounded-sm text-diff-remove-text text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle bg-surface">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 bg-transparent border border-border-subtle rounded-sm text-xs font-medium text-primary cursor-pointer hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            Huỷ bỏ
          </button>
          <button
            type="button"
            onClick={() => handleDelete(isUnmerged)}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 bg-diff-remove-text text-white border-none rounded-sm text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Đang xoá...</span>
              </>
            ) : isUnmerged ? (
              <span>Vẫn xoá nhánh này</span>
            ) : (
              <span>Xoá nhánh</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
