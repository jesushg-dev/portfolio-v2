"use client";

import type { AppLanguage } from "@prisma/client";

import {
  type FC,
  type ChangeEvent,
  useTransition,
  useCallback,
  useMemo,
  useState,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Globe, ImageIcon, AlertCircle, Upload } from "lucide-react";

import { api } from "@/trpc/react";
import { useUploadThing } from "@/lib/uploadthing";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkillPicker } from "@/components/admin/skill-picker";
import { CertificatePicker } from "@/components/admin/certificate-picker";
import {
  AdminFormLanguageBar,
  ReferenceSnippet,
  AdminFormEmptyTranslation,
  AdminFormDeleteTranslation,
  type LanguageProgress,
} from "@/components/admin/shared/admin-form-language-bar";
import {
  FormActions,
  FormCheckboxItem,
  FormError,
  FormItem,
  FormRoot,
} from "@/components/shared/form-root";
import {
  resolvePrimaryLanguage,
  translationMapSchema,
} from "@/lib/i18n/localized-form";
import {
  type ProjectCreateFormDTO,
  type ProjectEditorDTO,
} from "@/features/projects/lib/project-editor-dto";
import { StackTypeSchema } from "@/lib/admin/portfolio-schemas";
import { isAbsoluteOrLocalImagePath } from "@/utils/tools/image";
import { ProjectTranslationFormSchema } from "../lib/project-translation-form-schema";
import { CaseStudyNarrativeEditor } from "./case-study-narrative-editor";
import {
  buildEmptyCaseStudy,
  type CaseStudyContentDTO,
} from "../lib/case-study";

// ---------------------------------------------------------------------------
// Types & Helper Functions
// ---------------------------------------------------------------------------

type TTranslations = ReturnType<typeof useTranslations<"admin.forms.project">>;

export interface ProjectFormValues {
  id?: string;
  image: string;
  type: z.infer<typeof StackTypeSchema>;
  githubUrl?: string;
  websiteUrl?: string;
  isPrivate: boolean;
  skillIds: string[];
  certificateIds: string[];
  order: number;
  kind: "PROFESSIONAL" | "PERSONAL" | "LEARNING";
  slug?: string;
  caseStudyEnabled: boolean;
  status?: "IN_PRODUCTION" | "MAINTENANCE" | "ARCHIVED" | null;
  startedAt?: string | null;
  endedAt?: string | null;
  teamSize?: number | null;
  translations: Record<
    string,
    {
      title: string;
      description: string;
      caseStudy: CaseStudyContentDTO;
    }
  >;
}

interface ProjectFormProps {
  languages: AppLanguage[];
  initialData: ProjectEditorDTO | ProjectCreateFormDTO;
}

function hasCaseStudyContent(caseStudy: unknown): boolean {
  if (!caseStudy || typeof caseStudy !== "object") return false;
  const cs = caseStudy as Record<string, unknown>;
  if (typeof cs.context === "string" && cs.context.trim() !== "") return true;
  if (typeof cs.roleTitle === "string" && cs.roleTitle.trim() !== "")
    return true;
  if (typeof cs.roleIntro === "string" && cs.roleIntro.trim() !== "")
    return true;
  if (Array.isArray(cs.chips) && cs.chips.length > 0) return true;
  if (Array.isArray(cs.facts) && cs.facts.length > 0) return true;
  if (Array.isArray(cs.gallery) && cs.gallery.length > 0) return true;
  if (Array.isArray(cs.tldr) && cs.tldr.length > 0) return true;
  if (Array.isArray(cs.responsibilities) && cs.responsibilities.length > 0)
    return true;
  if (Array.isArray(cs.sections) && cs.sections.length > 0) return true;
  return false;
}

function getTranslationChecks(
  translation:
    | {
        title?: string;
        description?: string;
        caseStudy?: unknown;
      }
    | undefined,
  caseStudyEnabled: boolean,
): [string, boolean][] {
  if (!translation) return [];
  const checks: [string, boolean][] = [
    ["title", Boolean(translation.title?.trim())],
    ["description", Boolean(translation.description?.trim())],
  ];

  if (caseStudyEnabled || hasCaseStudyContent(translation.caseStudy)) {
    const cs = (translation.caseStudy ?? {}) as Record<string, unknown>;
    checks.push(
      ["context", Boolean(typeof cs.context === "string" && cs.context.trim())],
      [
        "roleTitle",
        Boolean(typeof cs.roleTitle === "string" && cs.roleTitle.trim()),
      ],
      [
        "roleIntro",
        Boolean(typeof cs.roleIntro === "string" && cs.roleIntro.trim()),
      ],
      ["tldr", Boolean(Array.isArray(cs.tldr) && cs.tldr.length > 0)],
      [
        "responsibilities",
        Boolean(
          Array.isArray(cs.responsibilities) && cs.responsibilities.length > 0,
        ),
      ],
      [
        "sections",
        Boolean(Array.isArray(cs.sections) && cs.sections.length > 0),
      ],
    );
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const ProjectForm: FC<ProjectFormProps> = ({
  initialData,
  languages,
}) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.project");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );

  const [activeTab, setActiveTab] = useState<string>("general");
  const [activeLangId, setActiveLangId] = useState<string>(
    primaryLang?.id ?? languages[0]?.id ?? "",
  );
  const [showOriginal, setShowOriginal] = useState(true);

  const projectFormSchema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        image: z
          .string()
          .min(1, t("imageRequired"))
          .refine(isAbsoluteOrLocalImagePath, t("imageUrlInvalid")),
        type: StackTypeSchema,
        githubUrl: z.string().url().optional().or(z.literal("")),
        websiteUrl: z.string().url().optional().or(z.literal("")),
        isPrivate: z.boolean(),
        skillIds: z.array(z.string()),
        certificateIds: z.array(z.string()),
        order: z.number().int(),
        kind: z.enum(["PROFESSIONAL", "PERSONAL", "LEARNING"]),
        slug: z.string().optional(),
        caseStudyEnabled: z.boolean(),
        status: z
          .enum(["IN_PRODUCTION", "MAINTENANCE", "ARCHIVED"])
          .optional()
          .nullable(),
        startedAt: z.string().optional().nullable(),
        endedAt: z.string().optional().nullable(),
        teamSize: z.number().int().positive().optional().nullable(),
        translations: translationMapSchema(
          ProjectTranslationFormSchema,
          primaryLang?.id,
          "title",
          t("titleRequiredPrimary"),
        ),
      }),
    [primaryLang?.id, t],
  );

  const createProject = api.projectsAdmin.createItem.useMutation();
  const updateProject = api.projectsAdmin.updateItem.useMutation();
  const { startUpload: uploadCover, isUploading: isUploadingCover } =
    useUploadThing("projectCover");

  const { data: { data: rawSkills = [] } = {} } =
    api.skillsAdmin.getMine.useQuery({});
  const utils = api.useUtils();

  const availableSkills = useMemo(
    () =>
      rawSkills.map((skill) => ({
        id: skill.id,
        title: skill.title,
        image: skill.image,
        type: skill.type,
      })),
    [rawSkills],
  );

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema) as never,
    defaultValues: {
      ...initialData,
      skillIds: initialData.skillIds ?? [],
      certificateIds: initialData.certificateIds ?? [],
      order: initialData.order ?? 0,
      slug: initialData.slug ?? "",
      caseStudyEnabled: initialData.caseStudyEnabled ?? false,
      status: initialData.status ?? "IN_PRODUCTION",
      startedAt: initialData.startedAt ?? "",
      endedAt: initialData.endedAt ?? "",
      teamSize: initialData.teamSize ?? null,
    } as unknown as ProjectFormValues,
    mode: "onBlur",
  });

  const onSubmit = useCallback(
    (values: ProjectFormValues) => {
      startTransition(async () => {
        try {
          const data = {
            ...values,
            githubUrl: values.githubUrl ?? undefined,
            websiteUrl: values.websiteUrl ?? undefined,
            slug: values.slug ?? undefined,
            status: values.status ?? undefined,
            startedAt: values.startedAt ?? undefined,
            endedAt: values.endedAt ?? undefined,
            teamSize: values.teamSize ?? undefined,
          };

          if (isEditMode && values.id) {
            await updateProject.mutateAsync({
              ...data,
              id: values.id,
            });
            toast.success(t("updatedSuccess"));
          } else {
            await createProject.mutateAsync(data);
            toast.success(t("createdSuccess"));
          }

          await utils.projectsAdmin.getMine.invalidate();
          router.back();
        } catch {
          toast.error(isEditMode ? t("updateFailed") : t("createFailed"));
        }
      });
    },
    [isEditMode, updateProject, createProject, utils, router, t],
  );

  const isSaving = createProject.isPending || updateProject.isPending;
  const anyError = createProject.error ?? updateProject.error;

  const watchedSkillIds =
    useWatch({ control: form.control, name: "skillIds" }) ?? [];
  const watchedCertIds =
    useWatch({ control: form.control, name: "certificateIds" }) ?? [];
  const watchedCaseStudyEnabled =
    useWatch({ control: form.control, name: "caseStudyEnabled" }) ?? false;
  const watchedTranslations = useWatch({
    control: form.control,
    name: "translations",
  });

  const primaryLangId = primaryLang?.id ?? "";

  const checksByLang = useMemo(() => {
    const result: Record<string, [string, boolean][]> = {};
    for (const lang of languages) {
      result[lang.id] = getTranslationChecks(
        watchedTranslations?.[lang.id],
        watchedCaseStudyEnabled,
      );
    }
    return result;
  }, [languages, watchedTranslations, watchedCaseStudyEnabled]);

  const primaryTitle = primaryLangId
    ? watchedTranslations?.[primaryLangId]?.title
    : "";
  const primaryDesc = primaryLangId
    ? watchedTranslations?.[primaryLangId]?.description
    : "";

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 w-full flex-1 flex-col overflow-hidden"
        >
          <TabsList
            variant="line"
            className="mb-6 flex w-fit max-w-full shrink-0 justify-start overflow-x-auto overflow-y-hidden"
          >
            <TabsTrigger value="general" className="text-xs">
              {t("tabs.general")}
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs">
              <Globe className="size-3.5 opacity-70" />
              <span>{t("tabs.content")}</span>
              {watchedCaseStudyEnabled && (
                <span
                  className="size-1.5 rounded-full bg-emerald-500"
                  aria-hidden="true"
                />
              )}
            </TabsTrigger>
            <TabsTrigger value="skills" className="text-xs">
              <span>{t("tabs.skills")}</span>
              <span className="bg-muted text-foreground py-0.2 rounded-full px-1.5 text-[10px] tabular-nums">
                {watchedSkillIds.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="certificates" className="text-xs">
              <span>{t("tabs.certificates")}</span>
              <span className="bg-muted text-foreground py-0.2 rounded-full px-1.5 text-[10px] tabular-nums">
                {watchedCertIds.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-full min-h-0 min-w-0 flex-1 [&>div>div]:!flex [&>div>div]:!h-full [&>div>div]:!min-h-full [&>div>div]:!flex-col">
            <div className="flex h-full min-h-full min-w-0 flex-1 flex-col space-y-4 px-1 pt-1 pr-3 pb-4">
              <FormError error={anyError} />
              {/* ── TAB 1: GENERAL ─────────────────────────────────────────── */}
              <TabsContent value="general" className="mt-0 space-y-6">
                <GeneralTabContent
                  form={form}
                  t={t}
                  uploadCover={uploadCover}
                  isUploadingCover={isUploadingCover}
                />
              </TabsContent>

              {/* ── TAB 2: CONTENT ─────────────────────────────────────────── */}
              <TabsContent value="content" className="mt-0 space-y-6">
                <ContentTabContent
                  form={form}
                  languages={languages}
                  activeLangId={activeLangId}
                  primaryLangId={primaryLangId}
                  onSelectLang={setActiveLangId}
                  showOriginal={showOriginal}
                  onToggleShowRef={setShowOriginal}
                  checksByLang={checksByLang}
                  primaryTitle={primaryTitle ?? ""}
                  primaryDesc={primaryDesc ?? ""}
                  t={t}
                />
              </TabsContent>

              {/* ── TAB 3: SKILLS ──────────────────────────────────────────── */}
              <TabsContent
                value="skills"
                className="mt-0 flex h-full min-h-0 flex-1 flex-col"
              >
                <FormField
                  control={form.control}
                  name="skillIds"
                  render={({ field }) => (
                    <div className="flex h-full min-h-0 flex-1 flex-col">
                      <SkillPicker
                        availableSkills={availableSkills}
                        selectedSkillIds={field.value}
                        onChange={field.onChange}
                      />
                    </div>
                  )}
                />
              </TabsContent>

              {/* ── TAB 4: CERTIFICATES ────────────────────────────────────── */}
              <TabsContent
                value="certificates"
                className="mt-0 flex h-full min-h-0 min-w-0 flex-1 flex-col"
              >
                <FormField
                  control={form.control}
                  name="certificateIds"
                  render={({ field }) => (
                    <div className="flex h-full min-h-0 flex-1 flex-col">
                      <CertificatePicker
                        selectedCertificateIds={field.value}
                        onChange={field.onChange}
                      />
                    </div>
                  )}
                />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <FormActions
          isPending={isPending || isSaving || isUploadingCover}
          title={isEditMode ? t("save") : t("create")}
        >
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};

// ---------------------------------------------------------------------------
// Standalone Subcomponents (No inline closure render functions)
// ---------------------------------------------------------------------------

interface CoverPreviewProps {
  imageSrc: string;
  onPickImage: () => void;
  onRemoveImage: () => void;
  t: TTranslations;
}

function CoverPreview({
  imageSrc,
  onPickImage,
  onRemoveImage,
  t,
}: CoverPreviewProps) {
  const [loadError, setLoadError] = useState(false);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(
    null,
  );

  const hasImage = Boolean(imageSrc.trim()) && !loadError;

  return (
    <div className="space-y-3">
      <div
        className={`relative aspect-video w-full overflow-hidden rounded-2xl border transition-all ${
          !imageSrc.trim()
            ? "border-border/80 bg-muted/20"
            : loadError
              ? "border-destructive/40 bg-destructive/5"
              : "border-border bg-black/40"
        }`}
      >
        {!imageSrc.trim() ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="bg-muted text-muted-foreground grid size-10 place-items-center rounded-xl">
              <ImageIcon className="size-5" />
            </span>
            <span className="text-foreground text-sm font-medium">
              {t("coverEmptyTitle")}
            </span>
            <span className="text-muted-foreground max-w-xs text-xs">
              {t("coverEmptyHint")}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPickImage}
              className="mt-1 gap-1.5 text-xs"
            >
              <Upload className="size-3.5" />
              <span>{t("coverUpload")}</span>
            </Button>
          </div>
        ) : loadError ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center">
            <AlertCircle className="text-destructive size-7" />
            <span className="text-destructive text-sm font-medium">
              {t("imageUrlInvalid")}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPickImage}
              className="text-xs"
            >
              {t("coverChange")}
            </Button>
          </div>
        ) : (
          <>
            {/* Background Blur Backdrop */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl"
            />
            {/* Main Contained Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Project cover preview"
              className="relative size-full object-contain"
              onLoad={(e) => {
                const img = e.currentTarget;
                setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
                setLoadError(false);
              }}
              onError={() => setLoadError(true)}
            />
            {/* Overlay Bar */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent p-3">
              {dimensions ? (
                <span className="rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white tabular-nums">
                  {dimensions.w} × {dimensions.h}
                </span>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onPickImage}
                  className="h-7 rounded-md px-2.5 text-xs"
                >
                  {t("coverChange")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onRemoveImage}
                  className="hover:bg-destructive/80 hover:text-destructive-foreground h-7 rounded-md px-2.5 text-xs"
                >
                  {t("coverRemove")}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {hasImage && (
        <p className="text-muted-foreground text-xs">{t("coverHint")}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// General Tab Subcomponent
// ---------------------------------------------------------------------------

interface GeneralTabContentProps {
  form: UseFormReturn<ProjectFormValues>;
  t: TTranslations;
  uploadCover: (
    files: File[],
  ) => Promise<{ url: string; ufsUrl?: string | null }[] | undefined>;
  isUploadingCover: boolean;
}

function GeneralTabContent({
  form,
  t,
  uploadCover,
  isUploadingCover,
}: GeneralTabContentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentImage = form.watch("image") ?? "";

  const handlePickClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    form.setValue("image", "");
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast.error(t("imageUrlInvalid"));
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Max image size is 4MB");
      return;
    }

    try {
      const uploaded = await uploadCover([file]);
      const url = uploaded?.[0]?.ufsUrl ?? uploaded?.[0]?.url;
      if (!url) throw new Error("Upload failed");
      form.setValue("image", url, { shouldValidate: true, shouldDirty: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("imageUrlInvalid"),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/40 border-border text-muted-foreground flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs">
        <Globe className="size-4 shrink-0" />
        <span>{t("generalNote")}</span>
      </div>

      {/* Cover Image Section */}
      <div className="space-y-3">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t("coverSection")} <span className="text-destructive">*</span>
        </h3>
        <CoverPreview
          key={currentImage}
          imageSrc={currentImage}
          onPickImage={handlePickClick}
          onRemoveImage={handleRemoveImage}
          t={t}
        />
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                placeholder={t("imageUrlPlaceholder")}
                className="flex-1"
                aria-label={t("imageUrl")}
              />
            )}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handlePickClick}
            disabled={isUploadingCover}
            className="shrink-0 gap-1.5"
          >
            <Upload className="size-4" />
            <span>{t("coverUpload")}</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-label={t("coverUpload")}
            onChange={(event) => {
              void handleFileChange(event);
            }}
            disabled={isUploadingCover}
          />
        </div>
      </div>

      {/* Classification */}
      <div className="space-y-3">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t("classification")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem label={t("projectType")} inputId="project-type">
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger id="project-type">
                      <SelectValue placeholder={t("selectType")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {StackTypeSchema.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="kind"
            render={({ field }) => (
              <FormItem label="Origin (Kind)" inputId="project-kind">
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger id="project-kind">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PROFESSIONAL">PROFESSIONAL</SelectItem>
                    <SelectItem value="PERSONAL">PERSONAL</SelectItem>
                    <SelectItem value="LEARNING">LEARNING</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem label={t("status")} inputId="project-status">
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? "IN_PRODUCTION"}
                >
                  <FormControl>
                    <SelectTrigger id="project-status">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="IN_PRODUCTION">IN_PRODUCTION</SelectItem>
                    <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                    <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Dates and Team */}
      <div className="space-y-3">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t("datesAndTeam")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="startedAt"
            render={({ field }) => (
              <FormItem label={t("startDate")} inputId="project-started-at">
                <Input
                  id="project-started-at"
                  type="date"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endedAt"
            render={({ field }) => (
              <FormItem label={t("endDate")} inputId="project-ended-at">
                <Input
                  id="project-ended-at"
                  type="date"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="teamSize"
            render={({ field }) => (
              <FormItem label={t("teamSize")} inputId="project-team-size">
                <Input
                  id="project-team-size"
                  type="number"
                  min={1}
                  placeholder={t("teamSizePlaceholder")}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Links */}
      <div className="space-y-3">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t("linksSection")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="githubUrl"
            render={({ field }) => (
              <FormItem label={t("githubUrl")} inputId="project-github-url">
                <Input
                  id="project-github-url"
                  placeholder={t("githubUrlPlaceholder")}
                  {...field}
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="websiteUrl"
            render={({ field }) => (
              <FormItem label={t("liveDemoUrl")} inputId="project-website-url">
                <Input
                  id="project-website-url"
                  placeholder="https://..."
                  {...field}
                />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Publication */}
      <div className="space-y-4">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t("publicationSection")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem
                label="Slug (URL)"
                description={t("slugHint")}
                inputId="project-slug"
              >
                <div className="border-border bg-muted/20 focus-within:border-primary flex items-center rounded-xl border">
                  <span className="text-muted-foreground pl-3 text-xs">
                    /projects/
                  </span>
                  <Input
                    id="project-slug"
                    placeholder="my-cool-project"
                    className="border-0 bg-transparent pl-1 focus-visible:ring-0"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                          .replace(/-{2,}/g, "-"),
                      )
                    }
                  />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem
                label={t("order")}
                description={t("orderHint")}
                inputId="project-order"
              >
                <Input
                  id="project-order"
                  type="number"
                  min={0}
                  value={field.value ?? 0}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormItem>
            )}
          />
        </div>

        <div className="border-border bg-card grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="isPrivate"
            render={({ field }) => (
              <FormCheckboxItem
                label={t("privateProject")}
                description={t("privateProjectDescription")}
              >
                <Switch
                  id="project-private"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormCheckboxItem>
            )}
          />
          <FormField
            control={form.control}
            name="caseStudyEnabled"
            render={({ field }) => (
              <FormCheckboxItem
                label={t("caseStudyStatus")}
                description={t("caseStudyPublishHint")}
              >
                <Switch
                  id="project-case-study"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormCheckboxItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content Tab Subcomponent
// ---------------------------------------------------------------------------

interface ContentTabContentProps {
  form: UseFormReturn<ProjectFormValues>;
  languages: AppLanguage[];
  activeLangId: string;
  primaryLangId: string;
  onSelectLang: (langId: string) => void;
  showOriginal: boolean;
  onToggleShowRef: (show: boolean) => void;
  checksByLang: Record<string, [string, boolean][]>;
  primaryTitle: string;
  primaryDesc: string;
  t: TTranslations;
}

function ContentTabContent({
  form,
  languages,
  activeLangId,
  primaryLangId,
  onSelectLang,
  showOriginal,
  onToggleShowRef,
  checksByLang,
  primaryTitle,
  primaryDesc,
  t,
}: ContentTabContentProps) {
  const [startedBlankLanguages, setStartedBlankLanguages] = useState<string[]>(
    [],
  );

  const activeTranslation = form.watch(`translations.${activeLangId}`);
  const activeLang = languages.find((l) => l.id === activeLangId);
  const primaryLang = languages.find((l) => l.id === primaryLangId);

  const isNonPrimary = activeLangId !== primaryLangId;
  const currentChecks = checksByLang[activeLangId] ?? [];
  const missingItems = currentChecks.filter((x) => !x[1]).map((x) => x[0]);

  const hasContent =
    activeLangId === primaryLangId ||
    startedBlankLanguages.includes(activeLangId) ||
    Boolean(
      activeTranslation?.title?.trim() ||
      activeTranslation?.description?.trim() ||
      hasCaseStudyContent(activeTranslation?.caseStudy),
    );

  const languageProgressList: LanguageProgress[] = useMemo(() => {
    return languages.map((lang) => {
      const checks = checksByLang[lang.id] ?? [];
      const ok = checks.filter((c) => c[1]).length;
      const trans = form.watch(`translations.${lang.id}`);
      const langHasContent = Boolean(
        trans?.title?.trim() ||
        trans?.description?.trim() ||
        hasCaseStudyContent(trans?.caseStudy),
      );
      return {
        id: lang.id,
        name: lang.name,
        code: lang.code,
        isBase: lang.id === primaryLangId,
        hasContent: langHasContent,
        completedCount: ok,
        totalCount: checks.length,
      };
    });
  }, [languages, checksByLang, form, primaryLangId]);

  const handleCopyFromBase = () => {
    const baseTrans = form.getValues(`translations.${primaryLangId}`);
    if (baseTrans) {
      form.setValue(`translations.${activeLangId}`, {
        title: baseTrans.title ?? "",
        description: baseTrans.description ?? "",
        caseStudy: baseTrans.caseStudy
          ? (JSON.parse(
              JSON.stringify(baseTrans.caseStudy),
            ) as CaseStudyContentDTO)
          : buildEmptyCaseStudy(),
      });
    }
  };

  const handleStartBlank = () => {
    setStartedBlankLanguages((current) => [
      ...new Set([...current, activeLangId]),
    ]);
    form.setValue(`translations.${activeLangId}`, {
      title: "",
      description: "",
      caseStudy: buildEmptyCaseStudy(),
    });
  };

  const handleDeleteTranslation = () => {
    setStartedBlankLanguages((current) =>
      current.filter((id) => id !== activeLangId),
    );
    form.setValue(`translations.${activeLangId}`, {
      title: "",
      description: "",
      caseStudy: buildEmptyCaseStudy(),
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Language Bar ─────────────────────────────────────────────── */}
      <AdminFormLanguageBar
        languages={languageProgressList}
        activeLangId={activeLangId}
        onSelectLang={onSelectLang}
        missingItems={missingItems}
        isNonPrimary={isNonPrimary}
        showOriginal={showOriginal}
        onToggleShowOriginal={onToggleShowRef}
        baseLabel={t("baseLanguageLabel")}
        completeProgressText={(ok, total) =>
          t("completeProgress", { completed: ok, total })
        }
        notTranslatedText={(name) => t("notTranslated", { language: name })}
        allCompleteText={t("allComplete")}
        missingFieldsText={(fields) => t("missingFields", { fields })}
        showOriginalText={t("showOriginal")}
      />

      {/* ── Translation Content or Empty Placeholder ─────────────────── */}
      {!hasContent ? (
        <AdminFormEmptyTranslation
          languageName={activeLang?.name ?? ""}
          baseLanguageName={primaryLang?.name ?? primaryLang?.code ?? ""}
          onCopyFromBase={handleCopyFromBase}
          onStartBlank={handleStartBlank}
          notTranslatedTitle={t("notTranslated", {
            language: activeLang?.name ?? "",
          })}
          notTranslatedHint={t("notTranslatedHint", {
            baseLanguage: primaryLang?.name ?? primaryLang?.code ?? "",
          })}
          copyFromBaseText={t("copyFromBase", {
            baseLanguage: primaryLang?.name ?? primaryLang?.code ?? "",
          })}
          startBlankText={t("startBlank")}
        />
      ) : (
        <div className="space-y-6">
          {/* Title Field */}
          <FormField
            control={form.control}
            name={`translations.${activeLangId}.title`}
            render={({ field }) => (
              <div>
                {showOriginal && isNonPrimary && primaryTitle && (
                  <ReferenceSnippet
                    label={primaryLang?.code.toUpperCase() ?? ""}
                    content={primaryTitle}
                    onCopy={() => field.onChange(primaryTitle)}
                    copyText={t("copy")}
                  />
                )}
                <FormItem
                  label={t("titleWithLanguage", {
                    language: activeLang?.name ?? activeLang?.code ?? "",
                  })}
                  inputId={`project-title-${activeLang?.code}`}
                >
                  <Input {...field} id={`project-title-${activeLang?.code}`} />
                </FormItem>
              </div>
            )}
          />

          {/* Description Field */}
          <FormField
            control={form.control}
            name={`translations.${activeLangId}.description`}
            render={({ field }) => (
              <div>
                {showOriginal && isNonPrimary && primaryDesc && (
                  <ReferenceSnippet
                    label={primaryLang?.code.toUpperCase() ?? ""}
                    content={primaryDesc}
                    onCopy={() => field.onChange(primaryDesc)}
                    copyText={t("copy")}
                  />
                )}
                <FormItem
                  label={t("descriptionWithLanguage", {
                    language: activeLang?.name ?? activeLang?.code ?? "",
                  })}
                  inputId={`project-description-${activeLang?.code}`}
                >
                  <Textarea
                    rows={4}
                    {...field}
                    id={`project-description-${activeLang?.code}`}
                  />
                </FormItem>
              </div>
            )}
          />

          {/* Case Study Section */}
          <div className="border-border space-y-4 border-t pt-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-foreground text-sm font-semibold">
                {t("caseStudyContent")}
              </h4>
              <Button
                type="button"
                variant={
                  form.watch("caseStudyEnabled") ? "outline" : "secondary"
                }
                size="sm"
                onClick={() =>
                  form.setValue(
                    "caseStudyEnabled",
                    !form.watch("caseStudyEnabled"),
                  )
                }
                className="h-8 text-xs"
              >
                {form.watch("caseStudyEnabled")
                  ? t("caseStudyUnpublish")
                  : t("caseStudyPublish")}
              </Button>
            </div>

            <FormField
              control={form.control}
              name={`translations.${activeLangId}.caseStudy`}
              render={({ field }) => (
                <CaseStudyNarrativeEditor
                  value={field.value ?? buildEmptyCaseStudy()}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          {/* Delete Translation Action (Non-Primary Only) */}
          {isNonPrimary && (
            <AdminFormDeleteTranslation
              languageName={activeLang?.name ?? ""}
              onDelete={handleDeleteTranslation}
              buttonText={t("deleteTranslation", {
                language: activeLang?.name ?? "",
              })}
              confirmQuestion={t("deleteTranslationConfirm", {
                language: activeLang?.name ?? "",
              })}
              confirmDeleteText={t("delete")}
              cancelText={t("cancel")}
            />
          )}
        </div>
      )}
    </div>
  );
}
