import type { ReactNode } from "react";

import {
  ProcessReveal,
  ProcessRevealStaggerItem,
} from "@/features/process-pages/components/process-reveal";
import { cn } from "@/lib/utils";

import { nowContainerClassName, nowSectionClassName } from "./now-layout";
import { NowLocalTime } from "./now-local-time";

export interface NowFocusItem {
  id: string;
  label: string;
  body: string;
}

interface NowListProps {
  localTimeLabel: string;
  readingLabel: string;
  book: string;
  focusesLabel: string;
  timezone: string;
  focuses: NowFocusItem[];
}

export function NowList({
  localTimeLabel,
  readingLabel,
  book,
  focusesLabel,
  timezone,
  focuses,
}: NowListProps) {
  return (
    <section className={cn(nowSectionClassName(), "pb-10 md:pb-14")}>
      <div className={nowContainerClassName}>
        <ProcessReveal>
          <div className="text-center">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
              {localTimeLabel}
            </p>
            <NowLocalTime
              timezone={timezone}
              className="text-primary font-mono text-[clamp(2.75rem,10vw,4.5rem)] leading-none font-semibold tracking-tight tabular-nums"
            />
            <p className="text-muted-foreground mt-6 text-sm tracking-wide">
              {readingLabel}
            </p>
            <p className="text-foreground mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              {book}
            </p>
          </div>
        </ProcessReveal>

        {focuses.length > 0 ? (
          <>
            <ProcessReveal delay={0.08} className="mt-14 sm:mt-16">
              <p className="text-muted-foreground mb-8 text-center text-xs font-semibold tracking-[0.18em] uppercase">
                {focusesLabel}
              </p>
            </ProcessReveal>

            <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
              {focuses.map((focus, index) => (
                <ProcessRevealStaggerItem key={focus.id} index={index}>
                  <FocusBlock label={focus.label} body={focus.body} />
                </ProcessRevealStaggerItem>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function FocusBlock({ label, body }: { label: string; body: ReactNode }) {
  return (
    <div className="border-primary/40 border-t pt-4">
      <p className="text-primary mb-2 font-mono text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </p>
      <p className="text-foreground/90 text-[15px] leading-relaxed sm:text-base">
        {body}
      </p>
    </div>
  );
}
