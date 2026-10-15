/**
 * Replicates the hl() function from the HTML reference (improve.html):
 *   - model | enum | type  → text-sky-300
 *   - @decorator(...)      → text-amber-300
 *   - // comment           → text-slate-500
 */

interface Token {
  kind: "keyword" | "decorator" | "comment" | "plain";
  text: string;
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];

  // If the line contains a comment, split at the first //
  const commentIdx = line.indexOf("//");
  const codePart = commentIdx === -1 ? line : line.slice(0, commentIdx);
  const commentPart = commentIdx === -1 ? "" : line.slice(commentIdx);

  // Tokenize the code part by finding keywords and decorators
  const codePattern = /(@[\w.]+(?:\([^)]*\))?)|(\b(?:model|enum|type)\b)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codePattern.exec(codePart)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        kind: "plain",
        text: codePart.slice(lastIndex, match.index),
      });
    }
    if (match[1]) {
      tokens.push({ kind: "decorator", text: match[1] });
    } else if (match[2]) {
      tokens.push({ kind: "keyword", text: match[2] });
    }
    lastIndex = codePattern.lastIndex;
  }

  if (lastIndex < codePart.length) {
    tokens.push({ kind: "plain", text: codePart.slice(lastIndex) });
  }

  if (commentPart) {
    tokens.push({ kind: "comment", text: commentPart });
  }

  return tokens;
}

export function PrismaCodeBlock({ code }: { code: string }) {
  const lines = code.split("\n");

  return (
    <>
      {lines.map((line, lineIdx) => {
        const tokens = tokenizeLine(line);
        return (
          <span key={lineIdx}>
            {tokens.map((token, tokenIdx) => {
              switch (token.kind) {
                case "keyword":
                  return (
                    <b key={tokenIdx} className="font-normal text-sky-300">
                      {token.text}
                    </b>
                  );
                case "decorator":
                  return (
                    <span key={tokenIdx} className="text-amber-300">
                      {token.text}
                    </span>
                  );
                case "comment":
                  return (
                    <i key={tokenIdx} className="text-slate-500 not-italic">
                      {token.text}
                    </i>
                  );
                default:
                  return token.text;
              }
            })}
            {lineIdx < lines.length - 1 ? "\n" : ""}
          </span>
        );
      })}
    </>
  );
}
