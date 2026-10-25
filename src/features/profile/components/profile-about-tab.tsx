"use client";

import { useRef, type FC } from "react";
import type { AppLanguage } from "@prisma/client";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormItem, FormSection } from "@/components/shared/form-root";
import { ProfileReferenceBox } from "./profile-reference-box";
import type {
  ProfileLocaleTranslation,
  ProfileSharedState,
  ProfileStepState,
} from "../lib/profile-unified-types";

interface ProfileAboutTabProps {
  shared: ProfileSharedState;
  onUpdateShared: <K extends keyof ProfileSharedState>(
    key: K,
    val: ProfileSharedState[K],
  ) => void;
  steps: ProfileStepState[];
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  onMoveStep: (index: number, direction: -1 | 1) => void;
  onUpdateStepCmd: (index: number, cmd: string) => void;
  onUpdateStepOutput: (index: number, output: string) => void;
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
    aboutSectionTitle: string;
    boldHelper: string;
    boldHint: string;
    aboutLabel: string;
    aboutHint: string;
    aboutPlaceholder: string;
    terminalSettingsTitle: string;
    terminalSettingsHint: string;
    usernameLabel: string;
    typingSpeedLabel: string;
    delayLabel: string;
    commandSequenceTitle: string;
    commandSequenceHint: string;
    stepNumber: string;
    commandLabel: string;
    commandSharedHint: string;
    outputLabel: string;
    outputPerLangHint: string;
    deleteStepConfirm: string;
    addStep: string;
    noTranslationTitle: string;
    noTranslationHint: string;
    copyFromBase: string;
    startBlank: string;
    deleteTranslation: string;
    deleteTranslationConfirm: string;
    copySnippet: string;
  };
}

export const ProfileAboutTab: FC<ProfileAboutTabProps> = ({
  shared,
  onUpdateShared,
  steps,
  onAddStep,
  onRemoveStep,
  onMoveStep,
  onUpdateStepCmd,
  onUpdateStepOutput,
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
  const aboutTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isNonBase = activeLanguage.id !== baseLanguage.id;

  const handleBoldSelection = () => {
    const textarea = aboutTextareaRef.current;
    if (!textarea || !currentTranslation) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    if (start === end) {
      // Nothing selected, insert **bold**
      const newText = text.slice(0, start) + "**bold**" + text.slice(end);
      onUpdateTranslation("about", newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, start + 6);
      }, 0);
      return;
    }

    const selected = text.slice(start, end);
    const newText = text.slice(0, start) + `**${selected}**` + text.slice(end);
    onUpdateTranslation("about", newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, end + 2);
    }, 0);
  };

  const copyAboutFromBase = () => {
    if (!baseTranslation) return;
    onUpdateTranslation("about", baseTranslation.about);
  };

  return (
    <div className="space-y-8">
      {/* About Me Text Section */}
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
        <FormSection title={t.aboutSectionTitle}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBoldSelection}
              className="size-8 rounded-lg border border-border bg-muted/30 hover:bg-muted font-bold text-sm text-foreground grid place-items-center cursor-pointer transition-colors"
              title={t.boldHelper}
              aria-label={t.boldHelper}
            >
              B
            </button>
            <span className="text-muted-foreground text-xs">{t.boldHint}</span>
          </div>

          <FormItem
            label={`${t.aboutLabel} *`}
            description={t.aboutHint}
            inputId="profile-tr-about"
          >
            {showReference && isNonBase && baseTranslation && (
              <ProfileReferenceBox
                baseLanguageCode={baseLanguage.code}
                referenceText={baseTranslation.about}
                onCopy={copyAboutFromBase}
                copyLabel={t.copySnippet}
              />
            )}
            <Textarea
              ref={aboutTextareaRef}
              id="profile-tr-about"
              rows={8}
              value={currentTranslation.about}
              onChange={(e) => onUpdateTranslation("about", e.target.value)}
              placeholder={t.aboutPlaceholder}
              className="min-h-48 resize-y font-sans leading-relaxed text-sm"
            />
          </FormItem>
        </FormSection>
      )}

      {/* Terminal Settings (Shared across languages) */}
      <FormSection title={t.terminalSettingsTitle}>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormItem label={t.usernameLabel} inputId="profile-terminal-username">
            <Input
              id="profile-terminal-username"
              value={shared.username}
              onChange={(e) => onUpdateShared("username", e.target.value)}
              placeholder="Jesus-Macbook"
              className="h-11 font-mono text-xs sm:text-sm"
            />
          </FormItem>

          <FormItem
            label={t.typingSpeedLabel}
            inputId="profile-terminal-speed"
          >
            <Input
              id="profile-terminal-speed"
              type="number"
              min={1}
              value={shared.typingSpeed || ""}
              onChange={(e) =>
                onUpdateShared(
                  "typingSpeed",
                  e.target.value === "" ? 45 : Number(e.target.value),
                )
              }
              className="h-11 font-mono text-xs sm:text-sm"
            />
          </FormItem>

          <FormItem label={t.delayLabel} inputId="profile-terminal-delay">
            <Input
              id="profile-terminal-delay"
              type="number"
              min={0}
              value={
                shared.delayBetweenCommands === 0
                  ? "0"
                  : shared.delayBetweenCommands || ""
              }
              onChange={(e) =>
                onUpdateShared(
                  "delayBetweenCommands",
                  e.target.value === "" ? 1000 : Number(e.target.value),
                )
              }
              className="h-11 font-mono text-xs sm:text-sm"
            />
          </FormItem>
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          {t.terminalSettingsHint}
        </p>
      </FormSection>

      {/* Terminal Steps Sequence */}
      <FormSection
        title={`${t.commandSequenceTitle} · ${steps.length}`}
        className="space-y-4"
      >
        <p className="text-muted-foreground text-xs sm:text-sm">
          {t.commandSequenceHint}
        </p>

        {steps.length === 0 ? (
          <p className="border-border/80 rounded-xl border border-dashed py-8 text-center text-xs text-muted-foreground">
            No steps configured.
          </p>
        ) : (
          <div className="space-y-4">
            {steps.map((step, idx) => {
              const out = currentTranslation?.outs[idx] ?? "";
              const baseOut = baseTranslation?.outs[idx] ?? "";

              return (
                <div
                  key={step.id || idx}
                  className="border-border/80 bg-card rounded-xl border p-4 shadow-2xs space-y-3"
                >
                  {/* Step Card Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary grid size-6 place-items-center rounded-md text-xs font-bold tabular-nums">
                        {idx + 1}
                      </span>
                      <span className="text-foreground text-xs font-semibold">
                        {t.stepNumber.replace("{n}", String(idx + 1))}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onMoveStep(idx, -1)}
                        disabled={idx === 0}
                        aria-label="Move step up"
                        className="text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 grid size-8 place-items-center rounded-md cursor-pointer transition-colors"
                      >
                        <ArrowUp className="size-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onMoveStep(idx, 1)}
                        disabled={idx === steps.length - 1}
                        aria-label="Move step down"
                        className="text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 grid size-8 place-items-center rounded-md cursor-pointer transition-colors"
                      >
                        <ArrowDown className="size-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(t.deleteStepConfirm)) {
                            onRemoveStep(idx);
                          }
                        }}
                        aria-label="Delete step"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 grid size-8 place-items-center rounded-md cursor-pointer transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Shared Command Field */}
                  <FormItem
                    label={`${t.commandLabel} * (${t.commandSharedHint})`}
                    inputId={`profile-step-cmd-${idx}`}
                  >
                    <Input
                      id={`profile-step-cmd-${idx}`}
                      value={step.cmd}
                      onChange={(e) => onUpdateStepCmd(idx, e.target.value)}
                      placeholder="whoami"
                      className="h-10 font-mono text-xs"
                    />
                  </FormItem>

                  {/* Localized Output Field */}
                  {currentTranslation && (
                    <FormItem
                      label={`${t.outputLabel} (${t.outputPerLangHint})`}
                      inputId={`profile-step-out-${idx}`}
                    >
                      {showReference && isNonBase && baseOut && (
                        <ProfileReferenceBox
                          baseLanguageCode={baseLanguage.code}
                          referenceText={baseOut}
                          onCopy={() => onUpdateStepOutput(idx, baseOut)}
                          copyLabel={t.copySnippet}
                        />
                      )}
                      <Textarea
                        id={`profile-step-out-${idx}`}
                        rows={3}
                        value={out}
                        onChange={(e) =>
                          onUpdateStepOutput(idx, e.target.value)
                        }
                        placeholder="output text"
                        className="font-mono text-xs leading-relaxed"
                      />
                    </FormItem>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={onAddStep}
          className="w-full gap-1.5 sm:w-auto"
        >
          <Plus className="size-4" aria-hidden />
          <span>{t.addStep}</span>
        </Button>
      </FormSection>

      {/* Non-Base Locale Delete Option */}
      {isNonBase && currentTranslation && (
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
    </div>
  );
};
