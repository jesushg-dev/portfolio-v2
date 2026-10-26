"use client";

import { type FC, useCallback, useMemo, useState, useTransition } from "react";
import type { AppLanguage } from "@prisma/client";
import { useRouter } from "@/i18n/routing";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";

import { api } from "@/trpc/react";
import { resolvePrimaryLanguage } from "@/lib/i18n/localized-form";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";
import type { RouterOutputs } from "@/trpc/react";

type SectionData = RouterOutputs["softSkillsAdmin"]["getSection"];

interface MetricFormItem {
  id?: string;
  value: string;
  order: number;
  translations: Record<string, { label: string }>;
}

interface MetricItemCardProps {
  index: number;
  total: number;
  value: string;
  label: string;
  onValueChange: (val: string) => void;
  onLabelChange: (val: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  valueLabel: string;
  valuePlaceholder: string;
  labelLabel: string;
  labelPlaceholder: string;
  moveUpLabel: string;
  moveDownLabel: string;
  deleteLabel: string;
}

function MetricItemCard({
  index,
  total,
  value,
  label,
  onValueChange,
  onLabelChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  valueLabel,
  valuePlaceholder,
  labelLabel,
  labelPlaceholder,
  moveUpLabel,
  moveDownLabel,
  deleteLabel,
}: MetricItemCardProps) {
  return (
    <div className="bg-card text-card-foreground border-border space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          #{index + 1}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={index === 0}
            onClick={onMoveUp}
            aria-label={moveUpLabel}
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={index === total - 1}
            onClick={onMoveDown}
            aria-label={moveDownLabel}
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 size-8"
            onClick={onDelete}
            aria-label={deleteLabel}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <FormItem label={valueLabel} inputId={`metric-value-${index}`}>
          <Input
            id={`metric-value-${index}`}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={valuePlaceholder}
          />
        </FormItem>
        <FormItem label={labelLabel} inputId={`metric-label-${index}`}>
          <Input
            id={`metric-label-${index}`}
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder={labelPlaceholder}
          />
        </FormItem>
      </div>
    </div>
  );
}

interface SoftSkillsSectionFormProps {
  initialData: SectionData;
  languages?: AppLanguage[];
}

export const SoftSkillsSectionForm: FC<SoftSkillsSectionFormProps> = ({
  initialData,
  languages,
}) => {
  const t = useTranslations("admin.forms.softSkillsSection");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("general");
  const utils = api.useUtils();
  const upsertSection = api.softSkillsAdmin.upsertSection.useMutation();

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages ?? []),
    [languages],
  );
  const [activeLangId, setActiveLangId] = useState<string>(
    primaryLang?.id ?? "",
  );

  const initialMetrics = useMemo(() => {
    const raw =
      (
        initialData as {
          metrics?: {
            id: string;
            value: string;
            order: number;
            SoftSkillsMetricTranslation?: {
              appLanguageId: string;
              label: string;
            }[];
          }[];
        }
      ).metrics ?? [];

    return raw.map((m, idx) => {
      const translations: Record<string, { label: string }> = {};
      (m.SoftSkillsMetricTranslation ?? []).forEach((tr) => {
        translations[tr.appLanguageId] = { label: tr.label };
      });
      return {
        id: m.id,
        value: m.value,
        order: m.order ?? idx,
        translations,
      };
    });
  }, [initialData]);

  const [metrics, setMetrics] = useState<MetricFormItem[]>(initialMetrics);

  const schema = useMemo(
    () =>
      z.object({
        mediaType: z.enum(["VIDEO", "IMAGE"]),
        videoUrl: z.string().url().or(z.literal("")).optional(),
        posterUrl: z.string().url().or(z.literal("")).optional(),
        imageUrl: z.string().url().or(z.literal("")).optional(),
      }),
    [],
  );

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mediaType: initialData.mediaType,
      videoUrl: initialData.videoUrl ?? "",
      posterUrl: initialData.posterUrl ?? "",
      imageUrl: initialData.imageUrl ?? "",
    },
  });

  const mediaType = useWatch({
    control: form.control,
    name: "mediaType",
  });

  const handleAddMetric = useCallback(() => {
    setMetrics((prev) => [
      ...prev,
      {
        value: "",
        order: prev.length,
        translations: {},
      },
    ]);
  }, []);

  const handleMoveMetric = useCallback((index: number, direction: -1 | 1) => {
    setMetrics((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  }, []);

  const handleDeleteMetric = useCallback((index: number) => {
    setMetrics((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleMetricValueChange = useCallback((index: number, val: string) => {
    setMetrics((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], value: val };
      return copy;
    });
  }, []);

  const handleMetricLabelChange = useCallback(
    (index: number, val: string) => {
      const langKey = activeLangId ?? primaryLang?.id ?? "default";
      setMetrics((prev) => {
        const copy = [...prev];
        const currentTranslations = copy[index].translations ?? {};
        copy[index] = {
          ...copy[index],
          translations: {
            ...currentTranslations,
            [langKey]: { label: val },
          },
        };
        return copy;
      });
    },
    [activeLangId, primaryLang],
  );

  const onSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        try {
          await upsertSection.mutateAsync({
            mediaType: values.mediaType,
            videoUrl: values.videoUrl ?? "",
            posterUrl: values.posterUrl ?? "",
            imageUrl: values.imageUrl ?? "",
            ...(languages && languages.length > 0 ? { metrics } : {}),
          });
          await utils.softSkillsAdmin.getSection.invalidate();
          toast.success(t("savedSuccess"));
          router.back();
        } catch {
          toast.error(t("saveFailed"));
        }
      });
    },
    [languages, metrics, router, t, upsertSection, utils],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-6"
          >
            <TabsList variant="line" className="w-fit justify-start">
              <TabsTrigger value="general">{t("generalTab")}</TabsTrigger>
              {languages && languages.length > 0 && (
                <TabsTrigger value="metrics">
                  {t("metricsTab")}
                  {metrics.length > 0 && (
                    <span className="bg-primary/10 text-primary ml-2 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
                      {metrics.length}
                    </span>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <FormSection title={t("title")} description={t("description")}>
                <FormField
                  control={form.control}
                  name="mediaType"
                  render={({ field }) => (
                    <FormItem
                      label={t("mediaType")}
                      inputId="soft-skills-section-media-type"
                    >
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          id="soft-skills-section-media-type"
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="VIDEO"
                            id="soft-skills-section-media-type-option-VIDEO"
                          >
                            {t("mediaVideo")}
                          </SelectItem>
                          <SelectItem
                            value="IMAGE"
                            id="soft-skills-section-media-type-option-IMAGE"
                          >
                            {t("mediaImage")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {mediaType === "VIDEO" ? (
                  <>
                    <FormField
                      control={form.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem
                          label={t("videoUrl")}
                          inputId="soft-skills-section-video-url"
                        >
                          <Input
                            {...field}
                            placeholder={t("videoUrlPlaceholder")}
                          />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="posterUrl"
                      render={({ field }) => (
                        <FormItem
                          label={t("posterUrl")}
                          description={t("posterUrlHint")}
                          inputId="soft-skills-section-poster-url"
                        >
                          <Input
                            {...field}
                            placeholder={t("posterUrlPlaceholder")}
                          />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem
                        label={t("imageUrl")}
                        inputId="soft-skills-section-image-url"
                      >
                        <Input
                          {...field}
                          placeholder={t("imageUrlPlaceholder")}
                        />
                      </FormItem>
                    )}
                  />
                )}
              </FormSection>
            </TabsContent>

            {languages && languages.length > 0 && (
              <TabsContent value="metrics" className="space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                    <p className="text-muted-foreground text-sm">
                      {t("metricsDescription")}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {languages.map((l) => {
                        const isCurrent =
                          (activeLangId || primaryLang?.id) === l.id;
                        return (
                          <Button
                            key={l.id}
                            type="button"
                            variant={isCurrent ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setActiveLangId(l.id)}
                            className="text-xs"
                          >
                            {l.name}
                            {l.id === primaryLang?.id && (
                              <span className="text-muted-foreground ml-1 text-[0.625rem] uppercase">
                                Base
                              </span>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {metrics.length === 0 ? (
                    <div className="border-border text-muted-foreground rounded-xl border border-dashed py-8 text-center text-sm">
                      {t("noMetrics")}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {metrics.map((m, idx) => {
                        const effectiveLangKey =
                          activeLangId ?? primaryLang?.id ?? "default";
                        const labelText =
                          m.translations[effectiveLangKey]?.label ?? "";
                        return (
                          <MetricItemCard
                            key={m.id ?? idx}
                            index={idx}
                            total={metrics.length}
                            value={m.value}
                            label={labelText}
                            onValueChange={(val) =>
                              handleMetricValueChange(idx, val)
                            }
                            onLabelChange={(val) =>
                              handleMetricLabelChange(idx, val)
                            }
                            onMoveUp={() => handleMoveMetric(idx, -1)}
                            onMoveDown={() => handleMoveMetric(idx, 1)}
                            onDelete={() => handleDeleteMetric(idx)}
                            valueLabel={t("metricValue")}
                            valuePlaceholder={t("metricValuePlaceholder")}
                            labelLabel={t("metricLabel")}
                            labelPlaceholder={t("metricLabelPlaceholder")}
                            moveUpLabel={t("moveUp")}
                            moveDownLabel={t("moveDown")}
                            deleteLabel={t("deleteMetric")}
                          />
                        );
                      })}
                    </div>
                  )}

                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddMetric}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="mr-2 size-4" />
                      {t("addMetric")}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </FormContent>

        <FormActions
          isPending={isPending}
          title={t("save")}
          submitId="soft-skills-section-form-submit"
        >
          <Button variant="ghost" type="button" onClick={() => router.back()}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
