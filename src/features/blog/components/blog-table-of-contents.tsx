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
    let frame: number | null = null;
    const updateActiveHeading = () => {
      frame = null;
      let active = headings[0]?.id ?? "";
      for (const heading of headings) {
        const node = document.getElementById(heading.id);
        if (
          node &&
          node.getBoundingClientRect().top <= window.innerHeight * 0.25
        ) {
          active = heading.id;
        }
      }
      setActiveId(active);
    };
    const scheduleUpdate = () => {
      if (frame === null) frame = requestAnimationFrame(updateActiveHeading);
    };
    updateActiveHeading();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    document.addEventListener("blog-headings-ready", scheduleUpdate);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      document.removeEventListener("blog-headings-ready", scheduleUpdate);
    };
  }, [headings]);

  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="border-border/80 bg-card/70 rounded-2xl border p-5 backdrop-blur-sm">
        <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-widest uppercase">
          {title}
        </p>
        <nav aria-label={title} className="border-border/70 space-y-1 border-l">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              aria-current={activeId === heading.id ? "location" : undefined}
              className={cn(
                "hover:text-foreground -ml-[0.0625rem] flex min-h-11 items-center border-l-2 py-2 text-sm leading-snug transition-colors",
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
