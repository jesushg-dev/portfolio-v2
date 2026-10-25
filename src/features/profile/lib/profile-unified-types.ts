import type { AppLanguage } from "@prisma/client";
import type { ProfileHeroEditorDTO } from "./profile-hero-editor-dto";
import type { TerminalEditorDTO } from "@/features/terminal/lib/types";

export interface ProfileSharedState {
  fullName: string;
  photoUrl: string;
  username: string;
  typingSpeed: number;
  delayBetweenCommands: number;
}

export interface ProfileStepState {
  id: string;
  cmd: string;
}

export interface ProfileLocaleTranslation {
  alt: string;
  badge: string;
  subtitle: string;
  tagline: string;
  summary: string;
  about: string;
  outs: string[];
}

export interface ProfileUnifiedState {
  shared: ProfileSharedState;
  steps: ProfileStepState[];
  translations: Record<string, ProfileLocaleTranslation | null>;
}

export interface ProfileCompletenessCheck {
  id: "subtitle" | "tagline" | "about" | "outputs";
  labelKey: string;
  passed: boolean;
}

export function hasText(value: unknown): boolean {
  return value != null && String(value).trim().length > 0;
}

export function getCompletenessChecks(
  translation: ProfileLocaleTranslation | null | undefined,
  stepCount: number,
): ProfileCompletenessCheck[] {
  if (!translation) {
    return [
      { id: "subtitle", labelKey: "checkSubtitle", passed: false },
      { id: "tagline", labelKey: "checkTagline", passed: false },
      { id: "about", labelKey: "checkAbout", passed: false },
      { id: "outputs", labelKey: "checkOutputs", passed: false },
    ];
  }

  const allOutputsFilled =
    stepCount === 0 ||
    (translation.outs.length >= stepCount &&
      translation.outs.slice(0, stepCount).every(hasText));

  return [
    { id: "subtitle", labelKey: "checkSubtitle", passed: hasText(translation.subtitle) },
    { id: "tagline", labelKey: "checkTagline", passed: hasText(translation.tagline) },
    { id: "about", labelKey: "checkAbout", passed: hasText(translation.about) },
    { id: "outputs", labelKey: "checkOutputs", passed: allOutputsFilled },
  ];
}

export function createBlankLocaleTranslation(stepCount: number): ProfileLocaleTranslation {
  return {
    alt: "",
    badge: "",
    subtitle: "",
    tagline: "",
    summary: "",
    about: "",
    outs: Array.from({ length: stepCount }, () => ""),
  };
}

export interface ProfileValidationError {
  messageKey: string;
  messageParams?: Record<string, string | number>;
  targetTab: "identity" | "about";
  targetLangId?: string;
}
