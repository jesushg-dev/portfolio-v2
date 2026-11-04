import type { ReactNode } from "react";
import { HeadingAccent } from "./heading-accent";
import { cn } from "@/lib/utils";

export interface ShowcaseHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  titleGradient?: string;
  description?: ReactNode;
  align?: "center" | "left" | "split";
  action?: ReactNode;
  sectionId?: string;
  className?: string;
}

export function ShowcaseHeading({
  eyebrow,
  title,
  titleGradient,
  description,
  align = "center",
  action,
  sectionId,
  className,
}: ShowcaseHeadingProps) {
  const headingId = sectionId ? `${sectionId}-heading` : undefined;

  if (align === "split") {
    return (
      <div
        className={cn(
          "mb-10 flex flex-wrap items-end justify-between gap-6",
          className,
        )}
      >
        <div>
          {eyebrow ? (
            <p className="mb-3 text-sm font-semibold tracking-normal text-[var(--brand2)]">
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={headingId}
            className="text-foreground text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl"
          >
            {title}{" "}
            {titleGradient ? (
              <HeadingAccent>{titleGradient}</HeadingAccent>
            ) : null}
          </h2>
          {description ? (
            <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    );
  }

  const isLeft = align === "left";

  return (
    <div
      className={cn(
        "mb-14 sm:mb-16 md:mb-18",
        !isLeft && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-sm font-semibold tracking-normal text-[var(--brand2)]">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={headingId}
        className="text-foreground text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl"
      >
        {title}{" "}
        {titleGradient ? <HeadingAccent>{titleGradient}</HeadingAccent> : null}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-muted-foreground mt-4 text-base leading-relaxed sm:text-lg",
            !isLeft && "mx-auto max-w-xl",
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
