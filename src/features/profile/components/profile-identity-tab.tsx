"use client";

import { useMemo, useRef, type ChangeEvent, type FC } from "react";
import type { AppLanguage } from "@prisma/client";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/shared/form-root";
import { ProfileField } from "./profile-field";
import {
  AdminFormDeleteTranslation,
  AdminFormEmptyTranslation,
  ReferenceSnippet,
} from "@/components/admin/shared/admin-form-language-bar";
import type {
  ProfileLocaleTranslation,
  ProfileSharedState,
} from "../lib/profile-unified-types";

interface ProfileIdentityTabProps {
  shared: ProfileSharedState;
  onUpdateShared: <K extends keyof ProfileSharedState>(
    key: K,
    val: ProfileSharedState[K],
  ) => void;
  activeLanguage: AppLanguage;
  baseLanguage: AppLanguage;
  currentTranslation: ProfileLocaleTranslation | null;
  baseTranslation: ProfileLocaleTranslation | null;
  showReference: boolean;
  onUpdateTranslation: <K extends keyof ProfileLocaleTranslation>(
    key: K,
    val: ProfileLocaleTranslation[K],
  ) => void;
  onStartBlank: () => void;
  onCopyAllFromBase: () => void;
  onDeleteTranslation: () => void;
  t: {
    sharedSectionTitle: string;
    fullNameLabel: string;
    fullNameHint: string;
    fullNamePlaceholder: string;
    photoUrlLabel: string;
    photoUrlPlaceholder: string;
    photoUrlHint: string;
    uploadButton: string;
    photoAndBadgeSection: string;
    altLabel: string;
    altHint: string;
    altPlaceholder: string;
    badgeLabel: string;
    badgeHint: string;
    badgePlaceholder: string;
    subtitleSection: string;
    subtitleLabel: string;
    subtitleHint: string;
    subtitlePlaceholder: string;
    taglineSection: string;
    taglineLabel: string;
    taglineHint: string;
    taglinePlaceholder: string;
    summaryLabel: string;
    summaryHint: string;
    summaryPlaceholder: string;
    noTranslationTitle: string;
    noTranslationHint: string;
    copyFromBase: string;
    startBlank: string;
    deleteTranslation: string;
    deleteTranslationConfirm: string;
    copySnippet: string;
  };
}

export const ProfileIdentityTab: FC<ProfileIdentityTabProps> = ({
  shared,
  onUpdateShared,
  activeLanguage,
  baseLanguage,
  currentTranslation,
  baseTranslation,
  showReference,
  onUpdateTranslation,
  onStartBlank,
  onCopyAllFromBase,
  onDeleteTranslation,
  t,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNonBase = activeLanguage.id !== baseLanguage.id;

  const initials = useMemo(() => {
    const trimmed = shared.fullName.trim();
    if (!trimmed) return "?";
    return trimmed
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
  }, [shared.fullName]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onUpdateShared("photoUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const copyFieldFromBase = (field: keyof ProfileLocaleTranslation) => {
    if (!baseTranslation) return;
    const baseVal = baseTranslation[field];
    if (typeof baseVal === "string") {
      onUpdateTranslation(field, baseVal);
    }
  };

  return (
    <div className="space-y-8">
      {/* Shared Section: Full Name & Avatar URL */}
      <FormSection title={t.sharedSectionTitle}>
        <ProfileField
          label={`${t.fullNameLabel} *`}
          description={t.fullNameHint}
          inputId="profile-full-name"
        >
          <Input
            id="profile-full-name"
            value={shared.fullName}
            onChange={(e) => onUpdateShared("fullName", e.target.value)}
            placeholder={t.fullNamePlaceholder}
            className="h-11 font-medium"
          />
        </ProfileField>

        <ProfileField
          label={t.photoUrlLabel}
          description={t.photoUrlHint}
          inputId="profile-photo-url"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Live Thumbnail / Avatar Preview */}
            <div className="border-border bg-muted/60 relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border shadow-inner">
              {shared.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shared.photoUrl}
                  alt={shared.fullName}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-muted-foreground text-sm font-semibold tracking-wider">
                  {initials}
                </span>
              )}
            </div>

            <div className="flex flex-1 items-center gap-2">
              <Input
                id="profile-photo-url"
                value={shared.photoUrl}
                onChange={(e) => onUpdateShared("photoUrl", e.target.value)}
                placeholder={t.photoUrlPlaceholder}
                className="h-11 font-mono text-xs sm:text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-11 shrink-0 gap-1.5 px-3 text-xs"
              >
                <Upload className="size-3.5" aria-hidden />
                <span>{t.uploadButton}</span>
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
              tabIndex={-1}
              aria-label={t.uploadButton}
            />
          </div>
        </ProfileField>
      </FormSection>

      {/* Per-Language Sections or Empty Translation Prompt */}
      {!currentTranslation ? (
        <AdminFormEmptyTranslation
          languageName={activeLanguage.name}
          baseLanguageName={baseLanguage.name}
          onCopyFromBase={onCopyAllFromBase}
          onStartBlank={onStartBlank}
          notTranslatedTitle={t.noTranslationTitle}
          notTranslatedHint={t.noTranslationHint}
          copyFromBaseText={t.copyFromBase}
          startBlankText={t.startBlank}
        />
      ) : (
        <>
          {/* Photo Alt & Availability Badge */}
          <FormSection title={t.photoAndBadgeSection}>
            <div className="space-y-4">
              <ProfileField
                label={t.altLabel}
                description={t.altHint}
                inputId="profile-tr-alt"
              >
                {showReference && isNonBase && baseTranslation?.alt && (
                  <ReferenceSnippet
                    label={baseLanguage.code.toUpperCase()}
                    content={baseTranslation.alt}
                    onCopy={() => copyFieldFromBase("alt")}
                    copyText={t.copySnippet}
                  />
                )}
                <Input
                  id="profile-tr-alt"
                  value={currentTranslation.alt}
                  onChange={(e) => onUpdateTranslation("alt", e.target.value)}
                  placeholder={t.altPlaceholder}
                  className="h-11"
                />
              </ProfileField>

              <ProfileField
                label={t.badgeLabel}
                description={t.badgeHint}
                inputId="profile-tr-badge"
              >
                {showReference && isNonBase && baseTranslation?.badge && (
                  <ReferenceSnippet
                    label={baseLanguage.code.toUpperCase()}
                    content={baseTranslation.badge}
                    onCopy={() => copyFieldFromBase("badge")}
                    copyText={t.copySnippet}
                  />
                )}
                <Input
                  id="profile-tr-badge"
                  value={currentTranslation.badge}
                  onChange={(e) => onUpdateTranslation("badge", e.target.value)}
                  placeholder={t.badgePlaceholder}
                  className="h-11"
                />
              </ProfileField>
            </div>
          </FormSection>

          {/* Subtitle Section */}
          <FormSection title={t.subtitleSection}>
            <ProfileField
              label={`${t.subtitleLabel} *`}
              description={t.subtitleHint}
              inputId="profile-tr-subtitle"
            >
              {showReference && isNonBase && baseTranslation?.subtitle && (
                <ReferenceSnippet
                  label={baseLanguage.code.toUpperCase()}
                  content={baseTranslation.subtitle}
                  onCopy={() => copyFieldFromBase("subtitle")}
                  copyText={t.copySnippet}
                />
              )}
              <Input
                id="profile-tr-subtitle"
                value={currentTranslation.subtitle}
                onChange={(e) =>
                  onUpdateTranslation("subtitle", e.target.value)
                }
                placeholder={t.subtitlePlaceholder}
                className="h-11 font-medium"
              />
            </ProfileField>
          </FormSection>

          {/* Tagline & Secondary Summary Section */}
          <FormSection title={t.taglineSection}>
            <div className="space-y-4">
              <ProfileField
                label={`${t.taglineLabel} *`}
                description={t.taglineHint}
                inputId="profile-tr-tagline"
              >
                {showReference && isNonBase && baseTranslation?.tagline && (
                  <ReferenceSnippet
                    label={baseLanguage.code.toUpperCase()}
                    content={baseTranslation.tagline}
                    onCopy={() => copyFieldFromBase("tagline")}
                    copyText={t.copySnippet}
                  />
                )}
                <Textarea
                  id="profile-tr-tagline"
                  rows={3}
                  value={currentTranslation.tagline}
                  onChange={(e) =>
                    onUpdateTranslation("tagline", e.target.value)
                  }
                  placeholder={t.taglinePlaceholder}
                  className="min-h-24 resize-y leading-relaxed"
                />
              </ProfileField>

              <ProfileField
                label={t.summaryLabel}
                description={t.summaryHint}
                inputId="profile-tr-summary"
              >
                {showReference && isNonBase && baseTranslation?.summary && (
                  <ReferenceSnippet
                    label={baseLanguage.code.toUpperCase()}
                    content={baseTranslation.summary}
                    onCopy={() => copyFieldFromBase("summary")}
                    copyText={t.copySnippet}
                  />
                )}
                <Textarea
                  id="profile-tr-summary"
                  rows={3}
                  value={currentTranslation.summary}
                  onChange={(e) =>
                    onUpdateTranslation("summary", e.target.value)
                  }
                  placeholder={t.summaryPlaceholder}
                  className="min-h-20 resize-y leading-relaxed"
                />
              </ProfileField>
            </div>
          </FormSection>

          {/* Non-Base Locale Delete Option */}
          {isNonBase && (
            <AdminFormDeleteTranslation
              languageName={activeLanguage.name}
              onDelete={onDeleteTranslation}
              buttonText={t.deleteTranslation}
              confirmQuestion={t.deleteTranslationConfirm}
            />
          )}
        </>
      )}
    </div>
  );
};
