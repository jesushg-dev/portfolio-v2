import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ProcessFaqItem } from "../types";
import {
  processSectionHeadingId,
  processTextLinkStyles,
} from "./process-page-styles";
import { ProcessReveal } from "./process-reveal";
import { ProcessSectionHeader } from "./process-section-header";

interface ProcessFaqSectionProps {
  id?: string;
  eyebrow: string;
  title: string;
  items: ProcessFaqItem[];
}

export function ProcessFaqSection({
  id = "faq",
  eyebrow,
  title,
  items,
}: ProcessFaqSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={processSectionHeadingId(id)}
      className="px-6 py-20"
    >
      <div className="mx-auto max-w-3xl">
        <ProcessReveal>
          <ProcessSectionHeader
            sectionId={id}
            eyebrow={eyebrow}
            title={title}
          />

          <div className="border-border divide-border divide-y border-t border-b">
            {items.map((faq) => (
              <details key={faq.question} className="group py-2">
                <summary
                  className={cn(
                    processTextLinkStyles,
                    "text-foreground w-full justify-between rounded-lg px-1 py-3 font-semibold [&::-webkit-details-marker]:hidden",
                  )}
                >
                  {faq.question}
                  <ChevronDown
                    aria-hidden
                    className="text-muted-foreground ml-4 size-4 shrink-0 group-open:rotate-180 motion-safe:transition-transform"
                  />
                </summary>
                <p className="text-muted-foreground px-1 pb-3 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </ProcessReveal>
      </div>
    </section>
  );
}
