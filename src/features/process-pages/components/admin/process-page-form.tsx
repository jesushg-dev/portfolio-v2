"use client";

import type { AppLanguage } from "@prisma/client";
import { type FC, useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  LayoutList,
  ListChecks,
  MessageCircle,
  Navigation,
  PanelsTopLeft,
  Plus,
  Rocket,
  Sparkles,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";

import { api } from "@/trpc/react";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";
import {
  translationMapSchema,
  resolvePrimaryLanguage,
} from "@/lib/i18n/localized-form";
import { useLocalizedForm } from "@/hooks/admin/use-localized-form";
import { cn } from "@/lib/utils";
import {
  createEmptyWidget,
  emptyProcessPageContent,
  processPageIconSchema,
  processPageSlugSchema,
  type ProcessPageContent,
  type ProcessPageWidget,
  type ProcessPageWidgetType,
} from "@/features/process-pages/lib/process-page-content";
import { PROCESS_PAGE_ICON_MAP } from "@/lib/process-pages/process-page-icons";
import type { ProcessPageFormValues } from "@/features/process-pages/lib/process-page-editor-dto";
import { buildProcessPageUpsertPayload } from "@/features/process-pages/lib/process-page-upsert-payload";
import { ProcessPageDesignerWidget } from "@/features/process-pages/components/admin/process-page-designer-widget";

const PALETTE: {
  type: ProcessPageWidgetType;
  icon: typeof PanelsTopLeft;
}[] = [
  { type: "hero", icon: PanelsTopLeft },
  { type: "nav", icon: Navigation },
  { type: "benefits", icon: Sparkles },
  { type: "stepsAccordion", icon: ListChecks },
  { type: "stepsTimeline", icon: LayoutList },
  { type: "toolkit", icon: Wrench },
  { type: "roles", icon: Users },
  { type: "faq", icon: MessageCircle },
  { type: "closingCta", icon: Rocket },
];

interface ProcessPageFormProps {
  languages: AppLanguage[];
  initialData: ProcessPageFormValues;
}

export const ProcessPageForm: FC<ProcessPageFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = Boolean(initialData.id);
  const t = useTranslations("admin.forms.processPage");
  const tPages = useTranslations("admin.processPages");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const primaryLang = resolvePrimaryLanguage(languages);
  const [activeDrag, setActiveDrag] = useState<{
    type: "palette" | "canvas";
    widgetType?: ProcessPageWidgetType;
  } | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        slug: processPageSlugSchema,
        template: z.enum(["WORKFLOW", "QA"]),
        isPublished: z.boolean(),
        showInNav: z.boolean(),
        order: z.number().int().nonnegative(),
        navIcon: processPageIconSchema,
        translations: translationMapSchema(
          z.object({
            metaTitle: z.string(),
            metaDescription: z.string(),
            menuTitle: z.string(),
            navDescription: z.string(),
            pageNavLabel: z.string(),
            heroEyebrow: z.string(),
            heroTitle: z.string(),
            heroTitleHighlight: z.string(),
            heroDescription: z.string(),
            heroPrimaryCta: z.string(),
            heroSecondaryCta: z.string(),
            heroScrollHint: z.string(),
            ctaTitle: z.string(),
            ctaDescription: z.string(),
            ctaButton: z.string(),
          }),
          primaryLang?.id,
          "menuTitle",
          t("menuTitleRequired"),
        ),
        contentByLanguage: z.record(z.string(), z.unknown()),
      }),
    [primaryLang?.id, t],
  );

  type FormValues = z.infer<typeof schema>;

  const createItem = api.processPagesAdmin.createItem.useMutation();
  const updateItem = api.processPagesAdmin.updateItem.useMutation();
  const utils = api.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData as FormValues,
    mode: "onBlur",
  });

  const { activeLangId, setActiveLangId, statusByLangId } = useLocalizedForm({
    languages,
    form,
    buildDefaultValues: () => initialData as FormValues,
    resourceId: initialData.id,
    completenessFields: ["menuTitle"],
  });

  const watchedSections = useWatch({
    control: form.control,
    name: `contentByLanguage.${activeLangId}.sections`,
  }) as ProcessPageWidget[] | undefined;
  const sections = useMemo(() => watchedSections ?? [], [watchedSections]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const writeSections = useCallback(
    (next: ProcessPageWidget[], sourceLangId = activeLangId) => {
      const layout = next.map((section) => ({
        id: section.id,
        type: section.type,
      }));
      for (const language of languages) {
        const current =
          (form.getValues(`contentByLanguage.${language.id}`) as
            ProcessPageContent | undefined) ?? emptyProcessPageContent();
        const byId = new Map(
          current.sections.map((section) => [section.id, section]),
        );
        const rebuilt = layout.map((item) => {
          const existing = byId.get(item.id);
          if (existing) return existing;
          if (language.id === sourceLangId) {
            return (
              next.find((section) => section.id === item.id) ??
              createEmptyWidget(item.type, item.id)
            );
          }
          return createEmptyWidget(item.type, item.id);
        });
        form.setValue(`contentByLanguage.${language.id}`, {
          version: 2,
          sections: rebuilt,
        });
      }
    },
    [activeLangId, form, languages],
  );

  const insertWidget = useCallback(
    (type: ProcessPageWidgetType, index: number) => {
      const widget = createEmptyWidget(type);
      const next = [...sections];
      next.splice(index, 0, widget);
      writeSections(next);
    },
    [sections, writeSections],
  );

  const removeWidget = useCallback(
    (id: string) => {
      writeSections(sections.filter((section) => section.id !== id));
    },
    [sections, writeSections],
  );

  const onDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as
      | { from?: "palette" | "canvas"; widgetType?: ProcessPageWidgetType }
      | undefined;
    setActiveDrag({
      type: data?.from === "palette" ? "palette" : "canvas",
      widgetType: data?.widgetType,
    });
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);
      const { active, over } = event;
      if (!over) return;
      const activeData = active.data.current as
        | { from?: "palette" | "canvas"; widgetType?: ProcessPageWidgetType }
        | undefined;

      if (activeData?.from === "palette" && activeData.widgetType) {
        let index = sections.length;
        if (over.id === "canvas") {
          index = sections.length;
        } else {
          const overIndex = sections.findIndex(
            (section) => section.id === over.id,
          );
          if (overIndex >= 0) index = overIndex;
        }
        insertWidget(activeData.widgetType, index);
        return;
      }

      if (active.id === over.id) return;
      const oldIndex = sections.findIndex(
        (section) => section.id === active.id,
      );
      const newIndex = sections.findIndex((section) => section.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      writeSections(arrayMove(sections, oldIndex, newIndex));
    },
    [insertWidget, sections, writeSections],
  );

  const onSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        try {
          const payload = buildProcessPageUpsertPayload(values);
          if (isEditMode && values.id) {
            await updateItem.mutateAsync({ id: values.id, ...payload });
            toast.success(t("updatedSuccess"));
          } else {
            await createItem.mutateAsync(payload);
            toast.success(t("createdSuccess"));
          }
          await utils.processPagesAdmin.getMine.invalidate();
          router.push("/admin/process-pages");
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [isEditMode, updateItem, createItem, utils, router, t],
  );

  const isSaving = createItem.isPending || updateItem.isPending || isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="-m-4 flex min-h-[calc(100vh-7rem)] flex-col md:-m-6"
      >
        <header className="border-border bg-background/90 sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur">
          <div>
            <p className="text-sm font-semibold">
              {isEditMode ? tPages("editTitle") : tPages("addNew")}
            </p>
            <p className="text-muted-foreground text-xs">{t("designerHint")}</p>
          </div>
          <GlobalLanguageSelector
            languages={languages}
            activeLangId={activeLangId}
            onLangChange={setActiveLangId}
            buttonIdPrefix="process-page"
            statusByLangId={statusByLangId}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("saving") : isEditMode ? t("save") : t("create")}
            </Button>
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="grid min-h-0 flex-1 lg:grid-cols-[16rem_minmax(0,1fr)_18rem]">
            <aside className="border-border bg-muted/30 overflow-y-auto border-r p-3">
              <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
                {t("widgetPalette")}
              </p>
              <div className="grid gap-2">
                {PALETTE.map((item) => (
                  <PaletteItem
                    key={item.type}
                    type={item.type}
                    icon={item.icon}
                    label={t(`widgets.${item.type}`)}
                    onAdd={() => insertWidget(item.type, sections.length)}
                  />
                ))}
              </div>
            </aside>

            <DesignerCanvas
              langId={activeLangId}
              sections={sections}
              emptyLabel={t("emptyCanvas")}
              onRemove={removeWidget}
            />

            <aside className="border-border overflow-y-auto border-l p-4">
              <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
                {t("pageSettings")}
              </p>
              <DesignerSidebar activeLangId={activeLangId} />
            </aside>
          </div>
          <DragOverlay>
            {activeDrag ? (
              <div className="bg-card rounded-md border px-3 py-2 text-sm shadow-lg">
                {activeDrag.widgetType
                  ? t(`widgets.${activeDrag.widgetType}`)
                  : t("dragToReorder")}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </form>
    </Form>
  );
};

function PaletteItem({
  type,
  icon: Icon,
  label,
  onAdd,
}: {
  type: ProcessPageWidgetType;
  icon: typeof PanelsTopLeft;
  label: string;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { from: "palette", widgetType: type },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "border-border bg-background flex items-center gap-2 rounded-lg border px-2 py-2 text-sm",
        isDragging && "opacity-40",
      )}
    >
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="min-w-0 flex-1">{label}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={onAdd}
        aria-label={label}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}

function DesignerCanvas({
  langId,
  sections,
  emptyLabel,
  onRemove,
}: {
  langId: string;
  sections: ProcessPageWidget[];
  emptyLabel: string;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations("admin.forms.processPage");
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-background min-h-full overflow-y-auto",
        isOver && "ring-primary/30 ring-2 ring-inset",
      )}
    >
      {sections.length === 0 ? (
        <div className="flex min-h-112 items-center justify-center p-8">
          <div className="border-border text-muted-foreground max-w-md rounded-2xl border border-dashed px-8 py-16 text-center text-sm">
            {emptyLabel}
          </div>
        </div>
      ) : (
        <SortableContext
          items={sections.map((section) => section.id)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section, index) => (
            <CanvasWidgetFrame
              key={section.id}
              section={section}
              langId={langId}
              index={index}
              label={t(`widgets.${section.type}`)}
              onRemove={() => onRemove(section.id)}
            />
          ))}
        </SortableContext>
      )}
    </div>
  );
}

function CanvasWidgetFrame({
  section,
  langId,
  index,
  label,
  onRemove,
}: {
  section: ProcessPageWidget;
  langId: string;
  index: number;
  label: string;
  onRemove: () => void;
}) {
  const t = useTranslations("admin.forms.processPage");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: { from: "canvas", widgetType: section.type },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={cn("group relative", isDragging && "opacity-50")}
    >
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
        <span className="bg-background/90 text-muted-foreground rounded-full px-2 py-1 text-[0.625rem] font-semibold tracking-widest uppercase">
          {label}
        </span>
        <button
          type="button"
          className="bg-background/90 rounded-md p-1"
          aria-label={t("dragToReorder")}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          className="bg-background/90 text-destructive rounded-md p-1"
          aria-label={t("removeWidget")}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <ProcessPageDesignerWidget
        langId={langId}
        index={index}
        section={section}
      />
    </div>
  );
}

function DesignerSidebar({ activeLangId }: { activeLangId: string }) {
  const t = useTranslations("admin.forms.processPage");
  const { control } = useFormContext<ProcessPageFormValues>();

  return (
    <div className="space-y-4 text-sm">
      <FormField
        control={control}
        name="slug"
        render={({ field }) => (
          <label className="block space-y-1">
            <span className="font-medium">{t("slug")}</span>
            <Input {...field} placeholder="how-i-use-ai" />
            <span className="text-muted-foreground text-xs">
              {t("slugHint")}
            </span>
          </label>
        )}
      />
      <FormField
        control={control}
        name="template"
        render={({ field }) => (
          <label className="block space-y-1">
            <span className="font-medium">{t("template")}</span>
            <Select
              value={field.value}
              onValueChange={(value) => {
                if (value) field.onChange(value);
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="WORKFLOW">
                  {t("templateWorkflow")}
                </SelectItem>
                <SelectItem value="QA">{t("templateQa")}</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-muted-foreground text-xs">
              {t("templateHint")}
            </span>
          </label>
        )}
      />
      <FormField
        control={control}
        name="navIcon"
        render={({ field }) => (
          <label className="block space-y-1">
            <span className="font-medium">{t("navIcon")}</span>
            <Select
              value={field.value}
              onValueChange={(value) => {
                if (value) field.onChange(value);
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {processPageIconSchema.options.map((name) => {
                  const Icon = PROCESS_PAGE_ICON_MAP[name];
                  return (
                    <SelectItem key={name} value={name}>
                      <span className="flex items-center gap-2">
                        <Icon className="size-4" />
                        {name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </label>
        )}
      />
      <FormField
        control={control}
        name="order"
        render={({ field }) => (
          <label className="block space-y-1">
            <span className="font-medium">{t("order")}</span>
            <Input
              type="number"
              {...field}
              onChange={(event) => field.onChange(Number(event.target.value))}
            />
          </label>
        )}
      />
      <FormField
        control={control}
        name="isPublished"
        render={({ field }) => (
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block font-medium">{t("isPublished")}</span>
              <span className="text-muted-foreground text-xs">
                {t("isPublishedHint")}
              </span>
            </span>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </label>
        )}
      />
      <FormField
        control={control}
        name="showInNav"
        render={({ field }) => (
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block font-medium">{t("showInNav")}</span>
              <span className="text-muted-foreground text-xs">
                {t("showInNavHint")}
              </span>
            </span>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </label>
        )}
      />
      <FormField
        control={control}
        name={`translations.${activeLangId}.menuTitle`}
        render={({ field }) => (
          <label className="block space-y-1">
            <span className="font-medium">{t("menuTitle")}</span>
            <Input {...field} />
          </label>
        )}
      />
      <FormField
        control={control}
        name={`translations.${activeLangId}.navDescription`}
        render={({ field }) => (
          <label className="block space-y-1">
            <span className="font-medium">{t("navDescription")}</span>
            <span className="text-muted-foreground block text-xs">
              {t("navDescriptionHint")}
            </span>
            <Textarea {...field} rows={2} />
          </label>
        )}
      />
      <FormField
        control={control}
        name={`translations.${activeLangId}.metaTitle`}
        render={({ field }) => (
          <label className="block space-y-1">
            <span className="font-medium">{t("metaTitle")}</span>
            <Input {...field} />
          </label>
        )}
      />
      <FormField
        control={control}
        name={`translations.${activeLangId}.metaDescription`}
        render={({ field }) => (
          <label className="block space-y-1">
            <span className="font-medium">{t("metaDescription")}</span>
            <Textarea {...field} rows={3} />
          </label>
        )}
      />
    </div>
  );
}
