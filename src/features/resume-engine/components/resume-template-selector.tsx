"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  RESUME_TEMPLATES,
  type CvTemplateVersion,
} from "../lib/template-registry";
import type { Locale } from "@/i18n/config";
import { ResumeTemplateThumbnail } from "./resume-template-thumbnail";
import { ResumeOptionCard } from "./resume-option-card";

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
  const templateRadioGroupRef = useRef<HTMLDivElement>(null);
  const languageRadioGroupRef = useRef<HTMLDivElement>(null);

  const templatesList = Object.values(RESUME_TEMPLATES);

  const languageOptions = useMemo(
    (): {
      id: Locale | "auto";
      title: string;
      subtitle: string;
      code: string;
      isAuto?: boolean;
    }[] => [
      {
        id: "auto",
        title: "Auto",
        subtitle: t("tailorOutputLanguageAuto"),
        code: "AUTO",
        isAuto: true,
      },
      {
        id: "en",
        title: "English",
        subtitle: "EN",
        code: "EN",
      },
      {
        id: "es",
        title: "Español",
        subtitle: "ES",
        code: "ES",
      },
      {
        id: "nl",
        title: "Nederlands",
        subtitle: "NL",
        code: "NL",
      },
    ],
    [t],
  );

  const handleTemplateKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      let nextIndex = currentIndex;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % templatesList.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex =
          (currentIndex - 1 + templatesList.length) % templatesList.length;
      }

      if (nextIndex !== currentIndex && templatesList[nextIndex]) {
        const nextTemplate = templatesList[nextIndex];
        onTemplateVersionChange(nextTemplate.id);
        const buttons =
          templateRadioGroupRef.current?.querySelectorAll<HTMLButtonElement>(
            "button[role='radio']",
          );
        buttons?.[nextIndex]?.focus();
      }
    },
    [onTemplateVersionChange, templatesList],
  );

  const handleLanguageKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      let nextIndex = currentIndex;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % languageOptions.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex =
          (currentIndex - 1 + languageOptions.length) % languageOptions.length;
      }

      if (nextIndex !== currentIndex && languageOptions[nextIndex]) {
        const nextLang = languageOptions[nextIndex];
        onTargetLocaleChange(nextLang.id);
        const buttons =
          languageRadioGroupRef.current?.querySelectorAll<HTMLButtonElement>(
            "button[role='radio']",
          );
        buttons?.[nextIndex]?.focus();
      }
    },
    [languageOptions, onTargetLocaleChange],
  );

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

      {/* CV Template Selector */}
      <div className="space-y-2">
        <Label>{t("tailorTemplateVersionLabel")}</Label>
        <div
          ref={templateRadioGroupRef}
          role="radiogroup"
          aria-label={t("tailorTemplateVersionLabel")}
          className="grid grid-cols-2 gap-3"
        >
          {templatesList.map((template, index) => {
            const templateId = template.id;
            const titleKey = `templates.${templateId}.title`;
            const subtitleKey = `templates.${templateId}.subtitle`;

            const has = (key: string) => (t.has ? t.has(key as never) : false);

            const title = has(titleKey)
              ? t(titleKey as never)
              : `${templateId.toUpperCase()} · ${t("tailorTemplatePages", { count: template.pages })}`;

            const subtitle = has(subtitleKey)
              ? t(subtitleKey as never)
              : t("tailorTemplatePages", { count: template.pages });

            const pageCountLabel = t("tailorTemplatePages", {
              count: template.pages,
            });

            return (
              <ResumeOptionCard
                key={template.id}
                selected={templateVersion === template.id}
                onSelect={() =>
                  onTemplateVersionChange(template.id)
                }
                title={title}
                subtitle={subtitle}
                badge={
                  <>
                    <Badge
                      variant="outline"
                      className="h-4 px-1 text-[0.5625rem] font-medium"
                    >
                      {pageCountLabel}
                    </Badge>
                    {template.recommended ? (
                      <Badge
                        variant="default"
                        className="h-4 gap-0.5 px-1 text-[0.5625rem] font-medium"
                      >
                        <Sparkles className="size-2" />
                        <span>{t("tailorTemplateRecommended")}</span>
                      </Badge>
                    ) : null}
                  </>
                }
                icon={
                  <ResumeTemplateThumbnail
                    version={template.id}
                    selected={templateVersion === template.id}
                  />
                }
                onKeyDown={(e) => handleTemplateKeyDown(e, index)}
              />
            );
          })}
        </div>
      </div>

      {/* Output Language Selector (Rich 4-Card Option Bar) */}
      <div className="space-y-2">
        <Label>{t("tailorOutputLanguage")}</Label>
        <div
          ref={languageRadioGroupRef}
          role="radiogroup"
          aria-label={t("tailorOutputLanguage")}
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
        >
          {languageOptions.map((lang, index) => {
            const isSelected = targetLocale === lang.id;
            return (
              <ResumeOptionCard
                key={lang.id}
                selected={isSelected}
                onSelect={() => onTargetLocaleChange(lang.id)}
                title={lang.title}
                subtitle={lang.subtitle}
                indicatorSize="sm"
                icon={
                  lang.isAuto ? (
                    <Sparkles className="size-3.5 text-primary" />
                  ) : (
                    <span className="font-mono text-[0.625rem] font-bold text-muted-foreground uppercase">
                      {lang.code}
                    </span>
                  )
                }
                iconWellClassName="size-8 rounded-md bg-muted/40 p-0"
                onKeyDown={(e) => handleLanguageKeyDown(e, index)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
