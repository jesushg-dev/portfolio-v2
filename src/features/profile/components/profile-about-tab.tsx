"use client";

import { useRef, type FC } from "react";
import type { AppLanguage } from "@prisma/client";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
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
    if (!textarea) return;

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
        <FormSection title={t.aboutSectionTitle}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBoldSelection}
              className="border-border bg-muted/30 hover:bg-muted text-foreground grid size-8 cursor-pointer place-items-center rounded-lg border text-sm font-bold transition-colors"
              title={t.boldHelper}
              aria-label={t.boldHelper}
            >
              B
            </button>
            <span className="text-muted-foreground text-xs">{t.boldHint}</span>
          </div>

          <ProfileField
            label={`${t.aboutLabel} *`}
            description={t.aboutHint}
            inputId="profile-tr-about"
          >
            {showReference && isNonBase && baseTranslation?.about && (
              <ReferenceSnippet
                label={baseLanguage.code.toUpperCase()}
                content={baseTranslation.about}
                onCopy={copyAboutFromBase}
                copyText={t.copySnippet}
              />
            )}
            <Textarea
              ref={aboutTextareaRef}
              id="profile-tr-about"
              rows={8}
              value={currentTranslation.about}
              onChange={(e) => onUpdateTranslation("about", e.target.value)}
              placeholder={t.aboutPlaceholder}
              className="min-h-48 resize-y font-sans text-sm leading-relaxed"
            />
          </ProfileField>
        </FormSection>
      )}

      {/* Terminal Settings (Shared across languages) */}
      <FormSection title={t.terminalSettingsTitle}>
        <div className="grid gap-4 sm:grid-cols-3">
          <ProfileField
            label={t.usernameLabel}
            description="e.g. jehg@workspace"
            inputId="profile-terminal-username"
          >
            <Input
              id="profile-terminal-username"
              value={shared.username}
              onChange={(e) => onUpdateShared("username", e.target.value)}
              placeholder="jehg"
              className="font-mono text-xs sm:text-sm"
            />
          </ProfileField>

          <ProfileField
            label={t.typingSpeedLabel}
            description="ms per char (20-100)"
            inputId="profile-terminal-speed"
          >
            <Input
              id="profile-terminal-speed"
              type="number"
              min={10}
              max={300}
              value={shared.typingSpeed}
              onChange={(e) =>
                onUpdateShared("typingSpeed", Number(e.target.value) || 38)
              }
              className="font-mono text-xs sm:text-sm"
            />
          </ProfileField>

          <ProfileField
            label={t.delayLabel}
            description="ms between commands"
            inputId="profile-terminal-delay"
          >
            <Input
              id="profile-terminal-delay"
              type="number"
              min={100}
              max={5000}
              step={100}
              value={shared.delayBetweenCommands}
              onChange={(e) =>
                onUpdateShared(
                  "delayBetweenCommands",
                  Number(e.target.value) || 800,
                )
              }
              className="font-mono text-xs sm:text-sm"
            />
          </ProfileField>
        </div>
      </FormSection>

      {/* Terminal Steps Sequence */}
      <FormSection title={t.commandSequenceTitle}>
        <p className="text-muted-foreground -mt-3 text-xs leading-relaxed">
          {t.commandSequenceHint}
        </p>

        {steps.length === 0 ? (
          <div className="border-border/70 rounded-xl border border-dashed p-6 text-center">
            <p className="text-muted-foreground text-xs">
              No command steps defined. Click below to add your first command.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map((step, idx) => {
              const out = currentTranslation?.outs?.[idx] ?? "";
              const baseOut = baseTranslation?.outs?.[idx] ?? "";

              return (
                <div
                  key={step.id ?? idx}
                  className="border-border/80 bg-card/60 relative space-y-3 rounded-2xl border p-4 shadow-2xs"
                >
                  {/* Step Header */}
                  <div className="border-border/60 flex items-center justify-between gap-2 border-b pb-2">
                    <span className="text-foreground text-xs font-semibold tracking-wider uppercase">
                      {`${t.stepNumber} ${idx + 1}`}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={idx === 0}
                        onClick={() => onMoveStep(idx, -1)}
                        className="size-7"
                        aria-label="Move step up"
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={idx === steps.length - 1}
                        onClick={() => onMoveStep(idx, 1)}
                        className="size-7"
                        aria-label="Move step down"
                      >
                        <ArrowDown className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          if (window.confirm(t.deleteStepConfirm)) {
                            onRemoveStep(idx);
                          }
                        }}
                        className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive size-7"
                        aria-label="Delete step"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Command (shared across all languages) */}
                  <ProfileField
                    label={t.commandLabel}
                    description={t.commandSharedHint}
                    inputId={`profile-step-cmd-${idx}`}
                  >
                    <div className="relative flex items-center">
                      <span className="text-primary pointer-events-none absolute left-3 font-mono text-xs font-bold select-none">
                        $&nbsp;
                      </span>
                      <Input
                        id={`profile-step-cmd-${idx}`}
                        value={step.cmd}
                        onChange={(e) => onUpdateStepCmd(idx, e.target.value)}
                        placeholder="cat skills.txt"
                        className="pl-7 font-mono text-xs sm:text-sm"
                      />
                    </div>
                  </ProfileField>

                  {/* Output (per-language) */}
                  {currentTranslation && (
                    <ProfileField
                      label={t.outputLabel}
                      description={t.outputPerLangHint}
                      inputId={`profile-step-out-${idx}`}
                    >
                      {showReference && isNonBase && baseOut && (
                        <ReferenceSnippet
                          label={baseLanguage.code.toUpperCase()}
                          content={baseOut}
                          onCopy={() => onUpdateStepOutput(idx, baseOut)}
                          copyText={t.copySnippet}
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
                    </ProfileField>
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
        <AdminFormDeleteTranslation
          languageName={activeLanguage.name}
          onDelete={onDeleteTranslation}
          buttonText={t.deleteTranslation}
          confirmQuestion={t.deleteTranslationConfirm}
        />
      )}
    </div>
  );
};
