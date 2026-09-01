"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { BlogHeading } from "@/features/blog/lib/blog-headings";

interface BlogTableOfContentsProps {
  headings: BlogHeading[];
  title: string;
}

export function BlogTableOfContents({
  headings,
  title,
}: BlogTableOfContentsProps) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    const nodes = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.id;
        if (id) setActiveId(id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.25, 1] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [headings]);

  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="border-border/80 bg-card/70 rounded-2xl border p-5 backdrop-blur-sm">
        <p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-[0.16em] uppercase">
          {title}
        </p>
        <nav className="border-border/70 space-y-1 border-l">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={cn(
                "hover:text-foreground -ml-px block border-l-2 py-1.5 text-sm leading-snug transition-colors",
                heading.level >= 3 ? "pl-5" : "pl-3",
                activeId === heading.id
                  ? "border-primary text-foreground font-medium"
                  : "text-muted-foreground border-transparent",
              )}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
