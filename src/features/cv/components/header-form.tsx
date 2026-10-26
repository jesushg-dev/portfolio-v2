"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { FC, ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Upload, Image as ImageIcon } from "lucide-react";

import { api } from "@/trpc/react";
import {
  AdminFormLanguageBar,
  ReferenceSnippet,
  type LanguageProgress,
} from "@/components/admin/shared/admin-form-language-bar";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";
import {
  buildEmptyTranslationMap,
  textTranslationMapFromRows,
  type TextTranslationMap,
} from "@/lib/i18n/translation-map";
import {
  resolvePrimaryLanguage,
  textTranslationMapSchema,
  TextTranslationMapSchema,
} from "@/lib/i18n/localized-form";
import { CvModalFormSkeleton } from "./cv-modal-form-skeleton";
import type { AppLanguage } from "@prisma/client";

interface HeaderInput {
  fullName: string;
  degree: TextTranslationMap;
  photoUrl?: string;
  backgroundImageUrl?: string;
  availabilityBadge?: TextTranslationMap;
  clientImageAlt?: TextTranslationMap;
}

export const HeaderForm: FC<{
  languages: AppLanguage[];
  onSuccess?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}> = ({ languages, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.header");
  const { data, isLoading } = api.cv.getMine.useQuery();
  const utils = api.useUtils();
  const upsertHeader = api.cv.upsertHeader.useMutation();

  const [isPending, startTransition] = useTransition();
  const [showOriginal, setShowOriginal] = useState(true);

  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );
  const [activeLangId, setActiveLangId] = useState(
    primaryLang?.id ?? languages[0]?.id ?? "",
  );

  const formSchema = useMemo(
    () =>
      z.object({
        fullName: z.string().min(1, "Full name is required"),
        degree: textTranslationMapSchema(primaryLang?.id, t("degree")),
        photoUrl: z.string().url().or(z.literal("")).optional(),
        backgroundImageUrl: z.string().url().or(z.literal("")).optional(),
        availabilityBadge: TextTranslationMapSchema.optional(),
        clientImageAlt: TextTranslationMapSchema.optional(),
      }),
    [primaryLang?.id, t],
  );

  const form = useForm<HeaderInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      degree: buildEmptyTranslationMap(languages, { text: "" }),
      photoUrl: "",
      backgroundImageUrl: "",
      availabilityBadge: buildEmptyTranslationMap(languages, { text: "" }),
      clientImageAlt: buildEmptyTranslationMap(languages, { text: "" }),
    },
  });

  useEffect(() => {
    if (!data) return;
    const header = data.header;
    form.reset({
      fullName: header?.fullName ?? "",
      photoUrl: header?.photoUrl ?? "",
      backgroundImageUrl: header?.backgroundImageUrl ?? "",
      degree: header?.translations
        ? textTranslationMapFromRows(
            languages,
            header.translations,
            (row) => row.degree,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
      availabilityBadge: header?.translations
        ? textTranslationMapFromRows(
            languages,
            header.translations,
            (row) => row.availabilityBadge,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
      clientImageAlt: header?.translations
        ? textTranslationMapFromRows(
            languages,
            header.translations,
            (row) => row.clientImageAlt,
          )
        : buildEmptyTranslationMap(languages, { text: "" }),
    });
  }, [data, form, languages]);

  const isNonPrimary = activeLangId !== primaryLang?.id;

  const watchedDegrees = useWatch({ control: form.control, name: "degree" });

  const watchedBadges = useWatch({
    control: form.control,
    name: "availabilityBadge",
  });
  const watchedAlts = useWatch({
    control: form.control,
    name: "clientImageAlt",
  });

  const watchedPhotoUrl = useWatch({
    control: form.control,
    name: "photoUrl",
  });
  const watchedBackgroundUrl = useWatch({
    control: form.control,
    name: "backgroundImageUrl",
  });

  const handleFileUpload = (
    field: "photoUrl" | "backgroundImageUrl",
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image exceeds 4 MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        form.setValue(field, reader.result, { shouldDirty: true });
      }
    };
    reader.readAsDataURL(file);
  };

  const languageProgressList: LanguageProgress[] = useMemo(() => {
    return languages.map((lang) => {
      const degreeText = watchedDegrees?.[lang.id]?.text?.trim();
      const badgeText = watchedBadges?.[lang.id]?.text?.trim();
      const altText = watchedAlts?.[lang.id]?.text?.trim();

      const completedCount =
        (degreeText ? 1 : 0) + (badgeText ? 1 : 0) + (altText ? 1 : 0);

      return {
        id: lang.id,
        name: lang.name,
        code: lang.code,
        isBase: lang.id === primaryLang?.id,
        hasContent: completedCount > 0,
        completedCount,
        totalCount: 3,
      };
    });
  }, [languages, watchedDegrees, watchedBadges, watchedAlts, primaryLang?.id]);

  const activeProgress = languageProgressList.find(
    (l) => l.id === activeLangId,
  );
  const missingItems: string[] = [];
  if (activeProgress && !watchedDegrees?.[activeLangId]?.text?.trim()) {
    missingItems.push(t("degree"));
  }

  const primaryDegree = watchedDegrees?.[primaryLang?.id ?? ""]?.text;
  const primaryBadge = watchedBadges?.[primaryLang?.id ?? ""]?.text;
  const primaryAlt = watchedAlts?.[primaryLang?.id ?? ""]?.text;

  const onSubmit = useCallback(
    (input: HeaderInput) => {
      startTransition(async () => {
        try {
          await upsertHeader.mutateAsync({
            fullName: input.fullName,
            degree: input.degree,
            photoUrl: input.photoUrl ?? null,
            backgroundImageUrl: input.backgroundImageUrl ?? null,
            availabilityBadge: input.availabilityBadge ?? undefined,
            clientImageAlt: input.clientImageAlt ?? undefined,
          });
          await utils.cv.getMine.invalidate();
          toast.success(t("savedSuccess") || "Saved successfully!");
          onSuccess?.();
        } catch {
          toast.error(t("saveFailed") || "Failed to save");
        }
      });
    },
    [upsertHeader, utils, t, onSuccess],
  );

  if (isLoading) return <CvModalFormSkeleton variant="header" />;

  return (
    <Form {...form}>
      <FormRoot id="cv-header-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent
          error={upsertHeader.error ? upsertHeader.error.message : null}
        >
          {/* Identity Section */}
          <FormSection title={t("sectionTitle")}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem
                    label={t("fullName")}
                    inputId="cv-header-full-name"
                    className="sm:col-span-2"
                  >
                    <Input {...field} />
                  </FormItem>
                )}
              />

              {/* Photo Input with Live Preview */}
              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem
                    label={t("photoUrl")}
                    description="Paste a URL or upload an image (max 4 MB)"
                    inputId="cv-header-photo-url"
                    className="sm:col-span-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="border-border bg-muted/40 relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
                        {watchedPhotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={watchedPhotoUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="text-muted-foreground/50 size-5" />
                        )}
                      </div>
                      <Input
                        type="url"
                        placeholder="https://..."
                        className="min-w-0 flex-1 font-mono text-xs"
                        {...field}
                      />
                      <input
                        ref={photoFileInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleFileUpload("photoUrl", e)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => photoFileInputRef.current?.click()}
                        className="shrink-0 gap-1.5 text-xs"
                      >
                        <Upload className="size-3.5" />
                        Upload
                      </Button>
                    </div>
                  </FormItem>
                )}
              />

              {/* Background Image Input with Live Preview */}
              <FormField
                control={form.control}
                name="backgroundImageUrl"
                render={({ field }) => (
                  <FormItem
                    label="Background image"
                    description="Hero background banner or texture (optional)"
                    inputId="cv-header-bg-url"
                    className="sm:col-span-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="border-border bg-muted/40 relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
                        {watchedBackgroundUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={watchedBackgroundUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="text-muted-foreground/50 size-5" />
                        )}
                      </div>
                      <Input
                        type="url"
                        placeholder="https://..."
                        className="min-w-0 flex-1 font-mono text-xs"
                        {...field}
                      />
                      <input
                        ref={bgFileInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) =>
                          handleFileUpload("backgroundImageUrl", e)
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => bgFileInputRef.current?.click()}
                        className="shrink-0 gap-1.5 text-xs"
                      >
                        <Upload className="size-3.5" />
                        Upload
                      </Button>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          {/* Translatable Section */}
          <FormSection title="Localized Content">
            <AdminFormLanguageBar
              languages={languageProgressList}
              activeLangId={activeLangId}
              onSelectLang={setActiveLangId}
              missingItems={missingItems}
              isNonPrimary={isNonPrimary}
              showOriginal={showOriginal}
              onToggleShowOriginal={setShowOriginal}
            />

            <div className="mt-6 flex flex-col gap-6">
              {/* Group: CV Degree */}
              <div className="border-border/60 space-y-4 border-t pt-4">
                <h4 className="text-foreground text-xs font-semibold tracking-wider uppercase">
                  CV Degree & Title
                </h4>

                {isNonPrimary && showOriginal && primaryDegree ? (
                  <ReferenceSnippet
                    content={primaryDegree}
                    label={t("degree")}
                    onCopy={() =>
                      form.setValue(
                        `degree.${activeLangId}.text`,
                        primaryDegree,
                        { shouldDirty: true },
                      )
                    }
                  />
                ) : null}

                <FormField
                  control={form.control}
                  name={`degree.${activeLangId}.text`}
                  render={({ field }) => (
                    <FormItem
                      label={t("degree")}
                      description="Professional role or degree shown prominently under your name"
                      inputId={`cv-header-degree-${activeLangId}`}
                    >
                      <Input {...field} />
                    </FormItem>
                  )}
                />
              </div>

              {/* Group: Status & Availability */}
              <div className="border-border/60 space-y-4 border-t pt-4">
                <h4 className="text-foreground text-xs font-semibold tracking-wider uppercase">
                  Availability
                </h4>

                {isNonPrimary && showOriginal && primaryBadge ? (
                  <ReferenceSnippet
                    content={primaryBadge}
                    label="Availability Badge"
                    onCopy={() =>
                      form.setValue(
                        `availabilityBadge.${activeLangId}.text`,
                        primaryBadge,
                        { shouldDirty: true },
                      )
                    }
                  />
                ) : null}

                <FormField
                  control={form.control}
                  name={`availabilityBadge.${activeLangId}.text`}
                  render={({ field }) => (
                    <FormItem
                      label="Availability Badge"
                      description="Leave empty to use default availability text"
                      inputId={`cv-header-badge-${activeLangId}`}
                    >
                      <Input {...field} />
                    </FormItem>
                  )}
                />
              </div>

              {/* Group: Accessibility & SEO */}
              <div className="border-border/60 space-y-4 border-t pt-4">
                <h4 className="text-foreground text-xs font-semibold tracking-wider uppercase">
                  Accessibility & SEO
                </h4>

                {isNonPrimary && showOriginal && primaryAlt ? (
                  <ReferenceSnippet
                    content={primaryAlt}
                    label={t("photoAlt") || "Photo Alt Text"}
                    onCopy={() =>
                      form.setValue(
                        `clientImageAlt.${activeLangId}.text`,
                        primaryAlt,
                        { shouldDirty: true },
                      )
                    }
                  />
                ) : null}

                <FormField
                  control={form.control}
                  name={`clientImageAlt.${activeLangId}.text`}
                  render={({ field }) => (
                    <FormItem
                      label={t("photoAlt") || "Photo Alt Text"}
                      description="Descriptive text for screen readers and SEO"
                      inputId={`cv-header-photo-alt-${activeLangId}`}
                    >
                      <Input {...field} />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormSection>
        </FormContent>
        <FormActions
          isPending={
            form.formState.isSubmitting || upsertHeader.isPending || isPending
          }
          title={t("save") || "Save"}
          submitId="cv-header-form-submit"
        >
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t("cancel") || "Cancel"}
            </Button>
          ) : null}
        </FormActions>
      </FormRoot>
    </Form>
  );
};

export default HeaderForm;
