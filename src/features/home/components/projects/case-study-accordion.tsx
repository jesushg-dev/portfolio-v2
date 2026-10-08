"use client";

import { useState } from "react";
import { ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { CaseStudyDecision } from "./types";

interface CaseStudyAccordionProps {
  decisions: CaseStudyDecision[];
}

export function CaseStudyAccordion({ decisions }: CaseStudyAccordionProps) {
  const t = useTranslations("main.portfolio.caseStudy");
  const [expandedDecision, setExpandedDecision] = useState(-1);

  return (
    <div className="space-y-3">
      {decisions.map((decision, decisionIndex) => {
        const isOpen = expandedDecision === decisionIndex;
        const panelId = `decision-panel-${decisionIndex}`;

        return (
          <Card
            key={decision.title}
            data-case-study-card
            className="b-card-glow overflow-hidden rounded-3xl"
          >
            <button
              type="button"
              onClick={() => setExpandedDecision(isOpen ? -1 : decisionIndex)}
              className="flex w-full items-start gap-4 p-5 text-left md:p-6"
              aria-expanded={isOpen}
              aria-controls={panelId}
              aria-label={decision.title}
            >
              <span className="bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-2xl font-mono text-sm font-bold">
                {String(decisionIndex + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold tracking-tight">
                  {decision.title}
                </span>
                <span className="text-muted-foreground mt-1 block">
                  {decision.summary}
                </span>
              </span>
              <ArrowDown
                className={cn(
                  "text-muted-foreground mt-1 size-5 shrink-0 transition-transform",
                  isOpen && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>
            <div
              id={panelId}
              role="region"
              aria-label={decision.title}
              data-state={isOpen ? "open" : "closed"}
              className={cn(
                "grid overflow-hidden transition-all duration-300",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <div className="border-border grid gap-6 border-t px-5 py-5 sm:grid-cols-3 sm:pl-18">
                  <div>
                    <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                      {t("why")}
                    </p>
                    <p className="text-muted-foreground mt-2 text-[15px] leading-7">
                      {decision.why}
                    </p>
                  </div>
                  <div>
                    <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                      {t("alternativesConsidered")}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {decision.alternatives.map((alternative) => (
                        <li
                          key={alternative}
                          className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-semibold"
                        >
                          {alternative}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                      {t("tradeoff")}
                    </p>
                    <p className="text-muted-foreground mt-2 text-[15px] leading-7">
                      {decision.trade}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
