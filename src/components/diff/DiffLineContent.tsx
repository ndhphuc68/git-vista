import React from "react";
import { type WordDiffToken } from "../../utils/wordDiff";
import { withOffsetKeys } from "../../shared/utils/listKeys";

interface DiffLineContentProps {
  content: string;
  lineType: string;
  tokens?: WordDiffToken[];
  showWordDiff?: boolean;
}

export const DiffLineContent: React.FC<DiffLineContentProps> = ({
  content,
  tokens,
  showWordDiff = true,
}) => {
  if (!showWordDiff || !tokens || tokens.length === 0) {
    return <span>{content}</span>;
  }

  return (
    <span>
      {withOffsetKeys(tokens).map(({ token, key }) => {
        if (token.type === "removed") {
          return (
            <span
              key={key}
              className="bg-red-500/30 text-diff-remove-text font-semibold rounded-xs px-0.5"
            >
              {token.text}
            </span>
          );
        }
        if (token.type === "added") {
          return (
            <span
              key={key}
              className="bg-emerald-500/30 text-diff-add-text font-semibold rounded-xs px-0.5"
            >
              {token.text}
            </span>
          );
        }
        return <span key={key}>{token.text}</span>;
      })}
    </span>
  );
};
