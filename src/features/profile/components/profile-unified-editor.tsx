"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import type { AppLanguage } from "@prisma/client";
import { useTranslations } from "next-intl";
import { Code2, User } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolvePrimaryLanguage } from "@/lib/i18n/localized-form";
import type {
  ProfileAboutEditorDTO,
  ProfileHeroEditorDTO,
} from "../lib/profile-hero-editor-dto";
import type { TerminalEditorDTO } from "@/features/terminal/lib/types";
import {
  createBlankLocaleTranslation,
  hasText,
  getCompletenessChecks,
  type ProfileLocaleTranslation,
  type ProfileSharedState,
  type ProfileUnifiedState,
} from "../lib/profile-unified-types";
import {
  toAboutMutationInput,
  toHeroMutationInput,
  toTerminalMutationInput,
  toUnifiedState,
} from "../lib/profile-unified-dto";
import {
  AdminFormLanguageBar,
  type LanguageProgress,
} from "@/components/admin/shared/admin-form-language-bar";
import { ProfileHeroLivePreview } from "./profile-hero-live-preview";
import { ProfileAboutLivePreview } from "./profile-about-live-preview";
import { ProfileIdentityTab } from "./profile-identity-tab";
import { ProfileAboutTab } from "./profile-about-tab";
import { ProfileSaveBar } from "./profile-save-bar";

interface ProfileUnifiedEditorProps {
  languages: AppLanguage[];
  initialHero: ProfileHeroEditorDTO;
  initialAbout: ProfileAboutEditorDTO;
  initialTerminal: TerminalEditorDTO | null;
  initialTab?: "identity" | "about";
}

export const ProfileUnifiedEditor: FC<ProfileUnifiedEditorProps> = ({
  languages,
  initialHero,
  initialAbout,
  initialTerminal,
  initialTab = "identity",
}) => {
  const t = useTranslations("admin.profile");
  const utils = api.useUtils();

  const baseLanguage = useMemo(() => {
    const primaryRef = resolvePrimaryLanguage(languages);
    return languages.find((l) => l.id === primaryRef?.id) ?? languages[0];
  }, [languages]);

  const [activeTab, setActiveTab] = useState<"identity" | "about">(initialTab);
  const [activeLangId, setActiveLangId] = useState<string>(baseLanguage.id);
  const [showReference, setShowReference] = useState(true);

  const handleTabChange = useCallback((tab: "identity" | "about") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const targetPath =
        tab === "about"
          ? currentPath.endsWith("/about")
            ? currentPath
            : `${currentPath.replace(/\/$/, "")}/about`
          : currentPath.replace(/\/about\/?$/, "") || "/";
      window.history.replaceState(null, "", targetPath);
    }
  }, []);

  // Initialize unified state from server DTOs
  const initialUnifiedState = useMemo(
    () => toUnifiedState(languages, initialHero, initialAbout, initialTerminal),
    [languages, initialHero, initialAbout, initialTerminal],
  );

  const [state, setState] = useState<ProfileUnifiedState>(initialUnifiedState);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() =>
    JSON.stringify(initialUnifiedState),
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty = useMemo(
    () => JSON.stringify(state) !== savedSnapshot,
    [state, savedSnapshot],
  );

  // TRPC Mutations
  const upsertHero = api.profileAdmin.upsertHero.useMutation();
  const upsertAbout = api.profileAdmin.upsertAbout.useMutation();
  const upsertTerminal = api.terminal.upsert.useMutation();

  const activeLanguage = useMemo(
    () => languages.find((l) => l.id === activeLangId) ?? baseLanguage,
    [languages, activeLangId, baseLanguage],
  );

  const currentTranslation = state.translations[activeLangId] ?? null;
  const baseTranslation = state.translations[baseLanguage.id] ?? null;

  const languageProgress = useMemo<LanguageProgress[]>(() => {
    return languages.map((lang) => {
      const tr = state.translations[lang.id];
      const checks = getCompletenessChecks(tr, state.steps.length);
      const passedCount = checks.filter((c) => c.passed).length;
      const totalCount = checks.length;
      const isBase = lang.id === baseLanguage.id;
      const hasContent = tr !== null;

      return {
        id: lang.id,
        name: lang.name,
        code: lang.code,
        isBase,
        hasContent,
        completedCount: passedCount,
        totalCount,
      };
    });
  }, [languages, state.translations, state.steps.length, baseLanguage.id]);

  const activeChecks = useMemo(
    () => getCompletenessChecks(currentTranslation, state.steps.length),
    [currentTranslation, state.steps.length],
  );

  const missingItems = useMemo(() => {
    if (!currentTranslation) return [];
    const checkLabels: Record<string, string> = {
      checkSubtitle: t("checkSubtitle"),
      checkTagline: t("checkTagline"),
      checkAbout: t("checkAbout"),
      checkOutputs: t("checkOutputs"),
    };
    return activeChecks
      .filter((c) => !c.passed)
      .map((c) => checkLabels[c.labelKey] ?? c.id);
  }, [currentTranslation, activeChecks, t]);

  // State update handlers
  const handleUpdateShared = useCallback(
    <K extends keyof ProfileSharedState>(
      key: K,
      val: ProfileSharedState[K],
    ) => {
      setValidationError(null);
      setState((prev) => ({
        ...prev,
        shared: { ...prev.shared, [key]: val },
      }));
    },
    [],
  );

  const handleUpdateTranslation = useCallback(
    <K extends keyof ProfileLocaleTranslation>(
      key: K,
      val: ProfileLocaleTranslation[K],
    ) => {
      setValidationError(null);
      setState((prev) => {
        const existing =
          prev.translations[activeLangId] ??
          createBlankLocaleTranslation(prev.steps.length);
        return {
          ...prev,
          translations: {
            ...prev.translations,
            [activeLangId]: { ...existing, [key]: val },
          },
        };
      });
    },
    [activeLangId],
  );

  const handleStartBlank = useCallback(() => {
    setValidationError(null);
    setState((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [activeLangId]: createBlankLocaleTranslation(prev.steps.length),
      },
    }));
  }, [activeLangId]);

  const handleCopyAllFromBase = useCallback(() => {
    setValidationError(null);
    setState((prev) => {
      const base = prev.translations[baseLanguage.id];
      if (!base) return prev;
      return {
        ...prev,
        translations: {
          ...prev.translations,
          [activeLangId]: {
            ...base,
            outs: [...base.outs],
          },
        },
      };
    });
  }, [activeLangId, baseLanguage.id]);

  const handleDeleteTranslation = useCallback(() => {
    if (activeLangId === baseLanguage.id) return;
    setValidationError(null);
    setState((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [activeLangId]: null,
      },
    }));
  }, [activeLangId, baseLanguage.id]);

  // Terminal steps handlers
  const handleAddStep = useCallback(() => {
    setValidationError(null);
    const newId = `step-${Date.now()}`;
    setState((prev) => {
      const nextSteps = [...prev.steps, { id: newId, cmd: "" }];
      const nextTranslations = { ...prev.translations };

      for (const lang of languages) {
        const tr = nextTranslations[lang.id];
        if (tr) {
          nextTranslations[lang.id] = {
            ...tr,
            outs: [...tr.outs, ""],
          };
        }
      }

      return {
        ...prev,
        steps: nextSteps,
        translations: nextTranslations,
      };
    });
  }, [languages]);

  const handleRemoveStep = useCallback(
    (index: number) => {
      setValidationError(null);
      setState((prev) => {
        const nextSteps = prev.steps.filter((_, i) => i !== index);
        const nextTranslations = { ...prev.translations };

        for (const lang of languages) {
          const tr = nextTranslations[lang.id];
          if (tr) {
            nextTranslations[lang.id] = {
              ...tr,
              outs: tr.outs.filter((_, i) => i !== index),
            };
          }
        }

        return {
          ...prev,
          steps: nextSteps,
          translations: nextTranslations,
        };
      });
    },
    [languages],
  );

  const handleMoveStep = useCallback(
    (index: number, direction: -1 | 1) => {
      const targetIndex = index + direction;
      setValidationError(null);
      setState((prev) => {
        if (targetIndex < 0 || targetIndex >= prev.steps.length) return prev;

        const nextSteps = [...prev.steps];
        const tempStep = nextSteps[index];
        nextSteps[index] = nextSteps[targetIndex]!;
        nextSteps[targetIndex] = tempStep;

        const nextTranslations = { ...prev.translations };

        for (const lang of languages) {
          const tr = nextTranslations[lang.id];
          if (tr) {
            const nextOuts = [...tr.outs];
            const tempOut = nextOuts[index] ?? "";
            nextOuts[index] = nextOuts[targetIndex] ?? "";
            nextOuts[targetIndex] = tempOut;
            nextTranslations[lang.id] = {
              ...tr,
              outs: nextOuts,
            };
          }
        }

        return {
          ...prev,
          steps: nextSteps,
          translations: nextTranslations,
        };
      });
    },
    [languages],
  );

  const handleUpdateStepCmd = useCallback((index: number, cmd: string) => {
    setValidationError(null);
    setState((prev) => {
      const nextSteps = [...prev.steps];
      if (nextSteps[index]) {
        nextSteps[index] = { ...nextSteps[index], cmd };
      }
      return { ...prev, steps: nextSteps };
    });
  }, []);

  const handleUpdateStepOutput = useCallback(
    (index: number, output: string) => {
      setValidationError(null);
      setState((prev) => {
        const tr =
          prev.translations[activeLangId] ??
          createBlankLocaleTranslation(prev.steps.length);
        const nextOuts = [...tr.outs];
        nextOuts[index] = output;

        return {
          ...prev,
          translations: {
            ...prev.translations,
            [activeLangId]: { ...tr, outs: nextOuts },
          },
        };
      });
    },
    [activeLangId],
  );

  // Discard handler
  const handleDiscard = useCallback(() => {
    setState(JSON.parse(savedSnapshot) as ProfileUnifiedState);
    setValidationError(null);
  }, [savedSnapshot]);

  // Validation
  const validate = useCallback((): boolean => {
    if (!hasText(state.shared.fullName)) {
      setValidationError(t("missingDisplayName"));
      setActiveTab("identity");
      return false;
    }

    const baseTr = state.translations[baseLanguage.id];
    if (!baseTr || !hasText(baseTr.subtitle)) {
      setValidationError(t("missingSubtitle", { lang: baseLanguage.name }));
      setActiveTab("identity");
      setActiveLangId(baseLanguage.id);
      return false;
    }

    if (!hasText(baseTr.tagline)) {
      setValidationError(t("missingTagline", { lang: baseLanguage.name }));
      setActiveTab("identity");
      setActiveLangId(baseLanguage.id);
      return false;
    }

    if (!hasText(baseTr.about)) {
      setValidationError(t("missingAbout", { lang: baseLanguage.name }));
      setActiveTab("about");
      setActiveLangId(baseLanguage.id);
      return false;
    }

    if (state.shared.typingSpeed < 1) {
      setValidationError(t("speedMinError"));
      setActiveTab("about");
      return false;
    }

    if (state.shared.delayBetweenCommands < 0) {
      setValidationError(t("delayMinError"));
      setActiveTab("about");
      return false;
    }

    for (let i = 0; i < state.steps.length; i++) {
      const step = state.steps[i];
      const hasAnyOutput = languages.some((l) =>
        hasText(state.translations[l.id]?.outs[i]),
      );
      if (hasAnyOutput && !hasText(step.cmd)) {
        setValidationError(t("stepMissingCmd", { n: i + 1 }));
        setActiveTab("about");
        return false;
      }
    }

    return true;
  }, [baseLanguage.id, baseLanguage.name, languages, state, t]);

  // Save handler
  const handleSave = useCallback(() => {
    if (!validate()) return;

    startTransition(async () => {
      setValidationError(null);
      try {
        const heroInput = toHeroMutationInput(state, languages);
        const aboutInput = toAboutMutationInput(state, languages);
        const terminalInput = toTerminalMutationInput(state, languages);

        await Promise.all([
          upsertHero.mutateAsync(heroInput),
          upsertAbout.mutateAsync(aboutInput),
          upsertTerminal.mutateAsync(terminalInput),
        ]);

        await Promise.all([
          utils.profileAdmin.getHeroEditor.invalidate(),
          utils.profileAdmin.getAboutEditor.invalidate(),
          utils.terminal.getMine.invalidate(),
          utils.portfolio.invalidate(),
        ]);

        setSavedSnapshot(JSON.stringify(state));
        toast.success(t("savedSuccess"));
      } catch (err) {
        setValidationError(
          err instanceof Error ? err.message : t("saveFailed"),
        );
        toast.error(t("saveFailed"));
      }
    });
  }, [
    languages,
    state,
    t,
    upsertAbout,
    upsertHero,
    upsertTerminal,
    utils,
    validate,
  ]);

  return (
    <div className="relative space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      {/* Canonical Line Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => handleTabChange(val as "identity" | "about")}
        className="w-full"
      >
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto border-b"
        >
          <TabsTrigger value="identity" className="min-h-12 gap-2 px-4 text-sm">
            <User className="size-4" aria-hidden />
            <span>{t("tabIdentity")}</span>
          </TabsTrigger>
          <TabsTrigger value="about" className="min-h-12 gap-2 px-4 text-sm">
            <Code2 className="size-4" aria-hidden />
            <span>{t("tabAbout")}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Reusable Admin Form Language Bar */}
      <AdminFormLanguageBar
        languages={languageProgress}
        activeLangId={activeLangId}
        onSelectLang={setActiveLangId}
        missingItems={missingItems}
        isNonPrimary={activeLangId !== baseLanguage.id}
        showOriginal={showReference}
        onToggleShowOriginal={setShowReference}
        baseLabel={t("baseBadge")}
        completeProgressText={(ok, total) =>
          `${ok}/${total} ${t("completeStatus")}`
        }
        notTranslatedText={() => t("noTranslationBadge")}
        allCompleteText={t("allComplete")}
        missingFieldsText={(fields) => `${t("missingPrefix")}: ${fields}`}
        showOriginalText={t("showReference")}
      />

      {/* Mobile Live Preview Accordion */}
      <details className="border-border/80 bg-card/60 mb-6 rounded-2xl border lg:hidden">
        <summary className="text-foreground cursor-pointer p-4 text-sm font-semibold">
          {t("previewHeading")}
        </summary>
        <div className="p-4 pt-0">
          {activeTab === "identity" ? (
            <ProfileHeroLivePreview
              fullName={state.shared.fullName}
              photoUrl={state.shared.photoUrl}
              currentTranslation={currentTranslation}
              baseTranslation={baseTranslation}
              isNonBase={activeLangId !== baseLanguage.id}
              t={{
                fallbackNotice: t("fallbackNotice", {
                  baseLang: baseLanguage.name,
                }),
                defaultBadge: t("defaultBadge"),
                previewHeading: t("previewHeading"),
              }}
            />
          ) : (
            <ProfileAboutLivePreview
              username={state.shared.username}
              typingSpeed={state.shared.typingSpeed}
              delayBetweenCommands={state.shared.delayBetweenCommands}
              steps={state.steps}
              currentTranslation={currentTranslation}
              baseTranslation={baseTranslation}
              t={{
                aboutTitle: t("aboutMeTitle"),
                noAboutText: t("aboutPlaceholder"),
                play: t("play"),
                playing: t("playing"),
                reset: t("reset"),
              }}
            />
          )}
        </div>
      </details>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left Column: Active Tab Form */}
        <div className="min-w-0">
          {activeTab === "identity" ? (
            <ProfileIdentityTab
              shared={state.shared}
              onUpdateShared={handleUpdateShared}
              activeLanguage={activeLanguage}
              baseLanguage={baseLanguage}
              currentTranslation={currentTranslation}
              baseTranslation={baseTranslation}
              showReference={showReference}
              onUpdateTranslation={handleUpdateTranslation}
              onStartBlank={handleStartBlank}
              onCopyAllFromBase={handleCopyAllFromBase}
              onDeleteTranslation={handleDeleteTranslation}
              t={{
                sharedSectionTitle: t("heroSection"),
                fullNameLabel: t("fullNameLabel"),
                fullNameHint: t("aboutDescriptionHint"),
                fullNamePlaceholder: t("fullNamePlaceholder"),
                photoUrlLabel: t("photoUrlLabel"),
                photoUrlPlaceholder: t("photoUrlPlaceholder"),
                photoUrlHint: t("uploadHint"),
                uploadButton: t("uploadButton"),
                photoAndBadgeSection: t("photoAndBadgeSection"),
                altLabel: t("altTextLabel"),
                altHint: t("altTextHint"),
                altPlaceholder: t("altTextPlaceholder"),
                badgeLabel: t("heroBadgeLabel"),
                badgeHint: t("heroBadgeHint"),
                badgePlaceholder: t("heroBadgePlaceholder"),
                subtitleSection: t("subtitleSection"),
                subtitleLabel: t("heroSubtitleLabel"),
                subtitleHint: t("heroSubtitleHint"),
                subtitlePlaceholder: t("heroSubtitlePlaceholder"),
                taglineSection: t("taglineSection"),
                taglineLabel: t("heroTaglineLabel"),
                taglineHint: t("heroTaglineHint"),
                taglinePlaceholder: t("heroTaglinePlaceholder"),
                summaryLabel: t("heroSummaryLabel"),
                summaryHint: t("heroSummaryHint"),
                summaryPlaceholder: t("heroSummaryPlaceholder"),
                noTranslationTitle: t("noTranslationTitle", {
                  lang: activeLanguage.name,
                }),
                noTranslationHint: t("noTranslationHint", {
                  baseLang: baseLanguage.name,
                }),
                copyFromBase: t("copyFromBase", {
                  baseLang: baseLanguage.name,
                }),
                startBlank: t("startBlank"),
                deleteTranslation: t("deleteTranslation", {
                  lang: activeLanguage.name,
                }),
                deleteTranslationConfirm: t("deleteTranslationConfirm", {
                  lang: activeLanguage.name,
                }),
                copySnippet: t("copySnippet"),
              }}
            />
          ) : (
            <ProfileAboutTab
              shared={state.shared}
              onUpdateShared={handleUpdateShared}
              steps={state.steps}
              onAddStep={handleAddStep}
              onRemoveStep={handleRemoveStep}
              onMoveStep={handleMoveStep}
              onUpdateStepCmd={handleUpdateStepCmd}
              onUpdateStepOutput={handleUpdateStepOutput}
              activeLanguage={activeLanguage}
              baseLanguage={baseLanguage}
              currentTranslation={currentTranslation}
              baseTranslation={baseTranslation}
              showReference={showReference}
              onUpdateTranslation={handleUpdateTranslation}
              onStartBlank={handleStartBlank}
              onCopyAllFromBase={handleCopyAllFromBase}
              onDeleteTranslation={handleDeleteTranslation}
              t={{
                aboutSectionTitle: t("aboutMeTitle"),
                boldHelper: t("boldHelper"),
                boldHint: t("boldHint"),
                aboutLabel: t("aboutBioTitle"),
                aboutHint: t("aboutBioSubtitle"),
                aboutPlaceholder: t("aboutPlaceholder"),
                terminalSettingsTitle: t("console.settingsTitle"),
                terminalSettingsHint: t("console.settingsDescription"),
                usernameLabel: t("console.usernameLabel"),
                typingSpeedLabel: t("console.typingSpeedLabel"),
                delayLabel: t("console.delayLabel"),
                commandSequenceTitle: t("console.stepsTitle"),
                commandSequenceHint: t("commandSequenceHint"),
                stepNumber: t("stepNumber"),
                commandLabel: t("console.commandLabel"),
                commandSharedHint: t("commandSharedHint"),
                outputLabel: t("console.outputLabel"),
                outputPerLangHint: t("outputPerLangHint"),
                deleteStepConfirm: t("deleteStepConfirm"),
                addStep: t("addStep"),
                noTranslationTitle: t("noTranslationTitle", {
                  lang: activeLanguage.name,
                }),
                noTranslationHint: t("noTranslationHint", {
                  baseLang: baseLanguage.name,
                }),
                copyFromBase: t("copyFromBase", {
                  baseLang: baseLanguage.name,
                }),
                startBlank: t("startBlank"),
                deleteTranslation: t("deleteTranslation", {
                  lang: activeLanguage.name,
                }),
                deleteTranslationConfirm: t("deleteTranslationConfirm", {
                  lang: activeLanguage.name,
                }),
                copySnippet: t("copySnippet"),
              }}
            />
          )}
        </div>

        {/* Right Column: Sticky Live Preview */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-2">
            <div className="text-muted-foreground px-1 text-xs font-semibold tracking-wider uppercase">
              {t("previewHeading")}
            </div>
            {activeTab === "identity" ? (
              <ProfileHeroLivePreview
                fullName={state.shared.fullName}
                photoUrl={state.shared.photoUrl}
                currentTranslation={currentTranslation}
                baseTranslation={baseTranslation}
                isNonBase={activeLangId !== baseLanguage.id}
                t={{
                  fallbackNotice: t("fallbackNotice", {
                    baseLang: baseLanguage.name,
                  }),
                  defaultBadge: t("defaultBadge"),
                  previewHeading: t("previewHeading"),
                }}
              />
            ) : (
              <ProfileAboutLivePreview
                username={state.shared.username}
                typingSpeed={state.shared.typingSpeed}
                delayBetweenCommands={state.shared.delayBetweenCommands}
                steps={state.steps}
                currentTranslation={currentTranslation}
                baseTranslation={baseTranslation}
                t={{
                  aboutTitle: t("aboutMeTitle"),
                  noAboutText: t("aboutPlaceholder"),
                  play: t("play"),
                  playing: t("playing"),
                  reset: t("reset"),
                }}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Floating Bottom Save Bar */}
      <ProfileSaveBar
        isDirty={isDirty}
        isPending={isPending}
        errorMessage={validationError}
        onDiscard={handleDiscard}
        onSave={handleSave}
        t={{
          unsavedChanges: t("unsavedChanges"),
          discard: t("discard"),
          saveChanges: t("saveChanges"),
          saving: t("saving"),
        }}
      />
    </div>
  );
};
