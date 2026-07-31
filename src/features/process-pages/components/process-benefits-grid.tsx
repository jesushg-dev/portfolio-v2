import type { ProcessBenefit } from "../types";
import { ProcessReveal, ProcessRevealItem } from "./process-reveal";
import { ProcessSectionHeader } from "./process-section-header";
import { processSectionHeadingId } from "./process-page-styles";

interface ProcessBenefitsGridProps {
  eyebrow: string;
  title: string;
  items: ProcessBenefit[];
}

export function ProcessBenefitsGrid({
  eyebrow,
  title,
  items,
}: ProcessBenefitsGridProps) {
  return (
    <section
      id="why"
      aria-labelledby={processSectionHeadingId("why")}
      className="bg-muted/50 px-6 py-20"
    >
      <div className="mx-auto max-w-6xl">
        <ProcessReveal>
          <ProcessSectionHeader
            sectionId="why"
            eyebrow={eyebrow}
            title={title}
          />
        </ProcessReveal>

        <ul className="grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <ProcessRevealItem
                key={item.title}
                index={index}
                className="bg-card ring-border/60 rounded-2xl p-6 shadow-sm ring-1"
              >
                <div className="bg-primary/10 text-primary mb-4 flex size-11 items-center justify-center rounded-xl">
                  <Icon aria-hidden className="size-5" />
                </div>
                <h3 className="text-foreground mb-2 text-lg font-bold">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </ProcessRevealItem>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
