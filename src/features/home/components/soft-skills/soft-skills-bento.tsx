"use client";

import { createElement, type FC } from "react";
import { motion, type Variants, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import { resolveSoftSkillIcon } from "@/features/soft-skills/lib/soft-skill-icons";
import { cn } from "@/lib/utils";

export interface SoftSkillBentoItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
  featured: boolean;
}

export interface SoftSkillMetric {
  value: string;
  label?: string;
}

interface SoftSkillsBentoProps {
  items: SoftSkillBentoItem[];
  metrics?: SoftSkillMetric[];
}

const SoftSkillBentoIcon: FC<{ icon: string; className?: string }> = ({
  icon,
  className,
}) =>
  createElement(resolveSoftSkillIcon(icon), {
    className,
    "aria-hidden": true,
  });

const SoftSkillsBento: FC<SoftSkillsBentoProps> = ({ items, metrics }) => {
  const t = useTranslations("main.soft-skills");
  const shouldReduceMotion = useReducedMotion();

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
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const headerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  if (items.length === 0) return null;

  return (
    <div className="grid w-full items-start gap-12 lg:grid-cols-[5fr_7fr] lg:gap-14">
      {/* Sticky Left Column: Eyebrow, Title, Narrative & Impact Metrics */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <motion.div
          variants={headerVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "-80px" }}
        >
          <p className="text-primary text-base font-semibold tracking-wide sm:text-lg">
            {t("subtitle")}
          </p>
          <h2 className="text-foreground mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            {t("title")}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md text-base leading-relaxed sm:text-lg">
            {t("description")}
          </p>

          {/* Quantifiable Impact Metrics from DB */}
          {metrics && metrics.length > 0 ? (
            <dl className="border-border mt-10 grid grid-cols-2 border-t">
              {metrics.map((m, idx) => {
                const isLeftCol = idx % 2 === 0;
                const isNotLastRow =
                  idx < metrics.length - (metrics.length % 2 === 0 ? 2 : 1);

                return (
                  <div
                    key={m.label ?? idx}
                    className={cn(
                      "py-6",
                      isLeftCol ? "border-border border-r pr-4" : "pl-6",
                      isNotLastRow ? "border-border border-b" : "",
                    )}
                  >
                    <dt className="text-primary font-display text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
                      {m.value}
                    </dt>
                    <dd className="text-muted-foreground mt-1 text-sm font-medium">
                      {m.label}
                    </dd>
                  </div>
                );
              })}
            </dl>
          ) : null}
        </motion.div>
      </div>

      {/* Right Column: Interactive Leadership & Soft Skills Timeline */}
      <motion.ol
        variants={containerVariants}
        initial={shouldReduceMotion ? false : "hidden"}
        whileInView={shouldReduceMotion ? undefined : "visible"}
        viewport={{ once: true, margin: "-80px" }}
        className="before:bg-border/20 relative space-y-2.5 before:absolute before:top-[2.375rem] before:bottom-[2.375rem] before:left-[2.375rem] before:w-px before:-translate-x-1/2 sm:before:top-[2.625rem] sm:before:bottom-[2.625rem] sm:before:left-[2.625rem]"
      >
        {items.map((item) => (
          <motion.li
            key={item.id}
            variants={itemVariants}
            className="group hover:bg-card/90 relative flex gap-4.5 rounded-3xl p-4 transition-all duration-300 hover:shadow-[0_14px_34px_-20px_rgba(30,64,175,0.25)] sm:p-5"
          >
            {/* Icon Tile */}
            <span className="border-primary/15 bg-primary/8 text-primary group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-primary/30 relative z-10 flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-xs transition-all duration-300 group-hover:shadow-md">
              <SoftSkillBentoIcon icon={item.icon} className="size-5" />
            </span>

            {/* Content & Badge */}
            <div className="min-w-0 flex-1">
              <h3 className="text-foreground group-hover:text-primary text-lg font-bold tracking-tight transition-colors">
                {item.title}
              </h3>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed sm:text-base">
                {item.description}
              </p>
              {item.badge ? (
                <span className="bg-primary/10 text-primary group-hover:bg-primary/15 mt-3 inline-block shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-colors">
                  {item.badge}
                </span>
              ) : null}
            </div>
          </motion.li>
        ))}
      </motion.ol>
    </div>
  );
};

export default SoftSkillsBento;
