"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export interface BlogCodeBlockProps {
  node: ReactNodeViewProps["node"];
}

export function BlogCodeBlock({ node }: BlogCodeBlockProps) {
  const t = useTranslations("main.blog");
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const rawLanguage = (node?.attrs?.language as string | undefined)?.trim();
  const displayLanguage =
    rawLanguage && rawLanguage.length > 0 ? rawLanguage : "code";

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    const textToCopy = node?.textContent ?? "";
    if (!textToCopy) return;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy code to clipboard", err);
    }
  }, [node?.textContent]);

  const onCopyClick = useCallback(() => {
    void handleCopy();
  }, [handleCopy]);

  const copyLabel = t("copyCode");
  const copiedLabel = t("copiedCode");
  const copyAriaLabel = t("copyCodeAria");

  return (
    <NodeViewWrapper
      as="div"
      className="blog-code-block group not-prose border-border bg-card/80 my-6 overflow-hidden rounded-xl border shadow-xs"
    >
      <div className="border-border/70 bg-muted/40 text-muted-foreground flex h-9.5 items-center justify-between border-b px-3.5 py-1.5 text-xs select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="bg-border size-2 rounded-full" />
            <span className="bg-border size-2 rounded-full" />
            <span className="bg-border size-2 rounded-full" />
          </div>
          <span className="text-muted-foreground font-mono text-xs font-semibold tracking-wider uppercase">
            {displayLanguage}
          </span>
        </div>

        <button
          type="button"
          onClick={onCopyClick}
          aria-label={copied ? copiedLabel : copyAriaLabel}
          className={cn(
            "focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all select-none focus-visible:ring-1 focus-visible:outline-none",
            copied
              ? "border-primary/40 bg-primary/10 text-primary border"
              : "border-border/60 bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground border hover:shadow-2xs",
          )}
        >
          {copied ? (
            <>
              <Check className="text-primary size-3.5 stroke-[2.5]" />
              <span>{copiedLabel}</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>{copyLabel}</span>
            </>
          )}
        </button>
      </div>

      <pre className="overflow-x-auto p-4 font-mono text-[0.875rem] leading-relaxed">
        <NodeViewContent<"code">
          as="code"
          className={rawLanguage ? `language-${rawLanguage}` : undefined}
        />
      </pre>
    </NodeViewWrapper>
  );
}
