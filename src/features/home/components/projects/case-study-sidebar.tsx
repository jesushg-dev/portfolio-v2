"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import type { CaseStudyPageSection } from "./case-study-view.types";

export default function CaseStudySidebar({
  sections,
  activeSection: controlledActiveSection,
}: {
  sections: CaseStudyPageSection[];
  activeSection?: string;
}) {
  const t = useTranslations("main.portfolio.caseStudy");
  const [internalActiveSection, setInternalActiveSection] = useState("");
  const activeSection = controlledActiveSection ?? internalActiveSection;

  useEffect(() => {
    if (controlledActiveSection !== undefined) return;

    const sectionEls = sections
      .map((section) => document.getElementById(`s-${section.key}`))
      .filter((section): section is HTMLElement => Boolean(section));

    if (sectionEls.length === 0) return;

    const updateActiveSection = () => {
      const activationLine = window.innerHeight * 0.3;
      let currentSection = sectionEls[0];

      for (const section of sectionEls) {
        if (section.getBoundingClientRect().top > activationLine) break;
        currentSection = section;
      }

      setInternalActiveSection(currentSection?.id.slice(2) ?? "");
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [sections, controlledActiveSection]);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
        <p className="text-primary px-3 text-xs font-bold tracking-wider uppercase">
          {t("onThisPage")}
        </p>
        <nav className="mt-3 space-y-1" aria-label={t("sectionsNavigation")}>
          {sections.map((section, navIndex) => (
            <a
              key={section.key}
              href={`#s-${section.key}`}
              aria-current={
                activeSection === section.key ? "location" : undefined
              }
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${activeSection === section.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <span className="font-mono text-xs opacity-60">
                {String(navIndex + 1).padStart(2, "0")}
              </span>
              {section.navTitle}
            </a>
          ))}
        </nav>
        <div
          data-case-study-card
          className="b-card-glow bg-card border-border mt-8 rounded-3xl border p-5"
        >
          <p className="text-foreground leading-snug font-bold">
            {t("similarRole")}
          </p>
          <p className="text-muted-foreground mt-1.5 text-sm leading-6">
            {t("decisionsWalkthrough")}
          </p>
          <Link
            href={{ pathname: "/", hash: "#contact" }}
            className="text-primary mt-4 inline-flex items-center gap-2 text-sm font-bold"
          >
            {t("letsTalk")}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
