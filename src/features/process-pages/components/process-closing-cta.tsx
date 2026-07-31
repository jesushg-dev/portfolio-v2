import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import {
  processDarkBandClass,
  processDarkBandMutedTextClass,
  processInteractiveStyles,
  processSectionHeadingId,
} from "./process-page-styles";

interface ProcessClosingCtaProps {
  title: string;
  description: string;
  ctaLabel: string;
}

export function ProcessClosingCta({
  title,
  description,
  ctaLabel,
}: ProcessClosingCtaProps) {
  return (
    <section
      id="contact"
      aria-labelledby={processSectionHeadingId("contact")}
      className="px-6 pb-24"
    >
      <div
        className={cn(
          "relative mx-auto max-w-4xl overflow-hidden rounded-3xl px-8 py-16 text-center",
          processDarkBandClass,
        )}
      >
        <div className="bg-primary/20 pointer-events-none absolute -top-16 -right-16 size-72 rounded-full blur-3xl" />
        <h2
          id={processSectionHeadingId("contact")}
          className="relative mb-4 text-3xl font-extrabold md:text-4xl"
        >
          {title}
        </h2>
        <p
          className={cn(
            processDarkBandMutedTextClass,
            "relative mx-auto mb-8 max-w-xl text-sm leading-relaxed md:text-base",
          )}
        >
          {description}
        </p>
        <Link
          href="/schedule"
          className={cn(
            processInteractiveStyles,
            "bg-primary text-primary-foreground hover:bg-primary/90 relative",
          )}
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
