/** Which sidebar row (branch, remote or tag) has its context menu open, if any. */
export type ActiveSidebarMenu = { type: "branch" | "remote" | "tag"; name: string } | null;
