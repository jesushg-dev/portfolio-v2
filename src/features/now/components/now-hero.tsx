import type { ReactNode } from "react";
import { ProcessReveal } from "@/features/process-pages/components/process-reveal";
import { nowContainerClassName } from "./now-layout";
interface NowHeroProps {
  eyebrow: string;
  title: string;
  titleHighlight: string;
  description: string;
  children: ReactNode;
}
export function NowHero({
  eyebrow,
  title,
  titleHighlight,
  description,
  children,
}: NowHeroProps) {
  return (
    <header className="relative isolate overflow-hidden px-6 pt-36 pb-20 text-center md:pt-40 md:pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,color-mix(in_srgb,var(--primary)_15%,transparent),transparent_70%)]"
      />
      <div className={nowContainerClassName}>
        <ProcessReveal>
          <p className="text-primary text-base font-medium">{eyebrow}</p>
          <h1 className="text-foreground mx-auto mt-4 max-w-[12ch] text-[clamp(2.75rem,8vw,5.5rem)] leading-[1.03] font-bold tracking-tight">
            {title} {titleHighlight}
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-lg text-lg leading-relaxed md:text-xl">
            {description}
          </p>
        </ProcessReveal>
        {children}
      </div>
    </header>
  );
}
