"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useEffect, useRef, type MouseEvent } from "react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import {
  processDarkBandClass,
  processDarkBandMutedTextClass,
  processInteractiveStyles,
  processSectionHeadingId,
} from "./process-page-styles";
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
  const shouldReduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 22, mass: 0.6 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 22, mass: 0.6 });

  const spotlight = useMotionTemplate`
    radial-gradient(
      540px circle at ${springX}px ${springY}px,
      rgba(56, 189, 248, 0.22),
      rgba(59, 130, 246, 0.1) 42%,
      transparent 72%
    )
  `;

  useEffect(() => {
    if (shouldReduceMotion || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    mouseX.set(width / 2);
    mouseY.set(height / 2);
  }, [mouseX, mouseY, shouldReduceMotion]);

  const setGlowFromEvent = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  };

  const resetGlowToCenter = () => {
    if (!cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    mouseX.set(width / 2);
    mouseY.set(height / 2);
  };

  return (
    <section
      id={id}
      aria-labelledby={processSectionHeadingId(id)}
      className="px-6 pb-24"
    >
      <ProcessReveal className="mx-auto max-w-4xl">
        <div
          ref={cardRef}
          className={cn(
            "relative overflow-hidden rounded-3xl px-8 py-16 text-center",
            processDarkBandClass,
          )}
          onMouseMove={shouldReduceMotion ? undefined : setGlowFromEvent}
          onMouseLeave={shouldReduceMotion ? undefined : resetGlowToCenter}
        >
          {shouldReduceMotion ? (
            <div
              aria-hidden
              className="bg-primary/20 pointer-events-none absolute -top-16 -right-16 size-72 rounded-full blur-3xl"
            />
          ) : (
            <>
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-3xl"
                style={{ background: spotlight }}
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/10 blur-3xl"
                style={{ left: springX, top: springY }}
              />
            </>
          )}

          <h2
            id={processSectionHeadingId(id)}
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
              "bg-primary-900 text-primary-foreground hover:bg-primary-900/90 relative",
            )}
          >
            {ctaLabel}
          </Link>
        </div>
      </ProcessReveal>
    </section>
  );
}
