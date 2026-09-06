import type { ReactNode } from "react";
import { AppWindow } from "lucide-react";

import { processSectionHeadingId } from "@/features/process-pages/components/process-page-styles";
import { ProcessReveal } from "@/features/process-pages/components/process-reveal";

import type { UsesSoftwareItem } from "../data";
import { usesItemAnchorId } from "../lib/uses-item-anchor";
import { UsesLinkedCard } from "./uses-linked-card";
import { usesContainerClassName, usesSectionClassName } from "./uses-layout";

interface UsesSoftwareSectionProps {
  title: string;
  items: UsesSoftwareItem[];
  clarifications?: ReactNode[];
}

export function UsesSoftwareSection({
  title,
  items,
  clarifications = [],
}: UsesSoftwareSectionProps) {
  return (
    <section
      id="software"
      aria-labelledby={processSectionHeadingId("software")}
      className={usesSectionClassName(true)}
    >
      <div className={usesContainerClassName}>
        <ProcessReveal>
          <h2
            id={processSectionHeadingId("software")}
            className="text-foreground mb-8 flex items-center gap-3.5 text-2xl font-extrabold tracking-tight sm:text-[27px]"
          >
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl text-base">
              <AppWindow aria-hidden className="size-4" />
            </span>
            {title}
          </h2>
        </ProcessReveal>

        <ul className="grid list-none grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {items.map((item, index) => (
            <li
              key={item.id}
              id={usesItemAnchorId(item.id)}
              className="target:ring-primary target:ring-offset-background scroll-mt-24 rounded-lg target:ring-2 target:ring-offset-2"
            >
              <UsesLinkedCard
                href={item.href}
                title={item.title}
                imageSrc={item.image}
                imageAlt={item.title}
                index={index}
                layout="stack"
              />
            </li>
          ))}
        </ul>

        {clarifications.length > 0 ? (
          <div className="mt-10 space-y-3">
            {clarifications.map((note, index) => (
              <ProcessReveal key={index} delay={0.1 + index * 0.04}>
                <div className="border-border bg-card text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs leading-relaxed">
                  {note}
                </div>
              </ProcessReveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
