"use client";

import { createElement, useState, type FC, type MouseEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { resolveSoftSkillIcon } from "@/features/soft-skills/lib/soft-skill-icons";

export interface SoftSkillBentoItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  featured: boolean;
}

interface SoftSkillsBentoProps {
  items: SoftSkillBentoItem[];
}

interface SoftSkillBentoCardProps {
  featured: boolean;
  icon: string;
  title: string;
  description: string;
  index: number;
  shouldReduceMotion: boolean | null;
}

function useWobble(enabled: boolean) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (!enabled) return;

    const { clientX, clientY } = event;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (clientX - (rect.left + rect.width / 2)) / 20;
    const y = (clientY - (rect.top + rect.height / 2)) / 20;
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    if (enabled) setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setMousePosition({ x: 0, y: 0 });
  };

  return {
    mousePosition,
    isHovering,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
  };
}

const SoftSkillBentoIcon: FC<{ icon: string; className?: string }> = ({
  icon,
  className,
}) =>
  createElement(resolveSoftSkillIcon(icon), {
    className,
    "aria-hidden": true,
  });

const SoftSkillBentoCard: FC<SoftSkillBentoCardProps> = ({
  featured,
  icon,
  title,
  description,
  index,
  shouldReduceMotion,
}) => {
  const animationsEnabled = !shouldReduceMotion;
  const {
    mousePosition,
    isHovering,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
  } = useWobble(animationsEnabled);

  const cardContent = (
    <>
      <div className="mb-2.5 flex items-center gap-3">
        <span
          className={cn(
            "bg-primary/10 text-primary flex shrink-0 items-center justify-center rounded-full",
            featured ? "h-10 w-10" : "h-9 w-9",
          )}
        >
          <SoftSkillBentoIcon
            icon={icon}
            className={featured ? "h-5 w-5" : "h-4 w-4"}
          />
        </span>
        <p
          className={cn(
            "text-foreground font-semibold tracking-tight",
            featured ? "text-base sm:text-lg" : "text-sm",
          )}
        >
          {title}
        </p>
      </div>
      <p
        className={cn(
          "text-muted-foreground leading-relaxed",
          featured ? "text-sm sm:text-[0.9375rem]" : "text-sm",
        )}
      >
        {description}
      </p>
    </>
  );

  const cardClassName = cn(
    "bg-card text-card-foreground relative z-10 h-full rounded-2xl border p-5 transition-[border-color,box-shadow] duration-200 ease-out sm:p-6",
    featured
      ? "border-border/80 shadow-[6px_6px_0_0] shadow-primary/10 hover:shadow-[8px_8px_0_0] hover:shadow-primary/15"
      : "border-border/70 shadow-sm hover:shadow-md",
    "hover:border-primary/35",
  );

  if (!animationsEnabled) {
    return (
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={cardClassName}
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        type: "spring",
        duration: 0.5,
        bounce: 0.15,
        delay: index * 0.06,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovering
          ? `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0)`
          : "translate3d(0px, 0px, 0)",
        transition: "transform 0.1s ease-out",
      }}
      className="h-full"
    >
      <motion.div
        style={{
          transform: isHovering
            ? `translate3d(${-mousePosition.x}px, ${-mousePosition.y}px, 0) scale3d(1.02, 1.02, 1)`
            : "translate3d(0px, 0px, 0) scale3d(1, 1, 1)",
          transition: "transform 0.1s ease-out",
        }}
        className={cardClassName}
      >
        {cardContent}
      </motion.div>
    </motion.div>
  );
};

const SoftSkillsBento: FC<SoftSkillsBentoProps> = ({ items }) => {
  const shouldReduceMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const animationsEnabled = !shouldReduceMotion;

  if (items.length === 0) return null;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "relative h-full",
              item.featured ? "col-span-2" : "col-span-1",
            )}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {animationsEnabled ? (
              <AnimatePresence>
                {hoveredIndex === index && (
                  <motion.span
                    layoutId="soft-skill-hover-bg"
                    className="bg-primary/8 border-primary/15 shadow-primary/10 pointer-events-none absolute inset-0 z-0 block rounded-2xl border shadow-[6px_6px_0_0]"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      transition: { duration: 0.15 },
                    }}
                    exit={{
                      opacity: 0,
                      transition: { duration: 0.15, delay: 0.05 },
                    }}
                  />
                )}
              </AnimatePresence>
            ) : null}

            <SoftSkillBentoCard
              featured={item.featured}
              icon={item.icon}
              title={item.title}
              description={item.description}
              index={index}
              shouldReduceMotion={shouldReduceMotion}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SoftSkillsBento;
