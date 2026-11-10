import type { ReactNode } from "react";

import { ProcessReveal } from "@/features/process-pages/components/process-reveal";
import { cn } from "@/lib/utils";
import type { ETheme } from "@/utils/constants/theme";
import {
  ShowcaseShell,
  ShowcaseHero,
  ShowcaseSection,
  MetricGrid,
} from "@/components/shared/showcase";

import { COLOPHON_STACK, COLOPHON_WEIGHTS } from "../data";
import { ColophonCarbonBadge } from "./colophon-carbon-badge";
import { ColophonInteractivePalette } from "./colophon-interactive-palette";

export const colophonLinkClassName =
  "text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary";

interface ColophonPageProps {
  labels: {
    eyebrow: string;
    title: string;
    description: string;
    stackTitle: string;
    stackBody: ReactNode;
    stackMarks: Record<(typeof COLOPHON_STACK)[number]["id"], string>;
    typeTitle: string;
    typeBody: string;
    weightLabels: Record<(typeof COLOPHON_WEIGHTS)[number]["id"], string>;
    colorsTitle: string;
    colorsBody: ReactNode;
    paletteLabels: Record<ETheme, string>;
    shadeLabels: string[];
    logoTitle: string;
    logoBody: string;
    logoLightAlt: string;
    logoDarkAlt: string;
    carbonTitle: string;
    carbonBody: ReactNode;
    carbonBadge: {
      co2Label: string;
      brandLabel: string;
      cleanerLabel: string;
    };
    carbonMetrics: {
      firstVisit: string;
      returnVisits: string;
      websiteCarbon: string;
      digitalBeacon: string;
    };
  };
}

export function ColophonPage({ labels }: ColophonPageProps) {
  return (
    <ShowcaseShell>
      {/* Hero */}
      <ShowcaseHero
        eyebrow={labels.eyebrow}
        title={labels.title}
        description={labels.description}
      />

      {/* Tech Stack */}
      <ShowcaseSection>
        <ProcessReveal>
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            {labels.stackTitle}
          </h2>
          <div className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
            {labels.stackBody}
          </div>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {COLOPHON_STACK.map((item) => (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border/80 bg-card/60 text-foreground hover:border-primary/50 hover:text-primary rounded-full border px-5 py-2 text-sm font-medium transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </ProcessReveal>
      </ShowcaseSection>

      {/* Typography */}
      <ShowcaseSection>
        <ProcessReveal>
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            {labels.typeTitle}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
            {labels.typeBody}
          </p>
          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {COLOPHON_WEIGHTS.map((weight) => (
              <div key={weight.id} className="border-border/80 border-t pt-5">
                <span
                  className={cn(
                    "text-foreground block text-4xl leading-none sm:text-5xl lg:text-6xl",
                    weight.className,
                  )}
                >
                  Aa
                </span>
                <small className="text-muted-foreground mt-3 block font-mono text-xs">
                  {labels.weightLabels[weight.id]}
                </small>
              </div>
            ))}
          </div>
        </ProcessReveal>
      </ShowcaseSection>

      {/* Design & Colors */}
      <ShowcaseSection>
        <ProcessReveal>
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            {labels.colorsTitle}
          </h2>
          <div className="text-muted-foreground mt-3 mb-8 max-w-2xl text-base leading-relaxed sm:text-lg">
            {labels.colorsBody}
          </div>

          <ColophonInteractivePalette />
        </ProcessReveal>
      </ShowcaseSection>

      {/* Logo */}
      <ShowcaseSection>
        <ProcessReveal>
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            {labels.logoTitle}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
            {labels.logoBody}
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div
              className="border-border/80 bg-card text-card-foreground flex h-40 items-center justify-center rounded-2xl border sm:h-48"
              aria-label={labels.logoLightAlt}
            >
              <b className="text-foreground text-5xl font-light tracking-tight sm:text-6xl">
                JH
              </b>
            </div>
            <div
              className="border-border/80 bg-muted/60 text-muted-foreground flex h-40 items-center justify-center rounded-2xl border sm:h-48"
              aria-label={labels.logoDarkAlt}
            >
              <b className="text-foreground text-5xl font-light tracking-tight sm:text-6xl">
                JH
              </b>
            </div>
          </div>
        </ProcessReveal>
      </ShowcaseSection>

      {/* Carbon Footprint */}
      <ShowcaseSection>
        <ProcessReveal>
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            {labels.carbonTitle}
          </h2>
          <div className="text-muted-foreground mt-3 mb-10 max-w-2xl text-base leading-relaxed sm:text-lg">
            {labels.carbonBody}
          </div>

          <MetricGrid
            columns={4}
            size="sm"
            items={[
              { label: labels.carbonMetrics.firstVisit, value: "0.234g" },
              { label: labels.carbonMetrics.returnVisits, value: "0.018g" },
              { label: labels.carbonMetrics.websiteCarbon, value: "A+" },
              { label: labels.carbonMetrics.digitalBeacon, value: "B" },
            ]}
          />

          <div className="mt-12">
            <ColophonCarbonBadge
              co2Label={labels.carbonBadge.co2Label}
              brandLabel={labels.carbonBadge.brandLabel}
              cleanerLabel={labels.carbonBadge.cleanerLabel}
            />
          </div>
        </ProcessReveal>
      </ShowcaseSection>
    </ShowcaseShell>
  );
}
