"use client";

import { useMemo, useRef, type ChangeEvent, type FC } from "react";
import type { AppLanguage } from "@prisma/client";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormItem, FormSection } from "@/components/shared/form-root";
import { ProfileReferenceBox } from "./profile-reference-box";
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
    confirmDeleteButton: string;
    cancelButton: string;
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

  const copyFieldFromBase = (fieldKey: keyof ProfileLocaleTranslation) => {
    if (!baseTranslation) return;
    const val = baseTranslation[fieldKey];
    onUpdateTranslation(fieldKey, val);
  };

  return (
    <div className="space-y-8">
      {/* Shared Identity Section (Name & Photo) */}
      <FormSection title={t.sharedSectionTitle}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Avatar Preview */}
          <div className="bg-primary/20 text-primary ring-primary/30 relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full text-lg font-bold shadow-sm ring-2">
            {shared.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shared.photoUrl}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Display Name Input */}
          <div className="min-w-0 flex-1">
            <FormItem
              label={`${t.fullNameLabel} *`}
              description={t.fullNameHint}
              inputId="profile-shared-fullname"
            >
              <Input
                id="profile-shared-fullname"
                value={shared.fullName}
                onChange={(e) => onUpdateShared("fullName", e.target.value)}
                placeholder={t.fullNamePlaceholder}
                className="h-11 font-medium"
              />
            </FormItem>
          </div>
        </div>

        {/* Photo URL & Upload */}
        <FormItem
          label={t.photoUrlLabel}
          description={t.photoUrlHint}
          inputId="profile-shared-photourl"
          className="mt-4"
        >
          <div className="flex gap-2">
            <Input
              id="profile-shared-photourl"
              type="text"
              value={shared.photoUrl}
              onChange={(e) => onUpdateShared("photoUrl", e.target.value)}
              placeholder={t.photoUrlPlaceholder}
              className="h-11 min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-11 shrink-0 gap-1.5"
            >
              <Upload className="size-4" aria-hidden />
              <span>{t.uploadButton}</span>
            </Button>
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
        </FormItem>
      </FormSection>

      {/* Per-Language Sections or Empty Translation Prompt */}
      {!currentTranslation ? (
        <div className="border-border/60 bg-muted/10 rounded-2xl border border-dashed px-5 py-12 text-center">
          <p className="text-foreground text-base font-semibold">
            {t.noTranslationTitle.replace("{lang}", activeLanguage.name)}
          </p>
          <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-xs sm:text-sm">
            {t.noTranslationHint.replace("{baseLang}", baseLanguage.name)}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="default"
              onClick={onCopyAllFromBase}
              className="min-h-10 text-xs sm:text-sm"
            >
              {t.copyFromBase.replace("{baseLang}", baseLanguage.name)}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onStartBlank}
              className="min-h-10 text-xs sm:text-sm"
            >
              {t.startBlank}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Photo Alt & Availability Badge */}
          <FormSection title={t.photoAndBadgeSection}>
            <div className="space-y-4">
              <FormItem
                label={t.altLabel}
                description={t.altHint}
                inputId="profile-tr-alt"
              >
                {showReference && isNonBase && baseTranslation && (
                  <ProfileReferenceBox
                    baseLanguageCode={baseLanguage.code}
                    referenceText={baseTranslation.alt}
                    onCopy={() => copyFieldFromBase("alt")}
                    copyLabel={t.copySnippet}
                  />
                )}
                <Input
                  id="profile-tr-alt"
                  value={currentTranslation.alt}
                  onChange={(e) => onUpdateTranslation("alt", e.target.value)}
                  placeholder={t.altPlaceholder}
                  className="h-11"
                />
              </FormItem>

              <FormItem
                label={t.badgeLabel}
                description={t.badgeHint}
                inputId="profile-tr-badge"
              >
                {showReference && isNonBase && baseTranslation && (
                  <ProfileReferenceBox
                    baseLanguageCode={baseLanguage.code}
                    referenceText={baseTranslation.badge}
                    onCopy={() => copyFieldFromBase("badge")}
                    copyLabel={t.copySnippet}
                  />
                )}
                <Input
                  id="profile-tr-badge"
                  value={currentTranslation.badge}
                  onChange={(e) => onUpdateTranslation("badge", e.target.value)}
                  placeholder={t.badgePlaceholder}
                  className="h-11"
                />
              </FormItem>
            </div>
          </FormSection>

          {/* Subtitle Section */}
          <FormSection title={t.subtitleSection}>
            <FormItem
              label={`${t.subtitleLabel} *`}
              description={t.subtitleHint}
              inputId="profile-tr-subtitle"
            >
              {showReference && isNonBase && baseTranslation && (
                <ProfileReferenceBox
                  baseLanguageCode={baseLanguage.code}
                  referenceText={baseTranslation.subtitle}
                  onCopy={() => copyFieldFromBase("subtitle")}
                  copyLabel={t.copySnippet}
                />
              )}
              <Input
                id="profile-tr-subtitle"
                value={currentTranslation.subtitle}
                onChange={(e) => onUpdateTranslation("subtitle", e.target.value)}
                placeholder={t.subtitlePlaceholder}
                className="h-11 font-medium"
              />
            </FormItem>
          </FormSection>

          {/* Tagline & Secondary Summary Section */}
          <FormSection title={t.taglineSection}>
            <div className="space-y-4">
              <FormItem
                label={`${t.taglineLabel} *`}
                description={t.taglineHint}
                inputId="profile-tr-tagline"
              >
                {showReference && isNonBase && baseTranslation && (
                  <ProfileReferenceBox
                    baseLanguageCode={baseLanguage.code}
                    referenceText={baseTranslation.tagline}
                    onCopy={() => copyFieldFromBase("tagline")}
                    copyLabel={t.copySnippet}
                  />
                )}
                <Textarea
                  id="profile-tr-tagline"
                  rows={3}
                  value={currentTranslation.tagline}
                  onChange={(e) => onUpdateTranslation("tagline", e.target.value)}
                  placeholder={t.taglinePlaceholder}
                  className="min-h-24 resize-y leading-relaxed"
                />
              </FormItem>

              <FormItem
                label={t.summaryLabel}
                description={t.summaryHint}
                inputId="profile-tr-summary"
              >
                {showReference && isNonBase && baseTranslation && (
                  <ProfileReferenceBox
                    baseLanguageCode={baseLanguage.code}
                    referenceText={baseTranslation.summary}
                    onCopy={() => copyFieldFromBase("summary")}
                    copyLabel={t.copySnippet}
                  />
                )}
                <Textarea
                  id="profile-tr-summary"
                  rows={3}
                  value={currentTranslation.summary}
                  onChange={(e) => onUpdateTranslation("summary", e.target.value)}
                  placeholder={t.summaryPlaceholder}
                  className="min-h-20 resize-y leading-relaxed"
                />
              </FormItem>
            </div>
          </FormSection>

          {/* Non-Base Locale Delete Option */}
          {isNonBase && (
            <div className="border-border/80 border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (
                    window.confirm(
                      t.deleteTranslationConfirm.replace(
                        "{lang}",
                        activeLanguage.name,
                      ),
                    )
                  ) {
                    onDeleteTranslation();
                  }
                }}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-auto p-0 text-xs font-normal underline-offset-4 hover:underline"
              >
                {t.deleteTranslation.replace("{lang}", activeLanguage.name)}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
