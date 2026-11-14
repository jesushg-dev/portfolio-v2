"use client";

import type { FC, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

interface SpotifyScrollingTextProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  hold?: number;
}

export const SpotifyScrollingText: FC<SpotifyScrollingTextProps> = ({
  children,
  className = "",
  speed = 50,
  hold = 1600,
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;

    let anim: Animation | null = null;

    const run = () => {
      if (anim) {
        anim.cancel();
        anim = null;
      }

      if (box.clientWidth === 0 || text.offsetWidth === 0) {
        setOverflowing(false);
        return;
      }

      const distance = Math.ceil(text.offsetWidth - box.clientWidth);
      const needsScroll = distance > 4;
      setOverflowing(needsScroll);

      if (typeof window === "undefined") return;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (!needsScroll || reduceMotion) return;

      const move = (distance / speed) * 1000;
      const total = move * 2 + hold * 2;
      const end = `translateX(${-distance}px)`;

      anim = text.animate(
        [
          { transform: "translateX(0)", offset: 0 },
          { transform: "translateX(0)", offset: hold / total },
          { transform: end, offset: (hold + move) / total },
          { transform: end, offset: (hold * 2 + move) / total },
          { transform: "translateX(0)", offset: 1 },
        ],
        { duration: total, iterations: Infinity, easing: "linear" },
      );
    };

    run();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(run);
      ro.observe(box);
      ro.observe(text);
    }

    if (typeof document !== "undefined" && "fonts" in document) {
      void document.fonts.ready.then(run);
    }

    return () => {
      ro?.disconnect();
      if (anim) {
        anim.cancel();
      }
    };
  }, [children, speed, hold]);

  const mask = overflowing
    ? "linear-gradient(to right, transparent, #000 0.75rem, #000 calc(100% - 0.75rem), transparent)"
    : "none";

  return (
    <div
      ref={boxRef}
      className="w-full max-w-full overflow-hidden"
      style={{ WebkitMaskImage: mask, maskImage: mask }}
    >
      <span
        ref={textRef}
        className={
          "inline-block whitespace-nowrap will-change-transform " + className
        }
      >
        {children}
      </span>
    </div>
  );
};

export default SpotifyScrollingText;
