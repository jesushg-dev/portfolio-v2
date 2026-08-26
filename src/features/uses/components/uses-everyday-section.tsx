import { Layers } from "lucide-react";

import { processSectionHeadingId } from "@/features/process-pages/components/process-page-styles";
import { ProcessReveal } from "@/features/process-pages/components/process-reveal";

import type { UsesEverydayItem } from "../data";
import { UsesCoffeeCard } from "./uses-coffee-card";
import { UsesLinkedCard } from "./uses-linked-card";
import { usesContainerClassName, usesSectionClassName } from "./uses-layout";

interface UsesEverydaySectionProps {
  title: string;
  items: UsesEverydayItem[];
  coffee: {
    title: string;
    description: string;
    celebrateLabel: string;
    ariaLabel: string;
  };
}

export function UsesEverydaySection({
  title,
  items,
  coffee,
}: UsesEverydaySectionProps) {
  return (
    <section
      id="everyday"
      aria-labelledby={processSectionHeadingId("everyday")}
      className={usesSectionClassName()}
    >
      <div className={usesContainerClassName}>
        <ProcessReveal>
          <h2
            id={processSectionHeadingId("everyday")}
            className="text-foreground mb-8 flex items-center gap-3.5 text-2xl font-extrabold tracking-tight sm:text-[27px]"
          >
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl text-base">
              <Layers aria-hidden className="size-4" />
            </span>
            {title}
          </h2>
        </ProcessReveal>

        <ul className="grid list-none grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, index) => (
            <li key={item.id}>
              <UsesLinkedCard
                href={item.href}
                title={item.title}
                description={item.description}
                imageSrc={item.image}
                imageAlt={item.title}
                index={index}
                layout="row"
              />
            </li>
          ))}
          <li>
            <UsesCoffeeCard
              title={coffee.title}
              description={coffee.description}
              celebrateLabel={coffee.celebrateLabel}
              ariaLabel={coffee.ariaLabel}
              index={items.length}
            />
          </li>
        </ul>
      </div>
    </section>
  );
}
