import {
  ProcessReveal,
  ProcessRevealStaggerItem,
} from "@/features/process-pages/components/process-reveal";
import { cn } from "@/lib/utils";
import { nowContainerClassName, nowSectionClassName } from "./now-layout";
import { NowHover } from "./now-hover";
export interface NowFocusItem {
  id: string;
  label: string;
  body: string;
}
interface NowListProps {
  heading: string;
  focuses: NowFocusItem[];
  statusBody: string;
  statusEmoji: string;
  statusRelative: string;
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
    <section className={nowSectionClassName}>
      <div className={nowContainerClassName}>
        <ProcessReveal>
          <h2 className="text-foreground max-w-[22ch] text-[clamp(1.75rem,4.4vw,3.25rem)] leading-[1.15] font-semibold tracking-tight">
            {heading}
            <span aria-hidden className="text-primary">
              _
            </span>
          </h2>
          {statusBody ? (
            <div className="mt-6 max-w-2xl">
              <p className="text-muted-foreground text-base leading-relaxed whitespace-pre-line">
                <span aria-hidden className="mr-2">
                  {statusEmoji}
                </span>
                {statusBody}
              </p>
              {statusRelative ? (
                <p className="text-muted-foreground mt-2 text-xs">
                  {statusRelative}
                </p>
              ) : null}
            </div>
          ) : null}
        </ProcessReveal>
        <div
          className={cn(
            "grid gap-10 md:grid-cols-3 md:gap-14",
            focuses.length > 0 && "mt-14 md:mt-20",
          )}
        >
          {focuses.map((focus, index) => (
            <ProcessRevealStaggerItem key={focus.id} index={index}>
              <NowHover>
                <h3 className="text-foreground text-xl font-semibold tracking-tight">
                  {focus.label}
                </h3>
                <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
                  {focus.body}
                </p>
              </NowHover>
            </ProcessRevealStaggerItem>
          ))}
        </div>
      </div>
    </section>
  );
}
