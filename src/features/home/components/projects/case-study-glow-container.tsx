"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function CaseStudyGlowContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;

    const findCard = (target: EventTarget | null) =>
      target instanceof Element
        ? target.closest<HTMLElement>("[data-case-study-card]")
        : null;

    const updateGlow = (event: PointerEvent) => {
      const card = findCard(event.target);
      if (!card || !article.contains(card)) return;

      const bounds = card.getBoundingClientRect();
      card.style.setProperty("--x", `${event.clientX - bounds.left}px`);
      card.style.setProperty("--y", `${event.clientY - bounds.top}px`);
    };

    const resetGlow = (event: PointerEvent) => {
      const card = findCard(event.target);
      if (
        !card ||
        !article.contains(card) ||
        (event.relatedTarget instanceof Node &&
          card.contains(event.relatedTarget))
      ) {
        return;
      }

      card.style.removeProperty("--x");
      card.style.removeProperty("--y");
    };

    article.addEventListener("pointermove", updateGlow);
    article.addEventListener("pointerout", resetGlow);
    return () => {
      article.removeEventListener("pointermove", updateGlow);
      article.removeEventListener("pointerout", resetGlow);
    };
  }, []);

  return (
    <article ref={articleRef} className={className}>
      {children}
    </article>
  );
}
