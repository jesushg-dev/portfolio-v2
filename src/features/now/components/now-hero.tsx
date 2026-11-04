import type { ReactNode } from "react";
import { ProcessReveal } from "@/features/process-pages/components/process-reveal";
import { nowContainerClassName } from "./now-layout";

interface NowHeroProps {
  eyebrow: string;
  title: string;
  titleHighlight: string;
  description: string;
  snapshotLabel?: string;
  children: ReactNode;
}

export function NowHero({
  eyebrow,
  title,
  titleHighlight,
  description,
  snapshotLabel,
  children,
}: NowHeroProps) {
  return (
    <header className="relative isolate overflow-hidden px-6 pt-32 pb-20 text-center sm:pt-36 sm:pb-24">
      {/* Radial Gradient Hero Background from Prototype */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_70%)]"
      />
      <div className={nowContainerClassName}>
        <ProcessReveal>
          <p className="text-primary text-sm font-semibold tracking-wider uppercase">
            {eyebrow}
          </p>
          <h1 className="text-foreground mx-auto mt-4 max-w-[14ch] text-[clamp(2.75rem,8vw,5.5rem)] leading-[1.03] font-extrabold tracking-tight">
            {title} {titleHighlight}
          </h1>
          <p className="text-foreground/90 mx-auto mt-6 max-w-xl text-lg leading-relaxed font-medium sm:text-xl">
            {description}
          </p>
          <p className="text-muted-foreground mt-3 font-mono text-xs sm:text-sm">
            {snapshotLabel ?? "A snapshot, updated whenever I remember to."}
          </p>
        </ProcessReveal>
        {children}
      </div>
    </header>
  );
}
