import { type DiffLine } from "../ipc/bindings";

export type WordDiffType = "equal" | "removed" | "added";

export interface WordDiffToken {
  text: string;
  type: WordDiffType;
}

export interface WordDiffResult {
  oldTokens: WordDiffToken[];
  newTokens: WordDiffToken[];
}

export function tokenize(text: string): string[] {
  if (!text) return [];
  const regex = /([\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s])/gu;
  const matches = text.match(regex);
  return matches ?? [text];
}

export function computeWordDiff(oldText: string, newText: string): WordDiffResult {
  const tOld = tokenize(oldText);
  const tNew = tokenize(newText);

  const m = tOld.length;
  const n = tNew.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (tOld[i - 1] === tNew[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  const revOld: WordDiffToken[] = [];
  const revNew: WordDiffToken[] = [];

  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tOld[i - 1] === tNew[j - 1]) {
      revOld.push({ text: tOld[i - 1]!, type: "equal" });
      revNew.push({ text: tNew[j - 1]!, type: "equal" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      revNew.push({ text: tNew[j - 1]!, type: "added" });
      j--;
    } else if (i > 0 && (j === 0 || dp[i]![j - 1]! < dp[i - 1]![j]!)) {
      revOld.push({ text: tOld[i - 1]!, type: "removed" });
      i--;
    }
  }

  return {
    oldTokens: revOld.reverse(),
    newTokens: revNew.reverse(),
  };
}

export function pairHunkLines(lines: DiffLine[]): Map<number, WordDiffToken[]> {
  const tokenMap = new Map<number, WordDiffToken[]>();

  let idx = 0;
  while (idx < lines.length) {
    if (lines[idx]?.line_type === "delete") {
      const delIndices: number[] = [];
      while (idx < lines.length && lines[idx]?.line_type === "delete") {
        delIndices.push(idx);
        idx++;
      }

      const addIndices: number[] = [];
      while (idx < lines.length && lines[idx]?.line_type === "add") {
        addIndices.push(idx);
        idx++;
      }

      const pairCount = Math.min(delIndices.length, addIndices.length);
      for (let p = 0; p < pairCount; p++) {
        const delIdx = delIndices[p]!;
        const addIdx = addIndices[p]!;
        const delContent = lines[delIdx]!.content;
        const addContent = lines[addIdx]!.content;

        const { oldTokens, newTokens } = computeWordDiff(delContent, addContent);
        tokenMap.set(delIdx, oldTokens);
        tokenMap.set(addIdx, newTokens);
      }
    } else {
      idx++;
    }
  }

  return tokenMap;
}
