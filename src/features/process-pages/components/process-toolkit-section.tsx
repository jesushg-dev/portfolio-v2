"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import type { ProcessTool } from "../types";
import {
  processInteractiveStyles,
  processSectionHeadingId,
} from "./process-page-styles";
import { ProcessReveal } from "./process-reveal";
import { ProcessSectionHeader } from "./process-section-header";

interface ProcessToolkitSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  footnote: string;
  tools: ProcessTool[];
}

export function ProcessToolkitSection({
  eyebrow,
  title,
  description,
  footnote,
  tools,
}: ProcessToolkitSectionProps) {
  const [selectedId, setSelectedId] = useState(tools[0]?.id ?? "");
  const selected =
    tools.find((tool) => tool.id === selectedId) ?? tools[0] ?? null;

  return (
    <section
      id="stack"
      aria-labelledby={processSectionHeadingId("stack")}
      className="bg-muted/50 px-6 py-20"
    >
      <div className="mx-auto max-w-4xl px-0 text-center">
        <ProcessReveal>
          <ProcessSectionHeader
            sectionId="stack"
            eyebrow={eyebrow}
            title={title}
            description={description}
          />

          <div
            role="radiogroup"
            aria-label={title}
            className="flex flex-wrap justify-center gap-3"
          >
            {tools.map((tool) => {
              const isActive = tool.id === selected?.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setSelectedId(tool.id)}
                  className={cn(
                    processInteractiveStyles,
                    "gap-2 rounded-full border py-2 pr-4 pl-2",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-[10px] font-bold",
                      isActive
                        ? "bg-primary-foreground/25 text-primary-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {tool.initials}
                  </span>
                  {tool.name}
                </button>
              );
            })}
          </div>

          {selected ? (
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="border-border bg-card mt-8 rounded-2xl border p-6 text-left shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span
                  aria-hidden
                  className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                >
                  {selected.initials}
                </span>
                <div>
                  <p className="text-foreground mb-1 font-semibold">
                    {selected.name}
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {selected.description}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <p className="text-muted-foreground mt-6 text-sm">{footnote}</p>
        </ProcessReveal>
      </div>
    </section>
  );
}
