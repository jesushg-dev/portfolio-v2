import { Link } from "@/i18n/routing";
import { processSectionHeadingId } from "./process-page-styles";
import { ProcessReveal } from "./process-reveal";

interface ProcessClosingCtaProps {
  id?: string;
  title: string;
  description: string;
  ctaLabel: string;
}

export function ProcessClosingCta({
  id = "contact",
  title,
  description,
  ctaLabel,
}: ProcessClosingCtaProps) {
  return (
    <section
      id={id}
      aria-labelledby={processSectionHeadingId(id)}
      className="border-border/80 border-t bg-[radial-gradient(ellipse_60%_70%_at_50%_100%,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_70%)] px-6 py-28 text-center"
    >
      <ProcessReveal className="mx-auto max-w-3xl">
        <h2
          id={processSectionHeadingId(id)}
          className="text-foreground mx-auto max-w-xl text-3xl leading-tight font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          {title}
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 mb-8 max-w-lg text-base leading-relaxed sm:text-lg">
          {description}
        </p>
        <Link
          href={{ pathname: "/", hash: "contact" }}
          className="bg-primary text-primary-foreground inline-flex min-h-11 items-center justify-center rounded-full px-8 py-3 text-sm font-medium transition-all hover:brightness-110"
        >
          {ctaLabel}
        </Link>
      </ProcessReveal>
    </section>
  );
}
