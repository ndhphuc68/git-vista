import { SHORT_SHA_LENGTH } from "../../domain/constants/ui";

/** Rút gọn commit SHA để hiển thị, ví dụ "a1b2c3d4e5..." thành "a1b2c3d". */
export function shortSha(sha: string): string {
  return sha.slice(0, SHORT_SHA_LENGTH);
}
