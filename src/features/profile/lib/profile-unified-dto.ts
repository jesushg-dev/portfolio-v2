import type { AppLanguage } from "@prisma/client";
import { resolvePrimaryLanguage } from "@/lib/i18n/localized-form";
import type {
  ProfileAboutEditorDTO,
  ProfileHeroEditorDTO,
} from "./profile-hero-editor-dto";
import type { TerminalEditorDTO } from "@/features/terminal/lib/types";
import {
  type ProfileLocaleTranslation,
  type ProfileStepState,
  type ProfileUnifiedState,
  hasText,
} from "./profile-unified-types";

export function toUnifiedState(
  languages: AppLanguage[],
  hero: ProfileHeroEditorDTO,
  about: ProfileAboutEditorDTO,
  terminal: TerminalEditorDTO | null,
): ProfileUnifiedState {
  const primaryLang = resolvePrimaryLanguage(languages);
  const terminalSteps = terminal?.steps ?? [];

  // Extract shared steps and commands
  const steps: ProfileStepState[] =
    terminalSteps.length > 0
      ? terminalSteps.map((step) => {
          // Find first non-empty command across translations
          const cmd =
            Object.values(step.translations).find((t) => hasText(t.command))
              ?.command ?? "";
          return {
            id: step.id,
            cmd,
          };
        })
      : [
          { id: "step-1", cmd: "whoami" },
          { id: "step-2", cmd: "echo $USER" },
          { id: "step-3", cmd: "cat ~/profile.json" },
        ];

  const translations: Record<string, ProfileLocaleTranslation | null> = {};

  for (const lang of languages) {
    const subtitle = hero.heroSubtitleTranslations?.[lang.id]?.text ?? "";
    const tagline = hero.heroTaglineTranslations?.[lang.id]?.text ?? "";
    const summary = hero.heroSummaryTranslations?.[lang.id]?.text ?? "";
    const alt = hero.clientImageAltTranslations?.[lang.id]?.text ?? "";
    const badge = hero.heroBadgeTranslations?.[lang.id]?.text ?? "";
    const aboutMe = about.aboutMeTranslations?.[lang.id]?.text ?? "";

    const outs: string[] = steps.map((step) => {
      const stepItem = terminalSteps.find((s) => s.id === step.id);
      return stepItem?.translations?.[lang.id]?.output ?? "";
    });

    const hasAnyContent =
      hasText(subtitle) ||
      hasText(tagline) ||
      hasText(summary) ||
      hasText(alt) ||
      hasText(badge) ||
      hasText(aboutMe) ||
      outs.some(hasText);

    const isBase = lang.id === primaryLang?.id;
    if (isBase || hasAnyContent) {
      translations[lang.id] = {
        alt,
        badge,
        subtitle,
        tagline,
        summary,
        about: aboutMe,
        outs,
      };
    } else {
      translations[lang.id] = null;
    }
  }

  return {
    shared: {
      fullName: hero.fullName ?? "",
      photoUrl: hero.photoUrl ?? "",
      username: terminal?.username ?? "Jesus-Macbook",
      typingSpeed: terminal?.typingSpeed ?? 45,
      delayBetweenCommands: terminal?.delayBetweenCommands ?? 1000,
    },
    steps,
    translations,
  };
}

export function toHeroMutationInput(
  state: ProfileUnifiedState,
  languages: AppLanguage[],
) {
  const subtitleMap: Record<string, { text: string }> = {};
  const taglineMap: Record<string, { text: string }> = {};
  const summaryMap: Record<string, { text: string }> = {};
  const altMap: Record<string, { text: string }> = {};
  const badgeMap: Record<string, { text: string }> = {};

  for (const lang of languages) {
    const tr = state.translations[lang.id];
    subtitleMap[lang.id] = { text: tr?.subtitle ?? "" };
    taglineMap[lang.id] = { text: tr?.tagline ?? "" };
    summaryMap[lang.id] = { text: tr?.summary ?? "" };
    altMap[lang.id] = { text: tr?.alt ?? "" };
    badgeMap[lang.id] = { text: tr?.badge ?? "" };
  }

  return {
    fullName: state.shared.fullName.trim(),
    photoUrl: state.shared.photoUrl.trim(),
    heroSubtitleTranslations: subtitleMap,
    heroTaglineTranslations: taglineMap,
    heroSummaryTranslations: summaryMap,
    clientImageAltTranslations: altMap,
    heroBadgeTranslations: badgeMap,
  };
}

export function toAboutMutationInput(
  state: ProfileUnifiedState,
  languages: AppLanguage[],
) {
  const aboutMeMap: Record<string, { text: string }> = {};

  for (const lang of languages) {
    const tr = state.translations[lang.id];
    aboutMeMap[lang.id] = { text: tr?.about ?? "" };
  }

  return {
    aboutMeTranslations: aboutMeMap,
  };
}

export function toTerminalMutationInput(
  state: ProfileUnifiedState,
  languages: AppLanguage[],
) {
  return {
    username: state.shared.username.trim() || "Jesus-Macbook",
    typingSpeed: Math.max(1, state.shared.typingSpeed || 45),
    delayBetweenCommands: Math.max(0, state.shared.delayBetweenCommands || 0),
    steps: state.steps.map((step, index) => {
      const stepTranslations: Record<
        string,
        { command: string; output: string }
      > = {};

      for (const lang of languages) {
        const tr = state.translations[lang.id];
        stepTranslations[lang.id] = {
          command: step.cmd.trim(),
          output: tr?.outs[index] ?? "",
        };
      }

      return {
        order: index,
        translations: stepTranslations,
      };
    }),
  };
}
