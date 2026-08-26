import type { ReactNode } from "react";
import { Globe } from "lucide-react";

import { processSectionHeadingId } from "@/features/process-pages/components/process-page-styles";
import { ProcessReveal } from "@/features/process-pages/components/process-reveal";

import { usesContainerClassName, usesSectionClassName } from "./uses-layout";

interface UsesBrowserSectionProps {
  title: string;
  intro?: ReactNode | null;
  extensions: { label: string; href: string }[];
}

export function UsesBrowserSection({
  title,
  intro,
  extensions,
}: UsesBrowserSectionProps) {
  return (
    <section
      id="browser"
      aria-labelledby={processSectionHeadingId("browser")}
      className={usesSectionClassName()}
    >
      <div className={usesContainerClassName}>
        <ProcessReveal>
          <h2
            id={processSectionHeadingId("browser")}
            className="text-foreground mb-8 flex items-center gap-3.5 text-2xl font-extrabold tracking-tight sm:text-[27px]"
          >
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl text-base">
              <Globe aria-hidden className="size-4" />
            </span>
            {title}
          </h2>
        </ProcessReveal>

        {intro ? (
          <ProcessReveal>
            <p className="text-muted-foreground mb-6 max-w-3xl text-base">
              {intro}
            </p>
          </ProcessReveal>
        ) : null}

        <ProcessReveal delay={0.08}>
          <ul className="columns-1 gap-x-10 sm:columns-2 lg:columns-3 xl:columns-4">
            {extensions.map((link) => (
              <li
                key={link.label}
                className="border-border break-inside-avoid border-b py-2.5 text-sm"
              >
                <a
                  href={link.href}
                  title={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary font-semibold transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </ProcessReveal>
      </div>
    </section>
  );
}
