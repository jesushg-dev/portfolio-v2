"use client";

import { useFormContext } from "react-hook-form";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { cn } from "@/lib/utils";
import type { ProcessPageFormValues } from "@/features/process-pages/lib/process-page-editor-dto";
import type { ProcessPageWidget } from "@/features/process-pages/lib/process-page-content";
import {
  processEyebrowStyles,
  processInteractiveStyles,
} from "@/features/process-pages/components/process-page-styles";
import {
  ProcessTerminalPanel,
  ProcessTestRunnerOutput,
} from "@/features/process-pages/components/process-terminal-panel";
import { ProcessHeroWorkflowCycle } from "@/features/process-pages/components/process-hero-workflow-cycle";
import {
  AddBlockButton,
  CanvasIconPicker,
  CanvasStringChips,
  CanvasText,
} from "@/features/process-pages/components/admin/process-page-designer-fields";

type PathPrefix = `contentByLanguage.${string}.sections.${number}`;

function setAt<T>(items: T[], index: number, next: T): T[] {
  const copy = [...items];
  copy[index] = next;
  return copy;
}

export function ProcessPageDesignerWidget({
  langId,
  index,
  section,
}: {
  langId: string;
  index: number;
  section: ProcessPageWidget;
}) {
  const prefix: PathPrefix = `contentByLanguage.${langId}.sections.${index}`;

  switch (section.type) {
    case "nav":
      return <NavEditor prefix={prefix} section={section} />;
    case "hero":
      return <HeroEditor prefix={prefix} section={section} />;
    case "benefits":
      return <BenefitsEditor prefix={prefix} section={section} />;
    case "stepsAccordion":
      return <StepsAccordionEditor prefix={prefix} section={section} />;
    case "stepsTimeline":
      return <StepsTimelineEditor prefix={prefix} section={section} />;
    case "toolkit":
      return <ToolkitEditor prefix={prefix} section={section} />;
    case "roles":
      return <RolesEditor prefix={prefix} section={section} />;
    case "faq":
      return <FaqEditor prefix={prefix} section={section} />;
    case "closingCta":
      return <CtaEditor prefix={prefix} />;
  }
}

function NavEditor({
  prefix,
  section,
}: {
  prefix: PathPrefix;
  section: Extract<ProcessPageWidget, { type: "nav" }>;
}) {
  const t = useTranslations("admin.forms.processPage");
  const form = useFormContext<ProcessPageFormValues>();

  return (
    <div className="px-6 py-8">
      <div className="border-border bg-card mx-auto max-w-3xl rounded-2xl border p-6">
        <CanvasText
          name={`${prefix}.label`}
          placeholder={t("pageNavLabel")}
          className={cn(processEyebrowStyles, "mb-4 text-center")}
        />
        <Sortable
          value={section.items.map((item, itemIndex) => ({
            ...item,
            key: `${item.id}-${itemIndex}`,
          }))}
          getItemValue={(item) => item.key}
          onMove={({ activeIndex, overIndex }) => {
            const next = [...section.items];
            const [moved] = next.splice(activeIndex, 1);
            if (!moved) return;
            next.splice(overIndex, 0, moved);
            form.setValue(`${prefix}.items`, next);
          }}
        >
          <SortableContent asChild>
            <div className="flex flex-wrap justify-center gap-2">
              {section.items.map((item, itemIndex) => (
                <SortableItem
                  key={`${item.id}-${itemIndex}`}
                  value={`${item.id}-${itemIndex}`}
                >
                  <div className="border-border flex items-center gap-2 rounded-full border px-3 py-2">
                    <SortableItemHandle aria-label={t("dragToReorder")}>
                      <GripVertical className="text-muted-foreground size-3.5" />
                    </SortableItemHandle>
                    <input
                      value={item.id}
                      placeholder={t("navId")}
                      className="w-16 bg-transparent font-mono text-xs outline-none"
                      onChange={(event) =>
                        form.setValue(
                          `${prefix}.items`,
                          setAt(section.items, itemIndex, {
                            ...item,
                            id: event.target.value || "section",
                          }),
                        )
                      }
                    />
                    <input
                      value={item.label}
                      placeholder={t("navLabel")}
                      className="w-28 bg-transparent text-sm outline-none"
                      onChange={(event) =>
                        form.setValue(
                          `${prefix}.items`,
                          setAt(section.items, itemIndex, {
                            ...item,
                            label: event.target.value,
                          }),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={t("remove")}
                      onClick={() =>
                        form.setValue(
                          `${prefix}.items`,
                          section.items.filter((_, i) => i !== itemIndex),
                        )
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContent>
        </Sortable>
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              form.setValue(`${prefix}.items`, [
                ...section.items,
                { id: "section", label: "" },
              ])
            }
          >
            <Plus className="mr-1 size-3.5" />
            {t("addNavItem")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function HeroEditor({
  prefix,
  section,
}: {
  prefix: PathPrefix;
  section: Extract<ProcessPageWidget, { type: "hero" }>;
}) {
  const t = useTranslations("admin.forms.processPage");
  const form = useFormContext<ProcessPageFormValues>();
  const visual = section.visual;

  return (
    <section className="px-6 py-16">
      <div
        className={cn(
          "mx-auto grid max-w-6xl items-start gap-12",
          visual.kind !== "none" && "md:grid-cols-2",
        )}
      >
        <div>
          <CanvasText
            name={`${prefix}.eyebrow`}
            placeholder={t("heroEyebrow")}
            className={cn(processEyebrowStyles, "mb-6")}
          />
          <div className="mb-6 flex flex-col gap-1">
            <CanvasText
              name={`${prefix}.title`}
              placeholder={t("heroTitle")}
              className="text-foreground text-4xl font-extrabold tracking-tight md:text-5xl"
            />
            <CanvasText
              name={`${prefix}.titleHighlight`}
              placeholder={t("heroTitleHighlight")}
              className="text-primary-900 text-4xl font-extrabold tracking-tight md:text-5xl"
            />
          </div>
          <CanvasText
            name={`${prefix}.description`}
            multiline
            rows={3}
            placeholder={t("heroDescription")}
            className="text-foreground mb-8 max-w-xl text-lg"
          />
          <div className="mb-4 flex flex-wrap gap-4">
            <div
              className={cn(
                processInteractiveStyles,
                "bg-primary-900 text-primary-foreground gap-2 px-4",
              )}
            >
              <CanvasText
                name={`${prefix}.primaryCta`}
                placeholder={t("heroPrimaryCta")}
                className="text-primary-foreground w-36 text-center text-sm font-semibold"
              />
            </div>
            <div
              className={cn(
                processInteractiveStyles,
                "border-border bg-background border px-4",
              )}
            >
              <CanvasText
                name={`${prefix}.secondaryCta`}
                placeholder={t("heroSecondaryCta")}
                className="w-36 text-center text-sm font-semibold"
              />
            </div>
          </div>
          <CanvasText
            name={`${prefix}.primaryHref`}
            placeholder={t("primaryHref")}
            className="text-muted-foreground font-mono text-xs"
          />
          <CanvasText
            name={`${prefix}.secondaryHref`}
            placeholder={t("secondaryHref")}
            className="text-muted-foreground font-mono text-xs"
          />
          <CanvasText
            name={`${prefix}.scrollHint`}
            placeholder={t("heroScrollHint")}
            className="text-muted-foreground mt-2 text-sm"
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["none", t("visualNone")],
                ["workflowCycle", t("visualWorkflow")],
                ["testRunner", t("visualTestRunner")],
              ] as const
            ).map(([kind, label]) => (
              <Button
                key={kind}
                type="button"
                size="sm"
                variant={visual.kind === kind ? "default" : "outline"}
                onClick={() => {
                  if (kind === "none") {
                    form.setValue(`${prefix}.visual`, { kind: "none" });
                  } else if (kind === "workflowCycle") {
                    form.setValue(`${prefix}.visual`, {
                      kind: "workflowCycle",
                      terminalTitle:
                        visual.kind === "workflowCycle"
                          ? visual.terminalTitle
                          : "",
                      title:
                        visual.kind === "workflowCycle" ? visual.title : "",
                      live: visual.kind === "workflowCycle" ? visual.live : "",
                      steps:
                        visual.kind === "workflowCycle" ? visual.steps : [],
                    });
                  } else {
                    form.setValue(`${prefix}.visual`, {
                      kind: "testRunner",
                      terminalTitle:
                        visual.kind === "testRunner"
                          ? visual.terminalTitle
                          : "",
                      cursorLabel:
                        visual.kind === "testRunner" ? visual.cursorLabel : "",
                      lines: visual.kind === "testRunner" ? visual.lines : [],
                    });
                  }
                }}
              >
                {label}
              </Button>
            ))}
          </div>

          {visual.kind === "workflowCycle" ? (
            <ProcessTerminalPanel
              title=""
              badge={
                <CanvasText
                  name={`${prefix}.visual.live`}
                  placeholder={t("workflowLive")}
                  className="text-sm text-emerald-200"
                />
              }
            >
              <div className="mb-3 flex justify-end">
                <CanvasText
                  name={`${prefix}.visual.terminalTitle`}
                  placeholder={t("terminalTitle")}
                  className="text-right font-mono text-sm text-slate-100"
                />
              </div>
              <CanvasText
                name={`${prefix}.visual.title`}
                placeholder={t("workflowTitle")}
                className="mb-4 text-sm font-semibold tracking-widest text-slate-100 uppercase"
              />
              <ProcessHeroWorkflowCycle
                title={visual.title}
                steps={visual.steps.map((label) => ({ label }))}
              />
              <div className="mt-4">
                <CanvasStringChips
                  items={visual.steps}
                  placeholder={t("workflowSteps")}
                  addLabel={t("addChip")}
                  onChange={(steps) =>
                    form.setValue(`${prefix}.visual.steps`, steps)
                  }
                />
              </div>
            </ProcessTerminalPanel>
          ) : null}

          {visual.kind === "testRunner" ? (
            <ProcessTerminalPanel title="">
              <div className="mb-3 flex justify-end">
                <CanvasText
                  name={`${prefix}.visual.terminalTitle`}
                  placeholder={t("terminalTitle")}
                  className="text-right font-mono text-sm text-slate-100"
                />
              </div>
              <ProcessTestRunnerOutput
                cursorLabel={visual.cursorLabel}
                lines={visual.lines}
              />
              <div className="mt-4 space-y-2">
                <CanvasStringChips
                  items={visual.lines}
                  placeholder={t("testRunnerLines")}
                  addLabel={t("addChip")}
                  onChange={(lines) =>
                    form.setValue(`${prefix}.visual.lines`, lines)
                  }
                />
                <CanvasText
                  name={`${prefix}.visual.cursorLabel`}
                  placeholder={t("cursorLabel")}
                  className="font-mono text-sm text-slate-100"
                />
              </div>
            </ProcessTerminalPanel>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function BenefitsEditor({
  prefix,
  section,
}: {
  prefix: PathPrefix;
  section: Extract<ProcessPageWidget, { type: "benefits" }>;
}) {
  const t = useTranslations("admin.forms.processPage");
  const form = useFormContext<ProcessPageFormValues>();

  return (
    <section className="bg-muted/50 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <CanvasText
            name={`${prefix}.anchorId`}
            placeholder={t("navId")}
            className="text-muted-foreground mx-auto mb-2 max-w-xs font-mono text-xs"
          />
          <CanvasText
            name={`${prefix}.eyebrow`}
            placeholder={t("eyebrow")}
            className={cn(processEyebrowStyles, "text-center")}
          />
          <CanvasText
            name={`${prefix}.title`}
            placeholder={t("sectionTitle")}
            className="text-foreground mt-2 text-center text-3xl font-extrabold md:text-4xl"
          />
        </div>
        <Sortable
          value={section.items.map((item, itemIndex) => ({
            ...item,
            key: `benefit-${itemIndex}`,
          }))}
          getItemValue={(item) => item.key}
          orientation="mixed"
          onMove={({ activeIndex, overIndex }) => {
            const next = [...section.items];
            const [moved] = next.splice(activeIndex, 1);
            if (!moved) return;
            next.splice(overIndex, 0, moved);
            form.setValue(`${prefix}.items`, next);
          }}
        >
          <SortableContent asChild>
            <ul className="grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item, itemIndex) => (
                <SortableItem
                  key={`benefit-${itemIndex}`}
                  value={`benefit-${itemIndex}`}
                >
                  <li className="bg-card ring-border/60 relative rounded-2xl p-6 shadow-sm ring-1">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <CanvasIconPicker
                        name={`${prefix}.items.${itemIndex}.icon`}
                      />
                      <div className="flex">
                        <SortableItemHandle aria-label={t("dragToReorder")}>
                          <GripVertical className="text-muted-foreground size-4" />
                        </SortableItemHandle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={t("remove")}
                          onClick={() =>
                            form.setValue(
                              `${prefix}.items`,
                              section.items.filter((_, i) => i !== itemIndex),
                            )
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <CanvasText
                      name={`${prefix}.items.${itemIndex}.title`}
                      placeholder={t("title")}
                      className="text-foreground mb-2 text-lg font-bold"
                    />
                    <CanvasText
                      name={`${prefix}.items.${itemIndex}.description`}
                      multiline
                      placeholder={t("description")}
                      className="text-muted-foreground text-sm"
                    />
                  </li>
                </SortableItem>
              ))}
            </ul>
          </SortableContent>
        </Sortable>
        <div className="mt-6">
          <AddBlockButton
            label={t("addBenefit")}
            onClick={() =>
              form.setValue(`${prefix}.items`, [
                ...section.items,
                { icon: "Zap", title: "", description: "" },
              ])
            }
          />
        </div>
      </div>
    </section>
  );
}

function StepsAccordionEditor({
  prefix,
  section,
}: {
  prefix: PathPrefix;
  section: Extract<ProcessPageWidget, { type: "stepsAccordion" }>;
}) {
  const t = useTranslations("admin.forms.processPage");
  const form = useFormContext<ProcessPageFormValues>();

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <HeaderFields prefix={prefix} />
        <CanvasText
          name={`${prefix}.description`}
          multiline
          placeholder={t("description")}
          className="text-muted-foreground mb-8 text-center text-sm"
        />
        <CanvasText
          name={`${prefix}.inPracticeLabel`}
          placeholder={t("inPracticeLabel")}
          className={cn(processEyebrowStyles, "mb-6 text-center")}
        />
        <StepList
          prefix={prefix}
          items={section.items}
          showDetail
          onChange={(items) => form.setValue(`${prefix}.items`, items)}
        />
      </div>
    </section>
  );
}

function StepsTimelineEditor({
  prefix,
  section,
}: {
  prefix: PathPrefix;
  section: Extract<ProcessPageWidget, { type: "stepsTimeline" }>;
}) {
  const form = useFormContext<ProcessPageFormValues>();

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <HeaderFields prefix={prefix} />
        <StepList
          prefix={prefix}
          items={section.items}
          onChange={(items) => form.setValue(`${prefix}.items`, items)}
        />
      </div>
    </section>
  );
}

function StepList({
  prefix,
  items,
  showDetail = false,
  onChange,
}: {
  prefix: PathPrefix;
  items: Extract<ProcessPageWidget, { type: "stepsAccordion" }>["items"];
  showDetail?: boolean;
  onChange: (
    items: Extract<ProcessPageWidget, { type: "stepsAccordion" }>["items"],
  ) => void;
}) {
  const t = useTranslations("admin.forms.processPage");

  return (
    <>
      <Sortable
        value={items.map((item, itemIndex) => ({
          ...item,
          key: `step-${itemIndex}`,
        }))}
        getItemValue={(item) => item.key}
        onMove={({ activeIndex, overIndex }) => {
          const next = [...items];
          const [moved] = next.splice(activeIndex, 1);
          if (!moved) return;
          next.splice(overIndex, 0, moved);
          onChange(next);
        }}
      >
        <SortableContent asChild>
          <div className="space-y-6">
            {items.map((item, itemIndex) => (
              <SortableItem
                key={`step-${itemIndex}`}
                value={`step-${itemIndex}`}
              >
                <div className="flex gap-4">
                  <SortableItemHandle
                    aria-label={t("dragToReorder")}
                    className="mt-2"
                  >
                    <GripVertical className="text-muted-foreground size-4" />
                  </SortableItemHandle>
                  <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    <CanvasText
                      name={`${prefix}.items.${itemIndex}.number`}
                      placeholder={t("stepNumber")}
                      className="text-primary-foreground w-8 text-center text-sm font-bold"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CanvasText
                      name={`${prefix}.items.${itemIndex}.title`}
                      placeholder={t("title")}
                      className="text-foreground text-lg font-semibold"
                    />
                    <CanvasText
                      name={`${prefix}.items.${itemIndex}.description`}
                      multiline
                      placeholder={t("description")}
                      className="text-muted-foreground text-sm"
                    />
                    {showDetail ? (
                      <>
                        <CanvasText
                          name={`${prefix}.items.${itemIndex}.detail`}
                          multiline
                          placeholder={t("stepDetail")}
                          className="text-muted-foreground mt-2 text-sm"
                        />
                        <CanvasText
                          name={`${prefix}.items.${itemIndex}.tools`}
                          placeholder={t("stepTools")}
                          className="text-muted-foreground mt-1 text-sm"
                        />
                      </>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("remove")}
                    onClick={() =>
                      onChange(items.filter((_, i) => i !== itemIndex))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContent>
      </Sortable>
      <div className="mt-6">
        <AddBlockButton
          label={t("addStep")}
          onClick={() =>
            onChange([
              ...items,
              {
                number: String(items.length + 1).padStart(2, "0"),
                title: "",
                description: "",
                detail: "",
                tools: "",
              },
            ])
          }
        />
      </div>
    </>
  );
}

function ToolkitEditor({
  prefix,
  section,
}: {
  prefix: PathPrefix;
  section: Extract<ProcessPageWidget, { type: "toolkit" }>;
}) {
  const t = useTranslations("admin.forms.processPage");
  const form = useFormContext<ProcessPageFormValues>();

  return (
    <section className="bg-muted/50 px-6 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <HeaderFields prefix={prefix} />
        <CanvasText
          name={`${prefix}.description`}
          multiline
          placeholder={t("description")}
          className="text-muted-foreground mb-8 text-sm"
        />
        <Sortable
          value={section.items.map((item, itemIndex) => ({
            ...item,
            key: item.id || `tool-${itemIndex}`,
          }))}
          getItemValue={(item) => item.key}
          orientation="mixed"
          onMove={({ activeIndex, overIndex }) => {
            const next = [...section.items];
            const [moved] = next.splice(activeIndex, 1);
            if (!moved) return;
            next.splice(overIndex, 0, moved);
            form.setValue(`${prefix}.items`, next);
          }}
        >
          <SortableContent asChild>
            <div className="flex flex-wrap justify-center gap-3">
              {section.items.map((item, itemIndex) => (
                <SortableItem
                  key={item.id || `tool-${itemIndex}`}
                  value={item.id || `tool-${itemIndex}`}
                >
                  <div className="bg-card border-border w-64 rounded-2xl border p-4 text-left">
                    <div className="mb-2 flex justify-between">
                      <SortableItemHandle aria-label={t("dragToReorder")}>
                        <GripVertical className="text-muted-foreground size-4" />
                      </SortableItemHandle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={t("remove")}
                        onClick={() =>
                          form.setValue(
                            `${prefix}.items`,
                            section.items.filter((_, i) => i !== itemIndex),
                          )
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <CanvasText
                      name={`${prefix}.items.${itemIndex}.initials`}
                      placeholder={t("toolInitials")}
                      className="text-primary mb-1 text-sm font-bold"
                    />
                    <CanvasText
                      name={`${prefix}.items.${itemIndex}.name`}
                      placeholder={t("toolName")}
                      className="text-foreground font-semibold"
                    />
                    <CanvasText
                      name={`${prefix}.items.${itemIndex}.description`}
                      multiline
                      placeholder={t("description")}
                      className="text-muted-foreground text-sm"
                    />
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContent>
        </Sortable>
        <div className="mt-6">
          <AddBlockButton
            label={t("addTool")}
            onClick={() =>
              form.setValue(`${prefix}.items`, [
                ...section.items,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  initials: "",
                  description: "",
                },
              ])
            }
          />
        </div>
        <CanvasText
          name={`${prefix}.footnote`}
          placeholder={t("toolkitFootnote")}
          className="text-muted-foreground mt-6 text-sm"
        />
      </div>
    </section>
  );
}

function RolesEditor({
  prefix,
  section,
}: {
  prefix: PathPrefix;
  section: Extract<ProcessPageWidget, { type: "roles" }>;
}) {
  const t = useTranslations("admin.forms.processPage");
  const form = useFormContext<ProcessPageFormValues>();

  return (
    <section className="bg-muted/50 px-6 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <HeaderFields prefix={prefix} />
        <CanvasText
          name={`${prefix}.description`}
          multiline
          placeholder={t("description")}
          className="text-muted-foreground mb-8 text-sm"
        />
        <CanvasText
          name={`${prefix}.myRolesLabel`}
          placeholder={t("myRolesLabel")}
          className="mb-3 text-sm font-semibold"
        />
        <CanvasStringChips
          items={section.myRoles}
          placeholder={t("myRoles")}
          addLabel={t("addChip")}
          onChange={(myRoles) => form.setValue(`${prefix}.myRoles`, myRoles)}
        />
        <p className="text-muted-foreground mt-6 mb-3 text-sm">
          {t("ecosystemRoles")}
        </p>
        <CanvasStringChips
          items={section.ecosystemRoles}
          placeholder={t("ecosystemRoles")}
          addLabel={t("addChip")}
          onChange={(ecosystemRoles) =>
            form.setValue(`${prefix}.ecosystemRoles`, ecosystemRoles)
          }
        />
        <CanvasText
          name={`${prefix}.testingLabel`}
          placeholder={t("testingLabel")}
          className="text-muted-foreground mt-8 mb-3 text-sm font-semibold tracking-widest uppercase"
        />
        <CanvasStringChips
          items={section.testingTags}
          placeholder={t("testingTags")}
          addLabel={t("addChip")}
          onChange={(testingTags) =>
            form.setValue(`${prefix}.testingTags`, testingTags)
          }
        />
      </div>
    </section>
  );
}

function FaqEditor({
  prefix,
  section,
}: {
  prefix: PathPrefix;
  section: Extract<ProcessPageWidget, { type: "faq" }>;
}) {
  const t = useTranslations("admin.forms.processPage");
  const form = useFormContext<ProcessPageFormValues>();

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <HeaderFields prefix={prefix} />
        <Sortable
          value={section.items.map((item, itemIndex) => ({
            ...item,
            key: `faq-${itemIndex}`,
          }))}
          getItemValue={(item) => item.key}
          onMove={({ activeIndex, overIndex }) => {
            const next = [...section.items];
            const [moved] = next.splice(activeIndex, 1);
            if (!moved) return;
            next.splice(overIndex, 0, moved);
            form.setValue(`${prefix}.items`, next);
          }}
        >
          <SortableContent asChild>
            <div className="border-border divide-border divide-y border-t border-b">
              {section.items.map((item, itemIndex) => (
                <SortableItem
                  key={`faq-${itemIndex}`}
                  value={`faq-${itemIndex}`}
                >
                  <div className="flex items-start gap-3 py-3">
                    <SortableItemHandle
                      aria-label={t("dragToReorder")}
                      className="mt-2"
                    >
                      <GripVertical className="text-muted-foreground size-4" />
                    </SortableItemHandle>
                    <div className="min-w-0 flex-1">
                      <CanvasText
                        name={`${prefix}.items.${itemIndex}.question`}
                        placeholder={t("question")}
                        className="text-foreground font-semibold"
                      />
                      <CanvasText
                        name={`${prefix}.items.${itemIndex}.answer`}
                        multiline
                        placeholder={t("answer")}
                        className="text-muted-foreground text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("remove")}
                      onClick={() =>
                        form.setValue(
                          `${prefix}.items`,
                          section.items.filter((_, i) => i !== itemIndex),
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContent>
        </Sortable>
        <div className="mt-6">
          <AddBlockButton
            label={t("addFaq")}
            onClick={() =>
              form.setValue(`${prefix}.items`, [
                ...section.items,
                { question: "", answer: "" },
              ])
            }
          />
        </div>
      </div>
    </section>
  );
}

function CtaEditor({ prefix }: { prefix: PathPrefix }) {
  const t = useTranslations("admin.forms.processPage");

  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-4xl rounded-3xl bg-slate-950 px-8 py-16 text-center text-slate-100">
        <CanvasText
          name={`${prefix}.title`}
          placeholder={t("ctaTitle")}
          className="mb-4 text-center text-3xl font-extrabold text-slate-100 md:text-4xl"
        />
        <CanvasText
          name={`${prefix}.description`}
          multiline
          placeholder={t("ctaDescription")}
          className="mx-auto mb-8 max-w-xl text-center text-sm text-slate-200"
        />
        <div className="bg-primary-900 text-primary-foreground mx-auto inline-flex min-h-11 items-center rounded-full px-6">
          <CanvasText
            name={`${prefix}.button`}
            placeholder={t("ctaButton")}
            className="text-primary-foreground w-40 text-center text-sm font-semibold"
          />
        </div>
      </div>
    </section>
  );
}

function HeaderFields({ prefix }: { prefix: PathPrefix }) {
  const t = useTranslations("admin.forms.processPage");
  return (
    <div className="mb-10 text-center">
      <CanvasText
        name={`${prefix}.anchorId`}
        placeholder={t("navId")}
        className="text-muted-foreground mx-auto mb-2 max-w-xs font-mono text-xs"
      />
      <CanvasText
        name={`${prefix}.eyebrow`}
        placeholder={t("eyebrow")}
        className={cn(processEyebrowStyles, "text-center")}
      />
      <CanvasText
        name={`${prefix}.title`}
        placeholder={t("sectionTitle")}
        className="text-foreground mt-2 text-center text-3xl font-extrabold md:text-4xl"
      />
    </div>
  );
}
