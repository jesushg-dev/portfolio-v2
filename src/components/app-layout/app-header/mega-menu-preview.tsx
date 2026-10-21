"use client";

import type { FC } from "react";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "@/i18n/routing";
import type { ResolvedNavItem } from "./nav-item-resolver";

interface MegaMenuPreviewProps {
  item: ResolvedNavItem;
  groupEyebrow: string;
  onNavigate: () => void;
}

export const MegaMenuPreview: FC<MegaMenuPreviewProps> = ({
  item,
  groupEyebrow,
  onNavigate,
}) => {
  return (
    <div className="from-primary/5 via-card to-card relative flex min-h-80 flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br p-6 sm:p-7">
      <div
        aria-hidden="true"
        className="bg-primary/10 pointer-events-none absolute -top-16 -right-16 size-64 rounded-full blur-3xl"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative z-10 flex flex-1 flex-col justify-between"
        >
          <div className="space-y-3">
            <span className="text-primary/80 text-[0.6875rem] font-semibold tracking-wider uppercase">
              {groupEyebrow}
            </span>
            <h3 className="text-foreground max-w-[26ch] text-xl leading-snug font-bold tracking-tight sm:text-2xl">
              {item.headline}
            </h3>
            <p className="text-muted-foreground max-w-[50ch] text-sm leading-relaxed">
              {item.description}
            </p>

            {item.chips && item.chips.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {item.chips.map((chip) => (
                  <span
                    key={chip}
                    className="border-border/70 bg-card/80 text-foreground rounded-full border px-2.5 py-1 text-xs font-medium shadow-2xs backdrop-blur-xs"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="border-border/40 mt-6 flex items-center justify-between gap-4 border-t pt-5">
            {item.stat ? (
              <div className="flex items-baseline gap-2">
                <strong className="text-primary text-2xl font-bold tracking-tight">
                  {item.stat.value}
                </strong>
                <span className="text-muted-foreground text-xs">
                  {item.stat.label}
                </span>
              </div>
            ) : (
              <div />
            )}

            {!item.comingSoon ? (
              <Link
                href={item.href}
                onClick={onNavigate}
                className="group text-primary hover:text-primary/80 ml-auto inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
              >
                <span>{item.cta}</span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </Link>
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MegaMenuPreview;
