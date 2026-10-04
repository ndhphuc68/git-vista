const HUNK_HEADER_REGEX = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export type DiffLineType = "hunk" | "add" | "del" | "ctx";

export interface ParsedDiffLine {
  id: string;
  type: DiffLineType;
  sign: string;
  content: string;
  oldLine?: number;
  newLine?: number;
}

export function parsePatch(patch: string): ParsedDiffLine[] {
  if (!patch) return [];
  const rawLines = patch.split(/\r?\n/);
  if (rawLines.length > 0 && rawLines[rawLines.length - 1] === "") {
    rawLines.pop();
  }

  const result: ParsedDiffLine[] = [];
  let currentOldLine = 0;
  let currentNewLine = 0;
  let hunkIndex = 0;
  let lineIndex = 0;

  for (const rawLine of rawLines) {
    lineIndex++;
    if (rawLine.startsWith("@@")) {
      const match = rawLine.match(HUNK_HEADER_REGEX);
      if (match && match[1] && match[2]) {
        currentOldLine = parseInt(match[1], 10);
        currentNewLine = parseInt(match[2], 10);
      }
      hunkIndex++;
      result.push({
        id: `hunk-${hunkIndex}-${lineIndex}`,
        type: "hunk",
        sign: " ",
        content: rawLine,
      });
    } else if (rawLine.startsWith("+")) {
      const newLineNum = currentNewLine;
      currentNewLine++;
      result.push({
        id: `add-${lineIndex}-${newLineNum}`,
        type: "add",
        sign: "+",
        content: rawLine.slice(1),
        newLine: newLineNum,
      });
    } else if (rawLine.startsWith("-")) {
      const oldLineNum = currentOldLine;
      currentOldLine++;
      result.push({
        id: `del-${lineIndex}-${oldLineNum}`,
        type: "del",
        sign: "-",
        content: rawLine.slice(1),
        oldLine: oldLineNum,
      });
    } else if (rawLine.startsWith("\\")) {
      result.push({
        id: `meta-${lineIndex}`,
        type: "ctx",
        sign: " ",
        content: rawLine,
      });
    } else {
      const oldLineNum = currentOldLine;
      const newLineNum = currentNewLine;
      currentOldLine++;
      currentNewLine++;
      const content = rawLine.startsWith(" ") ? rawLine.slice(1) : rawLine;
      result.push({
        id: `ctx-${lineIndex}-${oldLineNum}-${newLineNum}`,
        type: "ctx",
        sign: " ",
        content,
        oldLine: oldLineNum,
        newLine: newLineNum,
      });
    }
  }

  return result;
}
