import { Plus } from "lucide-react";

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
      className="border-border/80 border-t py-20 md:py-28"
    >
      <div className="mx-auto w-full px-4 sm:px-6 lg:container lg:px-20">
        <ProcessReveal>
          <ProcessSectionHeader
            sectionId={id}
            eyebrow={eyebrow}
            title={title}
          />

          <div className="border-border/80 divide-border/80 mx-auto max-w-3xl divide-y border-t border-b">
            {items.map((faq) => (
              <details key={faq.question} className="group">
                <summary
                  className={cn(
                    processTextLinkStyles,
                    "text-foreground flex w-full cursor-pointer list-none items-center justify-between py-6 text-lg font-medium [&::-webkit-details-marker]:hidden",
                  )}
                >
                  <span className="flex-1 pr-4">{faq.question}</span>
                  <Plus
                    aria-hidden
                    className="text-muted-foreground size-5 shrink-0 transition-transform duration-200 group-open:rotate-45"
                  />
                </summary>
                <div className="text-muted-foreground pb-6 text-base leading-relaxed">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </ProcessReveal>
      </div>
    </section>
  );
}
