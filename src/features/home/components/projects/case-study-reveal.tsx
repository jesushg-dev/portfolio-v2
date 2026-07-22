"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CaseStudyRevealProps {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}

export default function CaseStudyReveal({
  children,
  className,
  stagger = false,
}: CaseStudyRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          element.classList.add("case-study-in-view");
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        stagger ? "case-study-reveal-stagger" : "case-study-reveal",
        className,
      )}
    >
      {children}
    </div>
  );
}
