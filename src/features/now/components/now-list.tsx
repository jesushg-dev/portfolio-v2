import { ProcessReveal } from "@/features/process-pages/components/process-reveal";
import { nowContainerClassName } from "./now-layout";

export interface NowFocusItem {
  id: string;
  label: string;
  body: string;
}

interface NowListProps {
  heading: string;
  focuses: NowFocusItem[];
  statusBody?: string;
  statusEmoji?: string;
  statusRelative?: string;
}

export function NowList({
  heading,
  focuses,
  statusBody,
  statusEmoji,
  statusRelative,
}: NowListProps) {
  if (!focuses.length && !statusBody) return null;

  return (
    <section className="border-border/60 border-t py-20 sm:py-28">
      <div className={nowContainerClassName}>
        {/* Big Focus Banner from Prototype */}
        <ProcessReveal>
          <div className="mb-14 sm:mb-20">
            <h2 className="text-foreground max-w-3xl text-[clamp(1.75rem,4.4vw,3.25rem)] leading-[1.15] font-bold tracking-tight">
              {heading} —{" "}
              <span className="text-muted-foreground font-normal">
                {statusBody ??
                  "focused on new opportunities, my portfolio and learning languages."}
              </span>
            </h2>
            {statusRelative ? (
              <p className="text-muted-foreground mt-3 font-mono text-xs">
                {statusEmoji ? `${statusEmoji} ` : ""}
                {statusRelative}
              </p>
            ) : null}
          </div>
        </ProcessReveal>

        {/* 3-Column Focus Grid from Prototype */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-14">
          {focuses.map((focus) => (
            <div key={focus.id} className="flex flex-col">
              <h3 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                {focus.label}
              </h3>
              <p className="text-muted-foreground mt-3 text-base leading-relaxed sm:text-lg">
                {focus.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
