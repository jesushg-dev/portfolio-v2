"use client";

import { createElement, type FC } from "react";
import { useTranslations } from "next-intl";
import { motion, type Variants } from "motion/react";

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

const SoftSkillBentoIcon: FC<{ icon: string; className?: string }> = ({
  icon,
  className,
}) =>
  createElement(resolveSoftSkillIcon(icon), {
    className,
    "aria-hidden": true,
  });

const SoftSkillsBento: FC<SoftSkillsBentoProps> = ({ items }) => {
  const t = useTranslations("main.soft-skills");

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
            className="bg-gradient-to-br from-card via-card to-primary/[0.04] text-card-foreground border-border/80 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10 group relative flex h-full min-h-[210px] flex-col justify-between overflow-hidden rounded-3xl border p-6 transition-all duration-300 lg:p-7"
          >
            {/* Background Ambient Glow */}
            <div className="bg-primary/15 pointer-events-none absolute -bottom-10 -right-10 size-36 rounded-full blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:bg-primary/25" />

            {/* Background Decorative Icon Watermark */}
            <div className="text-primary pointer-events-none absolute -bottom-4 -right-4 size-28 opacity-[0.07] transition-all duration-500 group-hover:scale-110 group-hover:opacity-20">
              <SoftSkillBentoIcon icon={item.icon} className="size-full" />
            </div>

            <div className="z-10 space-y-3">
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary border-primary/20 flex shrink-0 size-11 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-primary/30">
                  <SoftSkillBentoIcon
                    icon={item.icon}
                    className="size-5"
                  />
                </span>
                <h3 className="text-foreground min-w-0 flex-1 leading-snug font-bold tracking-tight text-lg sm:text-xl group-hover:text-primary transition-colors wrap-break-word">
                  {item.title}
                </h3>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                {item.description}
              </p>
            </div>

            {/* Bottom Accent Row */}
            <div className="z-10 mt-5 flex items-center justify-between border-t border-border/50 pt-3">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary/60 group-hover:bg-primary group-hover:scale-125 transition-all duration-300" />
                <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  {t("badge")}
                </span>
              </div>
              <div className="bg-primary/10 text-primary size-6 rounded-full flex items-center justify-center text-[10px] font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                ✓
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );

};

export default SoftSkillsBento;
