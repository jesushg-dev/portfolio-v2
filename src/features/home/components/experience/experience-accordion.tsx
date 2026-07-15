"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface ExperienceItem {
  id: string;
  company: string;
  current: boolean;
  role: string;
  dates: string;
  responsibilities: string[];
}

function Row({
  exp,
  isOpen,
  onToggle,
  isLast,
}: {
  exp: ExperienceItem;
  isOpen: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  const panelId = `panel-${exp.company.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="relative pl-10">
      {/* Vertical connecting line */}
      {!isLast && (
        <span
          className="bg-border absolute top-9 bottom-0 left-[7px] w-px"
          aria-hidden="true"
        />
      )}

      {/* Timeline dot — primary for current, muted for past */}
      <span
        className={`ring-background absolute top-4 left-0 h-3.5 w-3.5 rounded-full ring-4 transition-colors ${
          exp.current ? "bg-primary" : "bg-muted-foreground/40"
        }`}
        aria-hidden="true"
      />

      {/* Accordion header */}
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="hover:bg-accent focus-visible:ring-ring flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg py-3 pr-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span className="text-foreground font-semibold">{exp.role}</span>
          <span className="text-primary font-semibold whitespace-nowrap">
            @ {exp.company}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="text-muted-foreground hidden text-sm sm:inline">
            {exp.dates}
          </span>
          <ChevronDownIcon
            className={`text-muted-foreground h-4 w-4 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {/* Dates on mobile */}
      <span className="text-muted-foreground -mt-1 mb-1 block text-xs sm:hidden">
        {exp.dates}
      </span>

      {/* Collapsible bullet list */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <ul className="space-y-2 pt-1 pr-2 pb-5">
              {exp.responsibilities.map((bullet, i) => (
                <li key={`${exp.id}-${i}`} className="flex items-start gap-2.5">
                  <CheckIcon className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  <span className="text-muted-foreground text-sm leading-relaxed">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props {
  experiences: ExperienceItem[];
  leadershipTitle: string;
  leadershipDescription: string;
  hasLeadership: boolean;
  viewAllLabel: string;
}

export function ExperienceAccordion({
  experiences,
  leadershipTitle,
  leadershipDescription,
  hasLeadership,
  viewAllLabel,
}: Props) {
  const [openIndex, setOpenIndex] = useState(0);
  const t = useTranslations("main.experience");
  const showingRecentLabel = t("showingRecent");

  return (
    <div className="flex flex-col gap-6">
      {/* Timeline accordion card */}
      <div className="bg-card border-border rounded-2xl border p-6 shadow-sm sm:p-8">
        {experiences.map((exp, i) => (
          <Row
            key={exp.id}
            exp={exp}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            isLast={i === experiences.length - 1}
          />
        ))}
      </div>

      {/* Leadership callout */}
      {hasLeadership && (
        <div className="border-primary/30 bg-primary/5 rounded-xl border p-5">
          <p className="text-primary text-sm font-semibold">
            {leadershipTitle}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {leadershipDescription}
          </p>
        </div>
      )}

      {/* Full CV link */}
      <div className="text-center flex flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground text-sm">
          {showingRecentLabel}
        </p>
        <Link
          href="/curriculum-vitae"
          className="text-primary hover:text-primary/80 text-sm font-semibold transition-colors"
        >
          {viewAllLabel} →
        </Link>
      </div>
    </div>
  );
}
