"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ProcessStep } from "../types";
import {
  processEyebrowStyles,
  processMotionCollapseClass,
  processPanelId,
  processSectionHeadingId,
} from "./process-page-styles";
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
      className="px-6 py-20"
    >
      <div className="mx-auto max-w-3xl">
        <ProcessSectionHeader
          sectionId={id}
          eyebrow={eyebrow}
          title={title}
          description={description}
        />

        <div className="space-y-0">
          {steps.map((step, index) => {
            const isOpen = openIndex === index;
            const isLast = index === steps.length - 1;
            const panelId = processPanelId(`${baseId}-${id}`, index);
            const triggerId = `${panelId}-trigger`;

            return (
              <div key={step.number} className={cn(!isLast && "pb-10")}>
                <div className="flex gap-6">
                  <div aria-hidden className="flex flex-col items-center">
                    <span className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                      {step.number}
                    </span>
                    {!isLast ? (
                      <span className="bg-border my-2 w-px flex-1" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-foreground text-lg font-semibold">
                      <button
                        id={triggerId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={step.detail ? panelId : undefined}
                        onClick={() => setOpenIndex(isOpen ? -1 : index)}
                        className="group focus-visible:ring-ring/35 flex min-h-11 w-full cursor-pointer items-start justify-between gap-4 rounded-lg py-2 text-left focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <span className="min-w-0">
                          <span className="mb-1.5 block">{step.title}</span>
                          <span className="text-muted-foreground block text-sm leading-relaxed font-normal">
                            {step.description}
                          </span>
                        </span>
                        {step.detail ? (
                          <ChevronDown
                            aria-hidden
                            className={cn(
                              "text-muted-foreground mt-1 size-5 shrink-0 motion-safe:transition-transform",
                              isOpen && "rotate-180",
                            )}
                          />
                        ) : null}
                      </button>
                    </h3>

                    {step.detail ? (
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={triggerId}
                        className={processMotionCollapseClass(isOpen)}
                      >
                        <div className="overflow-hidden">
                          <div className="border-border bg-muted/40 mt-4 rounded-xl border p-4">
                            <p className={cn(processEyebrowStyles, "mb-1.5")}>
                              {inPracticeLabel}
                            </p>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {step.detail}
                            </p>
                            {step.tools ? (
                              <p className="text-muted-foreground mt-3 text-sm">
                                {step.tools}
                              </p>
                            ) : null}
                          </div>
                        </div>
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
