import { ProcessBenefitsGrid } from "@/features/process-pages/components/process-benefits-grid";
import { ProcessClosingCta } from "@/features/process-pages/components/process-closing-cta";
import { ProcessFaqSection } from "@/features/process-pages/components/process-faq-section";
import { ProcessHero } from "@/features/process-pages/components/process-hero";
import { ProcessHeroWorkflowCycle } from "@/features/process-pages/components/process-hero-workflow-cycle";
import { ProcessPageNav } from "@/features/process-pages/components/process-page-nav";
import { ProcessPageShell } from "@/features/process-pages/components/process-section-header";
import { ProcessRolesSection } from "@/features/process-pages/components/process-roles-section";
import { ProcessStepsAccordion } from "@/features/process-pages/components/process-steps-accordion";
import { ProcessStepsTimeline } from "@/features/process-pages/components/process-steps-timeline";
import { ProcessToolkitSection } from "@/features/process-pages/components/process-toolkit-section";
import {
  ProcessTerminalPanel,
  ProcessTestRunnerOutput,
} from "@/features/process-pages/components/process-terminal-panel";
import type {
  ProcessPageContent,
  ProcessPageWidget,
} from "@/features/process-pages/lib/process-page-content";
import { resolveProcessPageIcon } from "@/lib/process-pages/process-page-icons";
import type { ProcessPageTranslationFields } from "@/features/process-pages/lib/process-page-editor-dto";

export type ProcessPageViewModel = ProcessPageTranslationFields & {
  slug: string;
  template?: "WORKFLOW" | "QA";
  content: ProcessPageContent;
};

function HeroVisual({
  section,
}: {
  section: Extract<ProcessPageWidget, { type: "hero" }>;
}) {
  if (section.visual.kind === "workflowCycle") {
    return (
      <ProcessTerminalPanel
        title={section.visual.terminalTitle}
        badge={
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-200 motion-safe:animate-pulse" />
            {section.visual.live}
          </span>
        }
      >
        <ProcessHeroWorkflowCycle
          title={section.visual.title}
          steps={section.visual.steps.map((label) => ({ label }))}
        />
      </ProcessTerminalPanel>
    );
  }

  if (section.visual.kind === "testRunner") {
    return (
      <ProcessTerminalPanel title={section.visual.terminalTitle}>
        <ProcessTestRunnerOutput
          cursorLabel={section.visual.cursorLabel}
          lines={section.visual.lines}
        />
      </ProcessTerminalPanel>
    );
  }

  return null;
}

export function ProcessPageSection({
  section,
}: {
  section: ProcessPageWidget;
}) {
  switch (section.type) {
    case "nav":
      return <ProcessPageNav label={section.label} items={section.items} />;
    case "hero": {
      const visual =
        section.visual.kind === "none" ? undefined : (
          <HeroVisual section={section} />
        );
      return (
        <ProcessHero
          eyebrow={section.eyebrow}
          title={section.title}
          titleHighlight={section.titleHighlight}
          description={section.description}
          primaryAction={{
            label: section.primaryCta,
            href: section.primaryHref,
          }}
          secondaryAction={{
            label: section.secondaryCta,
            href: section.secondaryHref,
          }}
          scrollHint={section.scrollHint}
          visual={visual}
        />
      );
    }
    case "benefits":
      return (
        <ProcessBenefitsGrid
          id={section.anchorId}
          eyebrow={section.eyebrow}
          title={section.title}
          items={section.items.map((item) => ({
            icon: resolveProcessPageIcon(item.icon),
            title: item.title,
            description: item.description,
          }))}
        />
      );
    case "stepsAccordion":
      return (
        <ProcessStepsAccordion
          id={section.anchorId}
          eyebrow={section.eyebrow}
          title={section.title}
          description={section.description}
          inPracticeLabel={section.inPracticeLabel}
          steps={section.items}
        />
      );
    case "stepsTimeline":
      return (
        <ProcessStepsTimeline
          id={section.anchorId}
          eyebrow={section.eyebrow}
          title={section.title}
          description={section.description}
          steps={section.items}
        />
      );
    case "toolkit":
      return (
        <ProcessToolkitSection
          id={section.anchorId}
          eyebrow={section.eyebrow}
          title={section.title}
          description={section.description}
          footnote={section.footnote}
          tools={section.items}
        />
      );
    case "roles":
      return (
        <ProcessRolesSection
          id={section.anchorId}
          eyebrow={section.eyebrow}
          title={section.title}
          description={section.description}
          myRolesLabel={section.myRolesLabel}
          myRoles={section.myRoles}
          ecosystemRoles={section.ecosystemRoles}
          testingLabel={section.testingLabel}
          testingTags={section.testingTags}
        />
      );
    case "faq":
      return (
        <ProcessFaqSection
          id={section.anchorId}
          eyebrow={section.eyebrow}
          title={section.title}
          items={section.items}
        />
      );
    case "closingCta":
      return (
        <ProcessClosingCta
          title={section.title}
          description={section.description}
          ctaLabel={section.button}
        />
      );
  }
}

export function ProcessPageView({ page }: { page: ProcessPageViewModel }) {
  return (
    <ProcessPageShell>
      {page.content.sections.map((section) => (
        <ProcessPageSection key={section.id} section={section} />
      ))}
    </ProcessPageShell>
  );
}
