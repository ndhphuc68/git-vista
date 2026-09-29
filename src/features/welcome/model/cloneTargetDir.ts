import { extractRepoNameFromUrl } from "../../../components/welcome/repoUrl";

/**
 * Computes the target directory `CloneModal` should show after the user
 * edits the repository URL: derived from `baseDir` plus the repo name when a
 * folder was already picked, or derived from the URL alone otherwise (unless
 * the user has already typed something unrelated into the target directory).
 */
export function resolveTargetDirOnUrlChange(
  newUrl: string,
  baseDir: string,
  currentTargetDir: string
): string {
  const repoName = extractRepoNameFromUrl(newUrl);
  if (!repoName) return currentTargetDir;

  if (baseDir) {
    const separator = baseDir.includes("\\") ? "\\" : "/";
    return `${baseDir}${separator}${repoName}`;
  }

  if (
    !currentTargetDir ||
    currentTargetDir.endsWith(repoName) ||
    (!currentTargetDir.includes("/") && !currentTargetDir.includes("\\"))
  ) {
    return repoName;
  }

  return currentTargetDir;
}

/** Computes the target directory after the user picks a base folder. */
export function resolveTargetDirOnFolderSelect(selectedDir: string, url: string): string {
  const repoName = extractRepoNameFromUrl(url);
  const separator = selectedDir.includes("\\") ? "\\" : "/";
  return repoName ? `${selectedDir}${separator}${repoName}` : selectedDir;
}
