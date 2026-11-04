import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import type { ProcessHeroAction, ProcessScheduleAction } from "../types";
import {
  processEyebrowStyles,
  processInteractiveStyles,
} from "./process-page-styles";
import { ProcessReveal } from "./process-reveal";

interface ProcessHeroProps {
  eyebrow: string;
  title: string;
  titleHighlight: string;
  description: string;
  primaryAction: ProcessHeroAction;
  secondaryAction: ProcessScheduleAction;
  scrollHint: string;
  visual?: React.ReactNode;
  id?: string;
}

export function ProcessHero({
  eyebrow,
  title,
  titleHighlight,
  description,
  primaryAction,
  secondaryAction,
  visual,
  id = "hero",
}: ProcessHeroProps) {
  return (
    <section
      id={id}
      className="relative overflow-hidden bg-[radial-gradient(ellipse_70%_60%_at_30%_0%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_70%)] pt-28 pb-20 md:pt-36 md:pb-24"
    >
      <div
        className={cn(
          "mx-auto grid w-full items-center gap-12 px-4 sm:px-6 lg:container lg:px-20",
          visual ? "lg:grid-cols-[1.25fr_1fr] lg:gap-16" : "",
        )}
      >
        <ProcessReveal>
          <div>
            <p className={cn(processEyebrowStyles, "mb-4")}>{eyebrow}</p>

            <h1 className="text-foreground text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {title} <span className="text-primary">{titleHighlight}</span>
            </h1>

            <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed sm:text-xl">
              {description}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={primaryAction.href}
                className={cn(
                  processInteractiveStyles,
                  "bg-primary text-primary-foreground hover:brightness-110",
                )}
              >
                {primaryAction.label}
              </a>
              <Link
                href={
                  secondaryAction.href as Parameters<typeof Link>[0]["href"]
                }
                className={cn(
                  processInteractiveStyles,
                  "border-border text-foreground hover:bg-muted/40 border bg-transparent",
                )}
              >
                {secondaryAction.label}
              </Link>
            </div>
          </div>
        </ProcessReveal>

        {visual ? <ProcessReveal delay={0.12}>{visual}</ProcessReveal> : null}
      </div>
    </section>
  );
}
