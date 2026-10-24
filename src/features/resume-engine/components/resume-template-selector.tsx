"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RESUME_TEMPLATES,
  CvTemplateVersionSchema,
  type CvTemplateVersion,
} from "../lib/template-registry";
import type { Locale } from "@/i18n/config";

interface Props {
  templateVersion: CvTemplateVersion;
  onTemplateVersionChange: (value: CvTemplateVersion) => void;
  targetLocale: Locale | "auto";
  onTargetLocaleChange: (value: Locale | "auto") => void;
  hasStudioData: boolean;
  studioPreview?: { fullName: string; experienceCount: number } | null;
  compact?: boolean;
}

export function ResumeTemplateSelector({
  templateVersion,
  onTemplateVersionChange,
  targetLocale,
  onTargetLocaleChange,
  hasStudioData,
  studioPreview,
}: Props) {
  const t = useTranslations("admin.resumeStudio");
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        {hasStudioData && studioPreview
          ? t("tailorSourceStudioHint", {
              name: studioPreview.fullName,
              count: studioPreview.experienceCount,
            })
          : t("tailorSourceStudioEmpty")}
      </p>
      <Label>{t("tailorTemplateVersionLabel")}</Label>
      <Tabs
        value={templateVersion}
        onValueChange={(value) =>
          onTemplateVersionChange(CvTemplateVersionSchema.parse(value))
        }
      >
        <TabsList>
          {Object.values(RESUME_TEMPLATES).map((template) => (
            <TabsTrigger key={template.id} value={template.id}>
              {template.id.toUpperCase()} ·{" "}
              {t("tailorTemplatePages", { count: template.pages })}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Label htmlFor="resume-output-locale">{t("tailorOutputLanguage")}</Label>
      <Select
        value={targetLocale}
        onValueChange={(value) => onTargetLocaleChange(value ?? "auto")}
      >
        <SelectTrigger id="resume-output-locale">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">{t("tailorOutputLanguageAuto")}</SelectItem>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Español</SelectItem>
          <SelectItem value="nl">Nederlands</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
