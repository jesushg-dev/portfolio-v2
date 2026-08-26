import Image from "next/image";
import type { ReactNode } from "react";
import { Code2 } from "lucide-react";

import { processSectionHeadingId } from "@/features/process-pages/components/process-page-styles";
import { ProcessReveal } from "@/features/process-pages/components/process-reveal";

import {
  USES_CODING_PREVIEW_DARK_FALLBACK,
  USES_CODING_PREVIEW_LIGHT_FALLBACK,
} from "../data";
import { usesContainerClassName, usesSectionClassName } from "./uses-layout";

interface UsesCodingSectionProps {
  title: string;
  intro?: ReactNode | null;
  previewCaption: string;
  previewLightAlt: string;
  previewDarkAlt: string;
  previewLight?: string | null;
  previewDark?: string | null;
}

export function UsesCodingSection({
  title,
  intro,
  previewCaption,
  previewLightAlt,
  previewDarkAlt,
  previewLight,
  previewDark,
}: UsesCodingSectionProps) {
  const lightSrc = previewLight ?? USES_CODING_PREVIEW_LIGHT_FALLBACK;
  const darkSrc = previewDark ?? USES_CODING_PREVIEW_DARK_FALLBACK;
  return (
    <section
      id="coding"
      aria-labelledby={processSectionHeadingId("coding")}
      className={usesSectionClassName(true)}
    >
      <div className={usesContainerClassName}>
        <ProcessReveal>
          <h2
            id={processSectionHeadingId("coding")}
            className="text-foreground mb-8 flex items-center gap-3.5 text-2xl font-extrabold tracking-tight sm:text-[27px]"
          >
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl text-base">
              <Code2 aria-hidden className="size-4" />
            </span>
            {title}
          </h2>
        </ProcessReveal>

        {intro ? (
          <ProcessReveal>
            <p className="text-muted-foreground mb-8 max-w-3xl text-base">
              {intro}
            </p>
          </ProcessReveal>
        ) : null}

        <ProcessReveal delay={0.1}>
          <figure>
            <div className="relative aspect-[8/5] overflow-hidden rounded-xl">
              <Image
                src={lightSrc}
                alt={previewLightAlt}
                fill
                sizes="(max-width: 1440px) 100vw, 1440px"
                className="object-cover opacity-100 transition select-none dark:opacity-0"
              />
              <Image
                src={darkSrc}
                alt={previewDarkAlt}
                fill
                sizes="(max-width: 1440px) 100vw, 1440px"
                className="object-cover opacity-0 transition select-none dark:opacity-100"
                aria-hidden
              />
            </div>
            <figcaption className="text-muted-foreground mt-2.5 text-center text-xs select-none">
              {previewCaption}
            </figcaption>
          </figure>
        </ProcessReveal>
      </div>
    </section>
  );
}
