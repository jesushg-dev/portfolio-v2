"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import type { ProcessNavItem } from "../types";
import {
  processEyebrowStyles,
  processTextLinkStyles,
} from "./process-page-styles";

interface ProcessPageNavProps {
  items: ProcessNavItem[];
  label: string;
}

export function ProcessPageNav({ items, label }: ProcessPageNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [visible, setVisible] = useState(false);
  const heroVisible = useRef(true);
  const ctaVisible = useRef(false);

  useEffect(() => {
    const sectionIds = items.map((item) => item.id);
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((section) => sectionObserver.observe(section));

    const hero = document.getElementById("hero");
    const cta = document.getElementById("contact");

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === hero) heroVisible.current = entry.isIntersecting;
          if (entry.target === cta) ctaVisible.current = entry.isIntersecting;
        });
        setVisible(!heroVisible.current && !ctaVisible.current);
      },
      { threshold: 0.25 },
    );
    if (hero) visibilityObserver.observe(hero);
    if (cta) visibilityObserver.observe(cta);

    return () => {
      sectionObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, [items]);

  return (
    <nav
      aria-label={label}
      className={cn(
        "fixed top-1/2 left-10 z-20 hidden w-44 -translate-y-1/2 motion-safe:transition-opacity motion-safe:duration-500 2xl:block",
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      )}
    >
      <p className={cn(processEyebrowStyles, "text-muted-foreground mb-4")}>
        {label}
      </p>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  processTextLinkStyles,
                  "block min-h-11 justify-start rounded-none border-l-2 py-2 pl-4",
                  isActive
                    ? "border-primary text-primary font-semibold"
                    : "text-muted-foreground hover:text-primary border-border",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
