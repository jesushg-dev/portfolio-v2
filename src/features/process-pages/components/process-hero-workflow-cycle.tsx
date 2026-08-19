"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface WorkflowStep {
  label: string;
}

interface ProcessHeroWorkflowCycleProps {
  title: string;
  steps: WorkflowStep[];
}

export function ProcessHeroWorkflowCycle({
  title,
  steps,
}: ProcessHeroWorkflowCycleProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion || steps.length === 0) return;

    const interval = window.setInterval(() => {
      setCurrent((value) => (value + 1) % steps.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, [steps.length]);

  return (
    <>
      <p className="mb-5 text-sm font-semibold tracking-widest text-slate-400 uppercase">
        {title}
      </p>
      <ol className="space-y-4" aria-label={title}>
        {steps.map((step, index) => {
          const isComplete = index < current;
          const isActive = index === current;

          return (
            <li key={step.label} className="flex items-center gap-3">
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  isComplete && "bg-orange-500/20 text-orange-400",
                  isActive && "bg-orange-500 text-black",
                  !isComplete &&
                    !isActive &&
                    "border border-slate-700 text-slate-400",
                )}
              >
                {isComplete ? (
                  <Check aria-hidden className="size-3.5" strokeWidth={3} />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </span>
              <span
                className={cn(
                  "text-sm",
                  isActive ? "font-medium text-white" : "text-slate-300",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </>
  );
}
