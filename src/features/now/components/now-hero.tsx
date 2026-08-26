import { processEyebrowStyles } from "@/features/process-pages/components/process-page-styles";
import { ProcessReveal } from "@/features/process-pages/components/process-reveal";
import { cn } from "@/lib/utils";

import { nowContainerClassName, nowSectionClassName } from "./now-layout";

interface NowHeroProps {
  eyebrow: string;
  title: string;
  titleHighlight: string;
  description: string;
}

export function NowHero({
  eyebrow,
  title,
  titleHighlight,
  description,
}: NowHeroProps) {
  return (
    <header
      className={cn(
        nowSectionClassName(),
        "relative overflow-hidden pt-8 pb-8 md:pt-12 md:pb-10",
      )}
    >
      <div className="from-primary/8 via-background to-background absolute inset-0 -z-10 bg-linear-to-b" />

      <ProcessReveal>
        <div className={cn(nowContainerClassName, "text-center")}>
          <p
            className={cn(
              processEyebrowStyles,
              "mb-3 inline-flex items-center gap-2 font-mono tracking-wide normal-case",
            )}
          >
            <span aria-hidden className="bg-primary size-1.5 rounded-sm" />
            {eyebrow}
          </p>

          <h1 className="text-foreground mb-4 text-[clamp(2rem,5vw,3.125rem)] leading-[1.15] font-extrabold tracking-tight">
            {title} <span className="text-primary">{titleHighlight}</span>
          </h1>

          <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed">
            {description}
          </p>
        </div>
      </ProcessReveal>
    </header>
  );
}
