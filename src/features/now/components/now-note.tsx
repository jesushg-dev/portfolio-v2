import { ProcessReveal } from "@/features/process-pages/components/process-reveal";
import { nowContainerClassName, nowSectionClassName } from "./now-layout";

interface NowNoteProps {
  description: string;
  linkLabel: string;
  inspiredBy?: string;
}

export function NowNote({ description, linkLabel, inspiredBy }: NowNoteProps) {
  return (
    <section className={nowSectionClassName}>
      <ProcessReveal className={nowContainerClassName}>
        <div className="text-center">
          <p className="text-foreground mx-auto max-w-[30ch] text-[clamp(1.5rem,3.4vw,2.5rem)] leading-tight font-semibold tracking-tight">
            {description}
          </p>
          {inspiredBy && (
            <p className="text-muted-foreground mt-4 text-sm sm:text-base">
              {inspiredBy}{" "}
              <a
                href="https://sive.rs/now"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary focus-visible:ring-ring rounded-xs font-semibold underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                Derek Sivers
              </a>
            </p>
          )}
          <a
            href="https://nownownow.com/about"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring mt-7 inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-medium outline-none focus-visible:ring-2"
          >
            {linkLabel}
          </a>
        </div>
      </ProcessReveal>
    </section>
  );
}
