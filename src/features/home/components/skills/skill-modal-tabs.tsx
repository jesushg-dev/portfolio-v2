"use client";

import { useState, type ReactNode } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export interface SkillModalTab {
  id: string;
  label: string;
  count: number;
  content: ReactNode;
}

interface SkillModalTabsProps {
  tabs: SkillModalTab[];
}

const pillTransition = {
  type: "tween" as const,
  duration: 0.28,
  ease: [0.4, 0, 0.2, 1] as const,
};

const contentTransition = {
  type: "tween" as const,
  duration: 0.22,
  ease: [0.4, 0, 0.2, 1] as const,
};

export function SkillModalTabs({ tabs }: SkillModalTabsProps) {
  const [activeId, setActiveId] = useState(() => tabs[0]?.id ?? "");
  const [direction, setDirection] = useState(0);

  if (tabs.length === 0) return null;

  const activeIndex = tabs.findIndex((tab) => tab.id === activeId);
  const activeTab = tabs[activeIndex >= 0 ? activeIndex : 0] ?? tabs[0];

  const handleTabChange = (nextId: string) => {
    const nextIndex = tabs.findIndex((tab) => tab.id === nextId);
    const currentIndex = tabs.findIndex((tab) => tab.id === activeId);
    setDirection(
      nextIndex > currentIndex ? 1 : nextIndex < currentIndex ? -1 : 0,
    );
    setActiveId(nextId);
  };

  if (tabs.length === 1) {
    const tab = tabs[0];
    if (!tab) return null;

    return (
      <div className="mt-6">
        <SectionLabel label={tab.label} count={tab.count} />
        <div className="themed-scrollbar mt-3 max-h-52 overflow-y-auto pr-1">
          {tab.content}
        </div>
      </div>
    );
  }

  const slideX = direction * 24;

  return (
    <div className="mt-6">
      <div
        role="tablist"
        className="bg-background-100/80 flex flex-wrap gap-1 rounded-xl p-1"
      >
        {tabs.map((tab) => {
          const isActive = activeTab.id === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "relative rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-200",
                isActive
                  ? "text-primary-600"
                  : "text-primaryText-700 hover:text-primaryText-500",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="skill-modal-tab-pill"
                  className="bg-background-50 absolute inset-0 rounded-lg shadow-sm"
                  transition={{ layout: pillTransition }}
                />
              ) : null}
              <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] leading-none transition-colors duration-200",
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "bg-background-50 text-primaryText-700",
                  )}
                >
                  {tab.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeTab.id}
        role="tabpanel"
        initial={{ opacity: 0, x: slideX }}
        animate={{ opacity: 1, x: 0 }}
        transition={contentTransition}
        className="themed-scrollbar mt-3 max-h-52 overflow-y-auto pr-1"
      >
        {activeTab.content}
      </motion.div>
    </div>
  );
}

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <h3 className="bg-background-100/80 inline-flex items-center gap-1.5 rounded-xl px-3 py-2">
      <span className="text-primary-600 text-xs font-semibold">{label}</span>
      <span className="bg-primary-100 text-primary-700 rounded-full px-1.5 py-0.5 text-[10px] leading-none">
        {count}
      </span>
    </h3>
  );
}
