"use client";

import { createElement, type FC } from "react";
import { motion, type Variants } from "motion/react";

import { resolveSoftSkillIcon } from "@/features/soft-skills/lib/soft-skill-icons";

export interface SoftSkillBentoItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
  featured: boolean;
}

interface SoftSkillsBentoProps {
  items: SoftSkillBentoItem[];
}

const SoftSkillBentoIcon: FC<{ icon: string; className?: string }> = ({
  icon,
  className,
}) =>
  createElement(resolveSoftSkillIcon(icon), {
    className,
    "aria-hidden": true,
  });

const SoftSkillsBento: FC<SoftSkillsBentoProps> = ({ items }) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
      >
        {items.map((item) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            className="from-card via-card to-primary/[0.04] text-card-foreground border-border/80 hover:border-primary/60 hover:shadow-primary/10 group relative flex h-full min-h-[210px] flex-col justify-between overflow-hidden rounded-3xl border bg-gradient-to-br p-6 transition-all duration-300 hover:shadow-2xl lg:p-7"
          >
            {/* Background Ambient Glow */}
            <div className="bg-primary/15 group-hover:bg-primary/25 pointer-events-none absolute -right-10 -bottom-10 size-36 rounded-full blur-2xl transition-all duration-500 group-hover:scale-125" />

            {/* Background Decorative Icon Watermark */}
            <div className="text-primary pointer-events-none absolute -right-4 -bottom-4 size-28 opacity-[0.07] transition-all duration-500 group-hover:scale-110 group-hover:opacity-20">
              <SoftSkillBentoIcon icon={item.icon} className="size-full" />
            </div>

            <div className="z-10 space-y-3">
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-primary/30 flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 group-hover:scale-110">
                  <SoftSkillBentoIcon icon={item.icon} className="size-5" />
                </span>
                <h3 className="text-foreground group-hover:text-primary min-w-0 flex-1 text-lg leading-snug font-bold tracking-tight wrap-break-word transition-colors sm:text-xl">
                  {item.title}
                </h3>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                {item.description}
              </p>
            </div>

            {/* Bottom Accent Row with DB-driven Badge */}
            {item.badge ? (
              <div className="border-border/50 z-10 mt-5 flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/60 group-hover:bg-primary size-1.5 rounded-full transition-all duration-300 group-hover:scale-125" />
                  <span className="text-muted-foreground group-hover:text-foreground text-[11px] font-semibold transition-colors">
                    {item.badge}
                  </span>
                </div>
                <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex size-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300">
                  ✓
                </div>
              </div>
            ) : null}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default SoftSkillsBento;
