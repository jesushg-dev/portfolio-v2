import { ArrowRight, ChevronDown } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import type { ProcessHeroAction, ProcessScheduleAction } from "../types";
import {
  processEyebrowStyles,
  processInteractiveStyles,
  processTextLinkStyles,
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
  scrollHint,
  visual,
  id = "hero",
}: ProcessHeroProps) {
  return (
    <section id={id} className="relative overflow-hidden px-6 py-16 md:py-24">
      <div
        className={cn(
          "mx-auto grid max-w-6xl items-center gap-12",
          visual ? "md:grid-cols-2" : "",
        )}
      >
        <ProcessReveal>
          <div>
            <p
              className={cn(
                processEyebrowStyles,
                "mb-6 inline-flex items-center gap-2",
              )}
            >
              <span
                aria-hidden
                className="bg-primary-900 size-1.5 rounded-full"
              />
              {eyebrow}
            </p>

            <h1 className="text-foreground mb-6 text-4xl leading-tight font-extrabold tracking-tight md:text-5xl">
              {title} <span className="text-primary-900">{titleHighlight}</span>
            </h1>

            <p className="text-foreground mb-8 max-w-xl text-lg leading-relaxed">
              {description}
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href={primaryAction.href}
                className={cn(
                  processInteractiveStyles,
                  "bg-primary-900 text-primary-foreground hover:bg-primary-900/90 gap-2",
                )}
              >
                {primaryAction.label}
                <ArrowRight aria-hidden className="size-4" />
              </a>
              <Link
                href={
                  secondaryAction.href as Parameters<typeof Link>[0]["href"]
                }
                className={cn(
                  processInteractiveStyles,
                  "border-border bg-background text-foreground hover:bg-muted border",
                )}
              >
                {secondaryAction.label}
              </Link>
            </div>
          </div>
        </ProcessReveal>

        {visual ? <ProcessReveal delay={0.12}>{visual}</ProcessReveal> : null}
      </div>

      <div className="mt-6 hidden justify-center md:flex">
        <a
          href={primaryAction.href}
          className={cn(
            processTextLinkStyles,
            "text-foreground hover:text-primary-900 min-w-11 rounded-full px-3",
          )}
        >
          <span className="sr-only">{scrollHint}</span>
          <ChevronDown
            aria-hidden
            className="size-6 motion-safe:animate-bounce"
          />
        </a>
      </div>
    </section>
  );
}
