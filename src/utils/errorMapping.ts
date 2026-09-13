export interface FriendlyError {
  title: string;
  message: string;
  actionHint?: string;
  rawError?: string;
}

export function mapGitError(error: unknown): FriendlyError {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes("authentication failed") || lower.includes("permission denied")) {
    return {
      title: "Lỗi xác thực Git",
      message: "Không thể kết nối hoặc không có quyền truy cập vào máy chủ Git.",
      actionHint: "Vui lòng kiểm tra lại SSH key hoặc Personal Access Token trên tài khoản của bạn.",
      rawError: raw,
    };
  }

  if (
    lower.includes("rejected") ||
    lower.includes("fetch first") ||
    lower.includes("non-fast-forward")
  ) {
    return {
      title: "Nhánh từ xa đã có commit mới",
      message: "Máy chủ từ xa chứa các thay đổi mà bạn chưa có ở máy cục bộ.",
      actionHint: "Hãy thực hiện 'Lấy về (Pull)' các commit mới trước khi Gửi lên (Push).",
      rawError: raw,
    };
  }

  if (
    lower.includes("checkout_conflict") ||
    lower.includes("local changes would be overwritten")
  ) {
    return {
      title: "Xung đột khi chuyển nhánh",
      message: "Bạn đang có các thay đổi chưa lưu có thể bị ghi đè khi đổi nhánh.",
      actionHint: "Hãy Commit các thay đổi hoặc bấm 'Lưu tạm (Stash)' trước khi chuyển nhánh.",
      rawError: raw,
    };
  }

  if (
    lower.includes("could not resolve host") ||
    lower.includes("connection timed out") ||
    lower.includes("network is unreachable")
  ) {
    return {
      title: "Không thể kết nối mạng",
      message: "Không thể liên lạc với máy chủ từ xa.",
      actionHint: "Vui lòng kiểm tra lại kết nối Internet của bạn và thử lại.",
      rawError: raw,
    };
  }

  return {
    title: "Thao tác không thành công",
    message: raw,
    rawError: raw,
  };
}