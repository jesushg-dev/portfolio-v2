import {
  CheckCircle,
  Eye,
  Handshake,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ProcessBenefitsGrid } from "@/features/process-pages/components/process-benefits-grid";
import { ProcessClosingCta } from "@/features/process-pages/components/process-closing-cta";
import { ProcessFaqSection } from "@/features/process-pages/components/process-faq-section";
import { ProcessHero } from "@/features/process-pages/components/process-hero";
import { ProcessPageNav } from "@/features/process-pages/components/process-page-nav";
import { ProcessPageShell } from "@/features/process-pages/components/process-section-header";
import { ProcessRolesSection } from "@/features/process-pages/components/process-roles-section";
import { ProcessStepsTimeline } from "@/features/process-pages/components/process-steps-timeline";
import {
  ProcessTerminalPanel,
  ProcessTestRunnerOutput,
} from "@/features/process-pages/components/process-terminal-panel";

export { generateMetadata } from "./metadata";

export default async function QaCollaborationPage() {
  const t = await getTranslations("main.qaCollaboration");

  return (
    <ProcessPageShell>
      <ProcessPageNav
        label={t("nav.label")}
        items={[
          { id: "why", label: t("nav.why") },
          { id: "process", label: t("nav.process") },
          { id: "roles", label: t("nav.roles") },
          { id: "faq", label: t("nav.faq") },
        ]}
      />

      <ProcessHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        titleHighlight={t("hero.titleHighlight")}
        description={t("hero.description")}
        primaryAction={{ label: t("hero.primaryCta"), href: "#process" }}
        secondaryAction={{ label: t("hero.secondaryCta"), href: "/schedule" }}
        scrollHint={t("hero.scrollHint")}
        visual={
          <ProcessTerminalPanel title={t("hero.terminal.title")}>
            <ProcessTestRunnerOutput
              cursorLabel={t("hero.terminal.cursor")}
              lines={[
                t("hero.terminal.line1"),
                t("hero.terminal.line2"),
                t("hero.terminal.line3"),
                t("hero.terminal.line4"),
                t("hero.terminal.line5"),
                t("hero.terminal.line6"),
                t("hero.terminal.line7"),
                t("hero.terminal.line8"),
                t("hero.terminal.ready"),
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
            icon: ShieldCheck,
            title: t("benefits.items.0.title"),
            description: t("benefits.items.0.description"),
          },
          {
            icon: Handshake,
            title: t("benefits.items.1.title"),
            description: t("benefits.items.1.description"),
          },
          {
            icon: CheckCircle,
            title: t("benefits.items.2.title"),
            description: t("benefits.items.2.description"),
          },
          {
            icon: Target,
            title: t("benefits.items.3.title"),
            description: t("benefits.items.3.description"),
          },
          {
            icon: Eye,
            title: t("benefits.items.4.title"),
            description: t("benefits.items.4.description"),
          },
          {
            icon: Users,
            title: t("benefits.items.5.title"),
            description: t("benefits.items.5.description"),
          },
        ]}
      />

      <ProcessStepsTimeline
        eyebrow={t("steps.eyebrow")}
        title={t("steps.title")}
        steps={[
          {
            number: "01",
            title: t("steps.items.0.title"),
            description: t("steps.items.0.description"),
          },
          {
            number: "02",
            title: t("steps.items.1.title"),
            description: t("steps.items.1.description"),
          },
          {
            number: "03",
            title: t("steps.items.2.title"),
            description: t("steps.items.2.description"),
          },
          {
            number: "04",
            title: t("steps.items.3.title"),
            description: t("steps.items.3.description"),
          },
          {
            number: "05",
            title: t("steps.items.4.title"),
            description: t("steps.items.4.description"),
          },
          {
            number: "06",
            title: t("steps.items.5.title"),
            description: t("steps.items.5.description"),
          },
        ]}
      />

      <ProcessRolesSection
        eyebrow={t("roles.eyebrow")}
        title={t("roles.title")}
        description={t("roles.description")}
        myRolesLabel={t("roles.myRolesLabel")}
        myRoles={[t("roles.myRoles.0"), t("roles.myRoles.1")]}
        ecosystemRoles={[
          t("roles.ecosystem.0"),
          t("roles.ecosystem.1"),
          t("roles.ecosystem.2"),
          t("roles.ecosystem.3"),
        ]}
        testingLabel={t("roles.testingLabel")}
        testingTags={[t("roles.testing.0"), t("roles.testing.1")]}
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
