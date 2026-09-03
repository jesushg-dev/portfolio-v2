"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Code2,
  Database,
  Globe,
  Layers,
  Server,
  ShieldCheck,
  Smartphone,
  Terminal,
  Zap,
} from "lucide-react";

const ICON_MAP: Record<string, FC<{ className?: string }>> = {
  code: Code2,
  server: Server,
  smartphone: Smartphone,
  terminal: Terminal,
  shield: ShieldCheck,
  database: Database,
  zap: Zap,
  globe: Globe,
  layers: Layers,
};

export interface ServiceItem {
  id: string;
  type: string;
  image: string;
  icon?: string;
  statsValue?: string;
  featured?: boolean;
  order?: number;
  title: string;
  description: string;
  badge?: string;
  statsLabel?: string;
}

interface ServicesBentoProps {
  dbServices?: ServiceItem[];
}

export const ServicesBento: FC<ServicesBentoProps> = ({ dbServices = [] }) => {
  const t = useTranslations("main.services");

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (dbServices.length === 0) {
    return null;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
    >
      {dbServices.map((service) => {
        const IconComponent = ICON_MAP[service.icon ?? "code"] ?? Code2;
        const isFeatured = service.featured;

        return (
          <motion.div
            key={service.id}
            variants={itemVariants}
            className={cn(
              "from-card via-card to-primary/[0.04] text-card-foreground border-border/80 hover:border-primary/60 group hover:shadow-primary/5 relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-3xl border bg-gradient-to-br p-6 transition-all duration-300 hover:shadow-2xl lg:p-7",
              isFeatured
                ? "sm:col-span-2 lg:col-span-2"
                : "sm:col-span-1 lg:col-span-1",
            )}
          >
            {/* Background Glow */}
            <div className="bg-primary/10 group-hover:bg-primary/20 pointer-events-none absolute -right-10 -bottom-10 size-36 rounded-full blur-2xl transition-all duration-500 group-hover:scale-125" />

            <div className="z-10 max-w-lg space-y-2">
              {service.badge ? (
                <div className="bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide">
                  <IconComponent className="size-3.5" />
                  <span>{service.badge}</span>
                </div>
              ) : null}
              <h3 className="text-foreground text-xl font-bold tracking-tight md:text-2xl">
                {service.title}
              </h3>
              <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed sm:text-sm">
                {service.description}
              </p>
            </div>

            {service.statsValue || service.statsLabel ? (
              <div className="border-border/50 z-10 mt-4 flex items-center justify-between border-t pt-3">
                <div>
                  {service.statsValue ? (
                    <p className="text-primary text-lg font-extrabold md:text-xl">
                      {service.statsValue}
                    </p>
                  ) : null}
                  {service.statsLabel ? (
                    <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                      {service.statsLabel}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </motion.div>
        );
      })}

      {/* Enhanced Contact Us Card */}
      <motion.div
        variants={itemVariants}
        className="from-card via-card to-primary/15 text-card-foreground border-border/80 hover:border-primary/80 group hover:shadow-primary/15 relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-3xl border bg-gradient-to-br p-6 transition-all duration-300 hover:shadow-2xl sm:col-span-2 lg:col-span-2 lg:p-7"
      >
        {/* Ambient Glow */}
        <div className="bg-primary/20 group-hover:bg-primary/30 pointer-events-none absolute -top-16 -right-16 size-48 rounded-full blur-3xl transition-all duration-500 group-hover:scale-125" />

        {/* Decorative Message Bubble Illustration */}
        <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 opacity-15 transition-all duration-500 group-hover:scale-110 group-hover:opacity-30">
          <svg
            className="text-primary size-36"
            viewBox="0 0 100 100"
            fill="none"
          >
            <path
              d="M20 30C20 24.4772 24.4772 20 30 20H70C75.5228 20 80 24.4772 80 30V60C80 65.5228 75.5228 70 70 70H45L30 80V70H30C24.4772 70 20 65.5228 20 60V30Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />
            <circle cx="40" cy="45" r="4" fill="currentColor" />
            <circle cx="50" cy="45" r="4" fill="currentColor" />
            <circle cx="60" cy="45" r="4" fill="currentColor" />
          </svg>
        </div>

        <Link
          href="#contact"
          className="z-10 flex h-full flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide">
              <Zap className="size-3.5" />
              <span>{t("items.contact.subtitle")}</span>
            </div>
            <h3 className="text-foreground group-hover:text-primary max-w-sm text-2xl font-extrabold tracking-tight transition-colors md:text-3xl">
              {t("items.contact.title")}
            </h3>
          </div>

          <div className="border-border/60 mt-6 flex items-center justify-between border-t pt-4">
            <span className="text-foreground group-hover:text-primary text-lg font-bold transition-colors sm:text-xl">
              {t("items.contact.cta")}
            </span>
            <div className="bg-primary text-primary-foreground group-hover:bg-primary group-hover:shadow-primary/30 flex size-10 items-center justify-center rounded-full shadow-md transition-all duration-300 group-hover:scale-110">
              <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
};
