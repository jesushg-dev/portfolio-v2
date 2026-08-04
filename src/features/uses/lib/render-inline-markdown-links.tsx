import type { ReactNode } from "react";

const LINK_SPLIT = /(\[[^\]]+\]\([^)\s]+\))/g;
const LINK_MATCH = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

const linkClassName = "text-primary font-semibold underline underline-offset-2";

/** Renders plain text with optional `[label](url)` markdown links. */
export function renderInlineMarkdownLinks(text: string): ReactNode {
  if (!text.trim()) return null;

  const parts = text.split(LINK_SPLIT);
  return parts.map((part, index) => {
    const match = LINK_MATCH.exec(part);
    if (!match) return part;

    const [, label, href] = match;
    return (
      <a
        key={`${href}-${index}`}
        href={href}
        title={label}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {label}
      </a>
    );
  });
}
