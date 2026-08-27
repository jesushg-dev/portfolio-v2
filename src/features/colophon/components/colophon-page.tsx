import type { ReactNode } from "react";

import { processEyebrowStyles } from "@/features/process-pages/components/process-page-styles";
import { ProcessReveal } from "@/features/process-pages/components/process-reveal";
import { cn } from "@/lib/utils";
import type { ETheme } from "@/utils/constants/theme";

import { COLOPHON_PALETTES, COLOPHON_STACK, COLOPHON_WEIGHTS } from "../data";
import { ColophonCarbonBadge } from "./colophon-carbon-badge";
import {
  colophonContainerClassName,
  colophonSectionClassName,
} from "./colophon-layout";
import { ColophonPaletteRow } from "./colophon-palette-row";

export const colophonLinkClassName =
  "text-foreground underline decoration-border underline-offset-2 transition-colors hover:text-primary";

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
  };
}

export function ColophonPage({ labels }: ColophonPageProps) {
  return (
    <div className={cn(colophonContainerClassName, "py-8 sm:py-12")}>
      <ProcessReveal>
        <header className={colophonSectionClassName(true)}>
          <p className={cn(processEyebrowStyles, "mb-3")}>{labels.eyebrow}</p>
          <h1 className="text-foreground mb-4 text-[clamp(2rem,5vw,3.125rem)] leading-[1.15] font-extrabold tracking-tight">
            {labels.title}
          </h1>
          <p className="text-muted-foreground max-w-3xl text-lg leading-relaxed">
            {labels.description}
          </p>
        </header>
      </ProcessReveal>

      <ProcessReveal>
        <section
          aria-labelledby="colophon-stack-heading"
          className={colophonSectionClassName()}
        >
          <h2
            id="colophon-stack-heading"
            className="text-foreground mb-4 text-2xl font-bold tracking-tight"
          >
            {labels.stackTitle}
          </h2>
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            {labels.stackBody}
          </p>
          <div className="text-muted-foreground mt-10 flex flex-wrap items-center gap-x-10 gap-y-4 sm:gap-x-14">
            {COLOPHON_STACK.map((item) => (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary text-2xl font-bold tracking-tight transition-colors sm:text-3xl"
              >
                {labels.stackMarks[item.id]}
              </a>
            ))}
          </div>
        </section>
      </ProcessReveal>

      <ProcessReveal>
        <section
          aria-labelledby="colophon-type-heading"
          className={colophonSectionClassName()}
        >
          <h2
            id="colophon-type-heading"
            className="text-foreground mb-4 text-2xl font-bold tracking-tight"
          >
            {labels.typeTitle}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-3xl leading-relaxed">
            {labels.typeBody}
          </p>
          <div className="border-border grid grid-cols-2 divide-x divide-dashed overflow-hidden rounded-lg border border-dashed sm:grid-cols-4">
            {COLOPHON_WEIGHTS.map((weight, index) => (
              <div
                key={weight.id}
                className={cn(
                  "border-border py-8 text-center sm:py-10",
                  index >= 2 && "border-t border-dashed sm:border-t-0",
                )}
              >
                <p
                  className={cn(
                    "text-foreground text-lg sm:text-xl",
                    weight.className,
                  )}
                >
                  {labels.weightLabels[weight.id]}
                </p>
              </div>
            ))}
          </div>
        </section>
      </ProcessReveal>

      <ProcessReveal>
        <section
          aria-labelledby="colophon-colors-heading"
          className={colophonSectionClassName()}
        >
          <h2
            id="colophon-colors-heading"
            className="text-foreground mb-4 text-2xl font-bold tracking-tight"
          >
            {labels.colorsTitle}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-3xl leading-relaxed">
            {labels.colorsBody}
          </p>

          <div className="border-border divide-border divide-y overflow-hidden rounded-lg border">
            <div className="px-4 pt-3 pb-1.5 sm:px-5">
              <div className="flex">
                {labels.shadeLabels.map((shade) => (
                  <div
                    key={shade}
                    className="text-muted-foreground flex-1 text-center text-[10px] sm:text-xs"
                  >
                    {shade}
                  </div>
                ))}
              </div>
            </div>

            {COLOPHON_PALETTES.map((palette) => (
              <ColophonPaletteRow
                key={palette.id}
                themeId={palette.id}
                label={labels.paletteLabels[palette.id]}
                swatches={palette.swatches}
              />
            ))}
          </div>
        </section>
      </ProcessReveal>

      <ProcessReveal>
        <section
          aria-labelledby="colophon-logo-heading"
          className={colophonSectionClassName()}
        >
          <h2
            id="colophon-logo-heading"
            className="text-foreground mb-4 text-2xl font-bold tracking-tight"
          >
            {labels.logoTitle}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-3xl leading-relaxed">
            {labels.logoBody}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className="border-border bg-background-50 flex h-40 items-center justify-center rounded-lg border sm:h-48"
              aria-label={labels.logoLightAlt}
            >
              <div className="bg-primary-500 text-secondaryText-50 flex size-16 items-center justify-center rounded-2xl text-2xl font-extrabold sm:size-20 sm:text-3xl">
                JH
              </div>
            </div>
            <div
              className="border-border bg-background-900 flex h-40 items-center justify-center rounded-lg border sm:h-48"
              aria-label={labels.logoDarkAlt}
            >
              <div className="bg-primary-500 text-secondaryText-50 flex size-16 items-center justify-center rounded-2xl text-2xl font-extrabold sm:size-20 sm:text-3xl">
                JH
              </div>
            </div>
          </div>
        </section>
      </ProcessReveal>

      <ProcessReveal>
        <section
          aria-labelledby="colophon-carbon-heading"
          className={cn(colophonSectionClassName(), "mb-8")}
        >
          <h2
            id="colophon-carbon-heading"
            className="text-foreground mb-4 text-2xl font-bold tracking-tight"
          >
            {labels.carbonTitle}
          </h2>
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            {labels.carbonBody}
          </p>
          <ColophonCarbonBadge
            co2Label={labels.carbonBadge.co2Label}
            brandLabel={labels.carbonBadge.brandLabel}
            cleanerLabel={labels.carbonBadge.cleanerLabel}
          />
        </section>
      </ProcessReveal>
    </div>
  );
}
