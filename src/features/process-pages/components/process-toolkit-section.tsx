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
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  footnote: string;
  tools: ProcessTool[];
}

export function ProcessToolkitSection({
  id = "stack",
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
      id={id}
      aria-labelledby={processSectionHeadingId(id)}
      className="border-border/80 border-t px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-4xl text-center">
        <ProcessReveal>
          <ProcessSectionHeader
            sectionId={id}
            eyebrow={eyebrow}
            title={title}
            description={description}
          />

          <div
            role="tablist"
            aria-label={title}
            className="flex flex-wrap justify-center gap-2"
          >
            {tools.map((tool) => {
              const isActive = tool.id === selected?.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedId(tool.id)}
                  className={cn(
                    processInteractiveStyles,
                    "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground border",
                  )}
                >
                  {tool.name}
                </button>
              );
            })}
          </div>

          {selected ? (
            <div
              role="tabpanel"
              aria-live="polite"
              className="mx-auto mt-12 min-h-24 max-w-xl text-center"
            >
              <h3 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
                {selected.name}
              </h3>
              <p className="text-muted-foreground mt-3 text-base leading-relaxed sm:text-lg">
                {selected.description}
              </p>
            </div>
          ) : null}

          <p className="text-muted-foreground mx-auto mt-10 max-w-lg text-center text-sm leading-relaxed">
            {footnote}
          </p>
        </ProcessReveal>
      </div>
    </section>
  );
}
