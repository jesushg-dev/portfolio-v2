"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import type { AppLanguage } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { api } from "@/trpc/react";
import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import type { TerminalEditorDTO } from "@/features/terminal/lib/types";
import { ConsoleFormSkeleton } from "@/features/profile/components/console-form-skeleton";
import { resolvePrimaryLanguage } from "@/lib/i18n/localized-form";
import {
  buildEmptyTranslationMap,
  mergeTranslationMap,
} from "@/lib/i18n/translation-map";

const TerminalStepTranslationMapSchema = z.record(
  z.string(),
  z.object({
    command: z.string(),
    output: z.string(),
  }),
);

const consoleFormSchema = z.object({
  username: z.string().min(1),
  typingSpeed: z.number().int().positive(),
  delayBetweenCommands: z.number().int().nonnegative(),
  steps: z
    .array(
      z.object({
        order: z.number().int().nonnegative(),
        translations: TerminalStepTranslationMapSchema,
      }),
    )
    .min(1),
});

type ConsoleFormValues = z.infer<typeof consoleFormSchema>;

interface ConsoleFormProps {
  languages: AppLanguage[];
}

function createEmptyStepTranslations(languages: AppLanguage[]) {
  return buildEmptyTranslationMap(languages, { command: "", output: "" });
}

function editorDtoToFormValues(
  dto: TerminalEditorDTO,
  languages: AppLanguage[],
): ConsoleFormValues {
  return {
    username: dto.username,
    typingSpeed: dto.typingSpeed,
    delayBetweenCommands: dto.delayBetweenCommands,
    steps: dto.steps.map((step) => ({
      order: step.order,
      translations: mergeTranslationMap(
        languages,
        Object.entries(step.translations).map(([appLanguageId, value]) => ({
          appLanguageId,
          command: value.command,
          output: value.output,
        })),
        { command: "", output: "" },
      ),
    })),
  };
}

function withPrimaryFallback(
  value: string,
  primaryValue: string | undefined,
): string {
  const trimmed = value.trim();
  if (trimmed !== "") return trimmed;
  return primaryValue?.trim() ?? "";
}

export function ConsoleForm({ languages }: ConsoleFormProps) {
  const t = useTranslations("admin.profile.console");
  const utils = api.useUtils();

  const primaryLang = useMemo(
    () => resolvePrimaryLanguage(languages),
    [languages],
  );

  const [activeLangId, setActiveLangId] = useState(
    primaryLang?.id ?? languages[0]?.id ?? "",
  );
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    data: terminalData,
    isLoading,
    isError,
    error,
    refetch,
  } = api.terminal.getMine.useQuery();

  const form = useForm<ConsoleFormValues>({
    resolver: zodResolver(consoleFormSchema),
    defaultValues: {
      username: "Jesus-Macbook",
      typingSpeed: 45,
      delayBetweenCommands: 1000,
      steps: [
        {
          order: 0,
          translations: createEmptyStepTranslations(languages),
        },
      ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  useEffect(() => {
    if (!terminalData) return;
    form.reset(editorDtoToFormValues(terminalData, languages));
  }, [terminalData, languages, form]);

  const upsertTerminal = api.terminal.upsert.useMutation();

  const handleSubmit = useCallback(
    (values: ConsoleFormValues) => {
      startTransition(async () => {
        setServerError(null);
        try {
          const primaryId = primaryLang?.id;
          const stepsWithOrder = values.steps.map((step, index) => {
            const primaryTranslation = primaryId
              ? step.translations[primaryId]
              : undefined;

            const translations = Object.fromEntries(
              Object.entries(step.translations).map(
                ([appLanguageId, entry]) => [
                  appLanguageId,
                  {
                    command: withPrimaryFallback(
                      entry.command,
                      primaryTranslation?.command,
                    ),
                    output: withPrimaryFallback(
                      entry.output,
                      primaryTranslation?.output,
                    ),
                  },
                ],
              ),
            );

            return {
              order: index,
              translations,
            };
          });

          await upsertTerminal.mutateAsync({
            username: values.username,
            typingSpeed: values.typingSpeed,
            delayBetweenCommands: values.delayBetweenCommands,
            steps: stepsWithOrder,
          });

          await utils.terminal.getMine.invalidate();
        } catch (err) {
          setServerError(err instanceof Error ? err.message : t("saveFailed"));
        }
      });
    },
    [primaryLang, upsertTerminal, utils, t],
  );

  const handleAddStep = useCallback(() => {
    append({
      order: fields.length,
      translations: createEmptyStepTranslations(languages),
    });
  }, [append, fields.length, languages]);

  const handleRemoveStep = useCallback(
    (index: number) => {
      if (fields.length <= 1) return;
      remove(index);
      const steps = form.getValues("steps");
      steps.forEach((_, stepIndex) => {
        form.setValue(`steps.${stepIndex}.order`, stepIndex);
      });
    },
    [fields.length, form, remove],
  );

  if (isLoading) {
    return <ConsoleFormSkeleton />;
  }

  if (isError) {
    return (
      <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4">
        <p className="text-sm font-medium">{t("loadFailed")}</p>
        <p className="text-muted-foreground mt-1 text-sm">{error.message}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => void refetch()}
        >
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <GlobalLanguageSelector
          languages={languages}
          activeLangId={activeLangId}
          onLangChange={setActiveLangId}
          buttonIdPrefix="profile-console"
        />

        <FormContent error={serverError}>
          <FormSection
            title={t("settingsTitle")}
            description={t("settingsDescription")}
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem
                  label={t("usernameLabel")}
                  inputId="profile-console-username"
                >
                  <FormControl>
                    <Input {...field} placeholder={t("usernamePlaceholder")} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="typingSpeed"
                render={({ field }) => (
                  <FormItem
                    label={t("typingSpeedLabel")}
                    inputId="profile-console-typing-speed"
                  >
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(Number(event.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="delayBetweenCommands"
                render={({ field }) => (
                  <FormItem
                    label={t("delayLabel")}
                    inputId="profile-console-delay"
                  >
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(Number(event.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          <FormSection
            title={t("stepsTitle")}
            description={t("stepsDescription")}
            className="mt-6 border-t pt-6"
          >
            <Sortable
              value={fields}
              onMove={({ activeIndex, overIndex }) => {
                move(activeIndex, overIndex);
                const steps = form.getValues("steps");
                steps.forEach((_, stepIndex) => {
                  form.setValue(`steps.${stepIndex}.order`, stepIndex);
                });
              }}
              getItemValue={(item) => item.id}
            >
              <SortableContent asChild>
                <div className="flex flex-col gap-4">
                  {fields.map((field, stepIndex) => (
                    <SortableItem key={field.id} value={field.id} asChild>
                      <div className="border-border bg-card text-card-foreground rounded-lg border p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <SortableItemHandle
                              aria-label={t("dragToReorder")}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <GripVertical className="size-4" />
                            </SortableItemHandle>
                            <span className="text-sm font-medium">
                              {t("stepLabel", { n: stepIndex + 1 })}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStep(stepIndex)}
                            disabled={fields.length <= 1}
                            className="text-muted-foreground hover:text-destructive h-8"
                          >
                            <Trash2 className="mr-1 size-4" />
                            {t("removeStep")}
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {languages.map((lang) => {
                            const isActive = lang.id === activeLangId;
                            return (
                              <div
                                key={lang.id}
                                className={isActive ? "space-y-4" : "hidden"}
                                aria-hidden={!isActive}
                              >
                                <FormField
                                  control={form.control}
                                  name={`steps.${stepIndex}.translations.${lang.id}.command`}
                                  render={({ field: commandField }) => (
                                    <FormItem
                                      label={t("commandLabel")}
                                      inputId={`profile-console-command-${stepIndex}-${lang.code}`}
                                    >
                                      <FormControl>
                                        <Input
                                          {...commandField}
                                          className="font-mono text-sm"
                                          placeholder={t("commandPlaceholder")}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`steps.${stepIndex}.translations.${lang.id}.output`}
                                  render={({ field: outputField }) => (
                                    <FormItem
                                      label={t("outputLabel")}
                                      description={t("outputHint")}
                                      inputId={`profile-console-output-${stepIndex}-${lang.code}`}
                                    >
                                      <FormControl>
                                        <Textarea
                                          {...outputField}
                                          rows={8}
                                          className="font-mono text-sm"
                                          placeholder={t("outputPlaceholder")}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContent>
            </Sortable>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddStep}
              className="mt-4"
              id="profile-console-add-step"
            >
              <Plus className="mr-1 size-4" />
              {t("addStep")}
            </Button>
          </FormSection>
        </FormContent>

        <FormActions
          isPending={isPending || upsertTerminal.isPending}
          title={
            isPending || upsertTerminal.isPending ? t("saving") : t("save")
          }
          submitId="profile-console-submit"
        />
      </FormRoot>
    </Form>
  );
}
