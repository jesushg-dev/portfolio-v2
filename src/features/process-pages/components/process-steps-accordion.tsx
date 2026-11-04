"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ProcessStep } from "../types";
import {
  processMotionCollapseClass,
  processPanelId,
  processSectionHeadingId,
} from "./process-page-styles";
import { ProcessReveal } from "./process-reveal";
import { ProcessSectionHeader } from "./process-section-header";

interface ProcessStepsAccordionProps {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  steps: ProcessStep[];
  inPracticeLabel: string;
}

export function ProcessStepsAccordion({
  id = "workflow",
  eyebrow,
  title,
  description,
  steps,
  inPracticeLabel,
}: ProcessStepsAccordionProps) {
  const [openIndex, setOpenIndex] = useState(0);
  const baseId = useId();

  return (
    <section
      id={id}
      aria-labelledby={processSectionHeadingId(id)}
      className="border-border/80 border-t py-20 md:py-28"
    >
      <div className="mx-auto w-full px-4 sm:px-6 lg:container lg:px-20">
        <ProcessReveal>
          <ProcessSectionHeader
            sectionId={id}
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
        </ProcessReveal>

        <div className="border-border/80 divide-border/80 mx-auto max-w-3xl divide-y border-t border-b">
          {steps.map((step, index) => {
            const isOpen = openIndex === index;
            const panelId = processPanelId(`${baseId}-${id}`, index);
            const triggerId = `${panelId}-trigger`;

            return (
              <div key={step.number} className="group">
                <button
                  id={triggerId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="focus-visible:ring-ring/35 flex min-h-11 w-full cursor-pointer items-baseline gap-6 py-7 text-left focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="text-primary w-7 shrink-0 pt-1 font-mono text-sm font-semibold">
                    {step.number}
                  </span>
                  <span className="text-foreground flex-1 text-xl font-semibold tracking-tight sm:text-2xl">
                    {step.title}
                  </span>
                  <Plus
                    aria-hidden
                    className={cn(
                      "text-muted-foreground size-5 shrink-0 transition-transform duration-200",
                      isOpen && "rotate-45",
                    )}
                  />
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className={processMotionCollapseClass(isOpen)}
                >
                  <div className="text-muted-foreground overflow-hidden pb-8 pl-13 text-base">
                    <p className="leading-relaxed">{step.description}</p>
                    {step.detail ? (
                      <div className="border-primary text-foreground mt-5 border-l-2 pl-4 text-sm sm:text-base">
                        <small className="text-primary mb-1.5 block text-xs font-semibold tracking-wider uppercase">
                          {inPracticeLabel}
                        </small>
                        <p className="leading-relaxed">{step.detail}</p>
                        {step.tools ? (
                          <div className="text-muted-foreground mt-2 text-xs">
                            Tooling: {step.tools}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
