/** Derives the folder name a clone of `url` would get (`…/widget.git` → `widget`). */
export const extractRepoNameFromUrl = (url: string): string => {
  const cleanUrl = url.trim().replace(/\/+$/, "");
  const withoutGit = cleanUrl.endsWith(".git") ? cleanUrl.slice(0, -4) : cleanUrl;
  const parts = withoutGit.split(/[/:]/);
  const lastPart = parts.pop();
  return lastPart ? lastPart.trim() : "";
};
