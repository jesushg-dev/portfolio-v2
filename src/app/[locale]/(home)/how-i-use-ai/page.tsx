import {
  CheckCircle,
  Eye,
  Layers,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ProcessBenefitsGrid } from "@/features/process-pages/components/process-benefits-grid";
import { ProcessClosingCta } from "@/features/process-pages/components/process-closing-cta";
import { ProcessFaqSection } from "@/features/process-pages/components/process-faq-section";
import { ProcessHero } from "@/features/process-pages/components/process-hero";
import { ProcessHeroWorkflowCycle } from "@/features/process-pages/components/process-hero-workflow-cycle";
import { ProcessPageNav } from "@/features/process-pages/components/process-page-nav";
import { ProcessPageShell } from "@/features/process-pages/components/process-section-header";
import { ProcessStepsAccordion } from "@/features/process-pages/components/process-steps-accordion";
import { ProcessToolkitSection } from "@/features/process-pages/components/process-toolkit-section";
import { ProcessTerminalPanel } from "@/features/process-pages/components/process-terminal-panel";

export { generateMetadata } from "./metadata";

export default async function HowIUseAiPage() {
  const t = await getTranslations("main.howIUseAi");

  return (
    <ProcessPageShell>
      <ProcessPageNav
        label={t("nav.label")}
        items={[
          { id: "why", label: t("nav.why") },
          { id: "workflow", label: t("nav.workflow") },
          { id: "stack", label: t("nav.stack") },
          { id: "faq", label: t("nav.faq") },
        ]}
      />

      <ProcessHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        titleHighlight={t("hero.titleHighlight")}
        description={t("hero.description")}
        primaryAction={{ label: t("hero.primaryCta"), href: "#workflow" }}
        secondaryAction={{ label: t("hero.secondaryCta"), href: "/schedule" }}
        scrollHint={t("hero.scrollHint")}
        visual={
          <ProcessTerminalPanel
            title={t("hero.terminal.title")}
            badge={
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
                {t("hero.workflow.live")}
              </span>
            }
          >
            <ProcessHeroWorkflowCycle
              title={t("hero.workflow.title")}
              steps={[
                { label: t("hero.workflow.steps.0") },
                { label: t("hero.workflow.steps.1") },
                { label: t("hero.workflow.steps.2") },
                { label: t("hero.workflow.steps.3") },
                { label: t("hero.workflow.steps.4") },
                { label: t("hero.workflow.steps.5") },
              ]}
            />
          </ProcessTerminalPanel>
        }
      />

      <ProcessBenefitsGrid
        eyebrow={t("benefits.eyebrow")}
        title={t("benefits.title")}
        items={[
          {
            icon: Zap,
            title: t("benefits.items.0.title"),
            description: t("benefits.items.0.description"),
          },
          {
            icon: Layers,
            title: t("benefits.items.1.title"),
            description: t("benefits.items.1.description"),
          },
          {
            icon: Eye,
            title: t("benefits.items.2.title"),
            description: t("benefits.items.2.description"),
          },
          {
            icon: ShieldCheck,
            title: t("benefits.items.3.title"),
            description: t("benefits.items.3.description"),
          },
          {
            icon: Target,
            title: t("benefits.items.4.title"),
            description: t("benefits.items.4.description"),
          },
          {
            icon: CheckCircle,
            title: t("benefits.items.5.title"),
            description: t("benefits.items.5.description"),
          },
        ]}
      />

      <ProcessStepsAccordion
        eyebrow={t("steps.eyebrow")}
        title={t("steps.title")}
        description={t("steps.description")}
        inPracticeLabel={t("steps.inPractice")}
        steps={[
          {
            number: "01",
            title: t("steps.items.0.title"),
            description: t("steps.items.0.description"),
            detail: t("steps.items.0.detail"),
            tools: t("steps.items.0.tools"),
          },
          {
            number: "02",
            title: t("steps.items.1.title"),
            description: t("steps.items.1.description"),
            detail: t("steps.items.1.detail"),
            tools: t("steps.items.1.tools"),
          },
          {
            number: "03",
            title: t("steps.items.2.title"),
            description: t("steps.items.2.description"),
            detail: t("steps.items.2.detail"),
            tools: t("steps.items.2.tools"),
          },
          {
            number: "04",
            title: t("steps.items.3.title"),
            description: t("steps.items.3.description"),
            detail: t("steps.items.3.detail"),
            tools: t("steps.items.3.tools"),
          },
          {
            number: "05",
            title: t("steps.items.4.title"),
            description: t("steps.items.4.description"),
            detail: t("steps.items.4.detail"),
            tools: t("steps.items.4.tools"),
          },
          {
            number: "06",
            title: t("steps.items.5.title"),
            description: t("steps.items.5.description"),
            detail: t("steps.items.5.detail"),
            tools: t("steps.items.5.tools"),
          },
        ]}
      />

      <ProcessToolkitSection
        eyebrow={t("toolkit.eyebrow")}
        title={t("toolkit.title")}
        description={t("toolkit.description")}
        footnote={t("toolkit.footnote")}
        tools={[
          {
            id: t("toolkit.items.0.id"),
            name: t("toolkit.items.0.name"),
            initials: t("toolkit.items.0.initials"),
            description: t("toolkit.items.0.description"),
          },
          {
            id: t("toolkit.items.1.id"),
            name: t("toolkit.items.1.name"),
            initials: t("toolkit.items.1.initials"),
            description: t("toolkit.items.1.description"),
          },
          {
            id: t("toolkit.items.2.id"),
            name: t("toolkit.items.2.name"),
            initials: t("toolkit.items.2.initials"),
            description: t("toolkit.items.2.description"),
          },
          {
            id: t("toolkit.items.3.id"),
            name: t("toolkit.items.3.name"),
            initials: t("toolkit.items.3.initials"),
            description: t("toolkit.items.3.description"),
          },
          {
            id: t("toolkit.items.4.id"),
            name: t("toolkit.items.4.name"),
            initials: t("toolkit.items.4.initials"),
            description: t("toolkit.items.4.description"),
          },
          {
            id: t("toolkit.items.5.id"),
            name: t("toolkit.items.5.name"),
            initials: t("toolkit.items.5.initials"),
            description: t("toolkit.items.5.description"),
          },
          {
            id: t("toolkit.items.6.id"),
            name: t("toolkit.items.6.name"),
            initials: t("toolkit.items.6.initials"),
            description: t("toolkit.items.6.description"),
          },
        ]}
      />

      <ProcessFaqSection
        eyebrow={t("faq.eyebrow")}
        title={t("faq.title")}
        items={[
          {
            question: t("faq.items.0.question"),
            answer: t("faq.items.0.answer"),
          },
          {
            question: t("faq.items.1.question"),
            answer: t("faq.items.1.answer"),
          },
          {
            question: t("faq.items.2.question"),
            answer: t("faq.items.2.answer"),
          },
          {
            question: t("faq.items.3.question"),
            answer: t("faq.items.3.answer"),
          },
          {
            question: t("faq.items.4.question"),
            answer: t("faq.items.4.answer"),
          },
        ]}
      />

      <ProcessClosingCta
        title={t("cta.title")}
        description={t("cta.description")}
        ctaLabel={t("cta.button")}
      />
    </ProcessPageShell>
  );
}
