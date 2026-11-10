import type { ProcessBenefit } from "../types";
import { ProcessReveal, ProcessRevealItem } from "./process-reveal";
import { ProcessSectionHeader } from "./process-section-header";
import { processSectionHeadingId } from "./process-page-styles";

interface ProcessBenefitsGridProps {
  id?: string;
  eyebrow: string;
  title: string;
  items: ProcessBenefit[];
}

export function ProcessBenefitsGrid({
  id = "why",
  eyebrow,
  title,
  items,
}: ProcessBenefitsGridProps) {
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
        </ProcessReveal>

        <ul className="grid list-none grid-cols-1 gap-x-12 gap-y-14 md:grid-cols-3">
          {items.map((item, index) => (
            <ProcessRevealItem
              key={item.title}
              index={index}
              className="border-border/80 border-t pt-5"
            >
              <h3 className="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
                {item.title}
              </h3>
              <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed sm:text-base">
                {item.description}
              </p>
            </ProcessRevealItem>
          ))}
        </ul>
      </div>
    </section>
  );
}
