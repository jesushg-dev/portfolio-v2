"use client";

import { Coffee } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import { ProcessRevealStaggerItem } from "@/features/process-pages/components/process-reveal";

const EMOJIS = ["☕", "☕", "🫘", "✨"] as const;
const CELEBRATION_MS = 2400;

interface ConfettiPiece {
  id: number;
  emoji: (typeof EMOJIS)[number];
  style: CSSProperties;
}

function unit(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

const CONFETTI: ConfettiPiece[] = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  emoji: EMOJIS[i % EMOJIS.length] ?? "☕",
  style: {
    left: `${unit(i + 1) * 100}vw`,
    fontSize: `${18 + unit(i + 2) * 30}px`,
    animationDuration: `${1.5 + unit(i + 3) * 1.1}s`,
    animationDelay: `${unit(i + 4) * 0.5}s`,
  },
}));

const celebrationStyles = `
@keyframes uses-coffee-burst {
  0% { opacity: 0; transform: scale(0.2) rotate(-15deg); }
  15% { opacity: 1; }
  35% { transform: scale(1.15) rotate(8deg); }
  50% { transform: scale(1) rotate(-4deg); }
  65% { transform: scale(1.06) rotate(2deg); }
  82% { opacity: 1; transform: scale(1) rotate(0deg); }
  100% { opacity: 0; transform: scale(1.3) rotate(0deg); }
}
@keyframes uses-coffee-text {
  0%, 68% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-6px); }
}
@keyframes uses-coffee-letter {
  0% { opacity: 0; transform: translateY(24px) rotate(-10deg); }
  50% { opacity: 1; transform: translateY(-12px) rotate(6deg); }
  75% { transform: translateY(3px) rotate(-2deg); }
  100% { opacity: 1; transform: translateY(0) rotate(0deg); }
}
@keyframes uses-coffee-flash {
  0% { opacity: 0; }
  25% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes uses-coffee-confetti {
  0% { transform: translate(0, -60px) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  50% { transform: translate(18px, 45vh) rotate(180deg); }
  100% { transform: translate(-14px, 112vh) rotate(360deg); opacity: 0; }
}
@keyframes uses-coffee-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
}
.uses-coffee-burst {
  animation: uses-coffee-burst 1.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.uses-coffee-text {
  animation: uses-coffee-text 1.9s ease forwards;
}
.uses-coffee-letter {
  display: inline-block;
  animation: uses-coffee-letter 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.uses-coffee-flash {
  animation: uses-coffee-flash 0.9s ease-out forwards;
}
.uses-coffee-confetti {
  position: absolute;
  top: -60px;
  animation-name: uses-coffee-confetti;
  animation-timing-function: ease-in;
  animation-fill-mode: forwards;
  will-change: transform, opacity;
}
.uses-coffee-wiggle {
  animation: uses-coffee-wiggle 0.4s ease-in-out;
}
@media (prefers-reduced-motion: reduce) {
  .uses-coffee-burst,
  .uses-coffee-text,
  .uses-coffee-letter,
  .uses-coffee-flash,
  .uses-coffee-confetti,
  .uses-coffee-wiggle {
    animation: none !important;
  }
}
`;

interface UsesCoffeeCelebrationProps {
  label: string;
  reducedMotion: boolean;
}

function UsesCoffeeCelebration({
  label,
  reducedMotion,
}: UsesCoffeeCelebrationProps) {
  return createPortal(
    <div
      role="presentation"
      className="pointer-events-none fixed inset-0 z-99999 overflow-hidden"
    >
      <div className="bg-background/55 absolute inset-0 backdrop-blur-[1px]" />

      <div
        className={
          reducedMotion
            ? "absolute inset-0 opacity-70"
            : "uses-coffee-flash absolute inset-0"
        }
        style={{
          background:
            "radial-gradient(circle at 50% 45%, color-mix(in oklab, var(--primary) 40%, transparent), transparent 60%)",
        }}
      />

      {!reducedMotion
        ? CONFETTI.map((piece) => (
            <span
              key={piece.id}
              className="uses-coffee-confetti"
              style={piece.style}
            >
              {piece.emoji}
            </span>
          ))
        : null}

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-4">
        <span
          className={
            reducedMotion
              ? "text-[110px] leading-none drop-shadow-lg sm:text-[170px]"
              : "uses-coffee-burst text-[110px] leading-none drop-shadow-lg sm:text-[170px]"
          }
        >
          ☕
        </span>
        <span
          className={
            reducedMotion
              ? "text-primary text-center text-2xl font-extrabold tracking-tight sm:text-4xl"
              : "uses-coffee-text text-primary text-center text-2xl font-extrabold tracking-tight sm:text-4xl"
          }
        >
          {reducedMotion
            ? label
            : label.split("").map((char, charIndex) => (
                <span
                  key={`${char}-${charIndex}`}
                  className="uses-coffee-letter"
                  style={{ animationDelay: `${charIndex * 0.04}s` }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
        </span>
      </div>
    </div>,
    document.body,
  );
}

interface UsesCoffeeCardProps {
  title: string;
  description: string;
  celebrateLabel: string;
  ariaLabel: string;
  index: number;
}

export function UsesCoffeeCard({
  title,
  description,
  celebrateLabel,
  ariaLabel,
  index,
}: UsesCoffeeCardProps) {
  const [celebrating, setCelebrating] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const liveRegionId = useId();

  {
    /* Timer to dismiss overlay — async setState is intentional */
  }
  useEffect(() => {
    if (!celebrating) return;
    const timer = window.setTimeout(() => {
      setCelebrating(false);
      setWiggle(false);
    }, CELEBRATION_MS);
    return () => window.clearTimeout(timer);
  }, [celebrating]);

  const celebrate = useCallback(() => {
    if (celebrating) return;
    setWiggle(true);
    setCelebrating(true);
  }, [celebrating]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      celebrate();
    }
  };

  return (
    <>
      <style>{celebrationStyles}</style>
      <ProcessRevealStaggerItem index={index % 10}>
        <motion.button
          type="button"
          title={ariaLabel}
          aria-label={ariaLabel}
          aria-describedby={liveRegionId}
          onClick={celebrate}
          onKeyDown={handleKeyDown}
          whileHover={shouldReduceMotion ? undefined : { y: -2 }}
          className={`group/item relative flex w-full cursor-pointer flex-row items-start gap-4 text-left select-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:outline-none ${wiggle && !shouldReduceMotion ? "uses-coffee-wiggle" : ""}`}
        >
          <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-md shadow-sm transition-transform duration-200 group-hover/item:scale-105">
            <Coffee aria-hidden className="size-5" />
          </span>
          <span className="flex flex-1 flex-col gap-1 pt-0.5">
            <span className="text-foreground/85 group-hover/item:text-foreground line-clamp-2 text-sm underline decoration-current/20 decoration-dashed underline-offset-2 transition-colors group-hover/item:decoration-current group-hover/item:decoration-solid">
              {title}
            </span>
            <span className="text-muted-foreground line-clamp-2 text-xs leading-normal">
              {description}
            </span>
          </span>
        </motion.button>
      </ProcessRevealStaggerItem>

      <span id={liveRegionId} className="sr-only" aria-live="polite">
        {celebrating ? celebrateLabel : null}
      </span>

      {celebrating ? (
        <UsesCoffeeCelebration
          label={celebrateLabel}
          reducedMotion={Boolean(shouldReduceMotion)}
        />
      ) : null}
    </>
  );
}
