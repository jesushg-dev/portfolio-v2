"use client";

import type { FC, ReactNode, MouseEvent } from "react";
import { useCallback, useState } from "react";
import { motion } from "motion/react";

interface ContactContainerProps {
  children: ReactNode;
  showContactForm: boolean;
}

export const ContactContainer: FC<ContactContainerProps> = ({
  children,
  showContactForm,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group/card border-border/50 bg-card/75 text-card-foreground relative grid overflow-hidden rounded-2xl border shadow-xl backdrop-blur-sm transition-all duration-300 ${
        showContactForm ? "md:grid-cols-[1.05fr_0.95fr]" : "md:grid-cols-1"
      }`}
    >
      {/* Spotlight Cursor Glow (Linear / Stripe / Vercel style) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-500"
        style={{
          opacity: isHovered ? 0.08 : 0,
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--primary) 0%, transparent 75%)`,
        }}
      />

      {/* Subtle border shine following cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-500"
        style={{
          opacity: isHovered ? 0.25 : 0,
          background: `radial-gradient(350px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--primary), transparent 80%)`,
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
        }}
      />

      {children}
    </motion.div>
  );
};
