import { ProcessReveal } from "@/features/process-pages/components/process-reveal";
import { cn } from "@/lib/utils";

import { nowContainerClassName, nowSectionClassName } from "./now-layout";

interface NowNoteProps {
  before: string;
  linkLabel: string;
  after: string;
}

export function NowNote({ before, linkLabel, after }: NowNoteProps) {
  return (
    <section className={cn(nowSectionClassName(), "pb-16 md:pb-20")}>
      <ProcessReveal>
        <p
          className={cn(
            nowContainerClassName,
            "text-muted-foreground text-center text-sm leading-relaxed",
          )}
        >
          {before}{" "}
          <a
            href="https://nownownow.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold underline underline-offset-2"
          >
            {linkLabel}
          </a>
          {after}
        </p>
      </ProcessReveal>
    </section>
  );
}
