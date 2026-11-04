import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ShowcaseHeroProps {
  id?: string;
  eyebrow?: ReactNode;
  pill?: {
    text: string;
    active?: boolean;
  };
  title: ReactNode;
  titleHighlight?: string;
  subtitle?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  visual?: ReactNode;
  children?: ReactNode;
  align?: "center" | "split";
  className?: string;
}

export function ShowcaseHero({
  id = "hero",
  eyebrow,
  pill,
  title,
  titleHighlight,
  subtitle,
  description,
  actions,
  visual,
  children,
  align = "center",
  className,
}: ShowcaseHeroProps) {
  const isSplit = align === "split" || Boolean(visual);

  return (
    <header
      id={id}
      className={cn(
        "relative overflow-hidden",
        isSplit
          ? "bg-[radial-gradient(ellipse_70%_60%_at_30%_0%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_70%)] pt-28 pb-20 md:pt-36 md:pb-24"
          : "bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_70%)] pt-28 pb-18 text-center sm:pb-20",
        className,
      )}
    >
      <div className="mx-auto w-full px-4 sm:px-6 lg:container lg:px-20">
        {isSplit ? (
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
            <div>
              {pill ? (
                <div className="bg-primary/10 text-primary mb-5 inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-xs font-medium shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_35%,transparent)] sm:text-sm">
                  {pill.active !== false ? (
                    <span className="relative flex size-2">
                      <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                      <span className="bg-primary relative inline-flex size-2 rounded-full" />
                    </span>
                  ) : null}
                  <span>{pill.text}</span>
                </div>
              ) : eyebrow ? (
                <p className="text-primary mb-3 text-sm font-medium tracking-normal">
                  {eyebrow}
                </p>
              ) : null}

              <h1 className="text-foreground text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {title}{" "}
                {titleHighlight ? (
                  <span className="text-primary">{titleHighlight}</span>
                ) : null}
              </h1>

              {subtitle ? (
                <p className="text-foreground mt-3.5 text-xl font-semibold sm:text-2xl">
                  {subtitle}
                </p>
              ) : null}

              {description ? (
                <p className="text-muted-foreground mt-6 max-w-xl text-base leading-relaxed sm:text-lg lg:text-xl">
                  {description}
                </p>
              ) : null}

              {actions ? (
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  {actions}
                </div>
              ) : null}

              {children}
            </div>

            {visual ? (
              <div className="flex items-center justify-center">{visual}</div>
            ) : null}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            {pill ? (
              <div className="bg-primary/10 text-primary mb-5 inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-xs font-medium shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_35%,transparent)] sm:text-sm">
                {pill.active !== false ? (
                  <span className="relative flex size-2">
                    <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                    <span className="bg-primary relative inline-flex size-2 rounded-full" />
                  </span>
                ) : null}
                <span>{pill.text}</span>
              </div>
            ) : eyebrow ? (
              <p className="text-primary mb-3 text-sm font-medium tracking-normal">
                {eyebrow}
              </p>
            ) : null}

            <h1 className="text-foreground mx-auto max-w-2xl text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {title}{" "}
              {titleHighlight ? (
                <span className="text-primary">{titleHighlight}</span>
              ) : null}
            </h1>

            {subtitle ? (
              <p className="text-foreground mt-3.5 text-xl font-semibold sm:text-2xl">
                {subtitle}
              </p>
            ) : null}

            {description ? (
              <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
                {description}
              </p>
            ) : null}

            {actions ? (
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                {actions}
              </div>
            ) : null}

            {children}
          </div>
        )}
      </div>
    </header>
  );
}
