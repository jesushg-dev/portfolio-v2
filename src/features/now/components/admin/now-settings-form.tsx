"use client";

import type { AppLanguage } from "@prisma/client";
import { type FC, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";
import { GlobalLanguageSelector } from "@/components/admin/shared/global-language-selector";
import { translationMapSchema } from "@/lib/i18n/localized-form";
import { useLocalizedForm } from "@/hooks/admin/use-localized-form";
import type { NowSettingsEditorDTO } from "@/features/now/lib/now-editor-dto";
import type { NowTab } from "./now-admin-panel";

interface NowSettingsFormProps {
  currentTab: NowTab;
  languages: AppLanguage[];
  settings: NowSettingsEditorDTO;
  snapshotHint?: string;
  activityHint?: string;
  githubHint?: string;
}

export const NowSettingsForm: FC<NowSettingsFormProps> = ({
  currentTab,
  languages,
  settings,
  snapshotHint,
  activityHint,
  githubHint,
}) => {
  const t = useTranslations("admin.forms.nowSettings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const schema = useMemo(
    () =>
      z.object({
        timezone: z.string().min(1),
        githubUsername: z.string(),
        statusEmoji: z.string(),
        readingTitle: z.string(),
        readingAuthors: z.string(),
        readingProgress: z.number().int().min(0).max(100),
        watchedTitle: z.string(),
        watchedRating: z.number().int().min(0).max(5),
        githubRepo: z.string(),
        githubHref: z.string(),
        photoUrls: z.string(),
        translations: translationMapSchema(
          z.object({
            statusBody: z.string(),
            statusRelative: z.string(),
            githubBody: z.string(),
            githubRelative: z.string(),
          }),
          undefined,
          "statusBody",
          t("statusBodyRequired"),
        ),
      }),
    [t],
  );

  type FormValues = z.infer<typeof schema>;

  const upsert = api.nowAdmin.upsertSettings.useMutation();
  const utils = api.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...settings,
      photoUrls: settings.photoUrls.join("\n"),
    } as FormValues,
  });

  const { activeLangId, setActiveLangId } = useLocalizedForm({
    languages,
    form,
    buildDefaultValues: () =>
      ({
        ...settings,
        photoUrls: settings.photoUrls.join("\n"),
      }),
    resourceId: "settings",
  });

  const onSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        try {
          await upsert.mutateAsync({
            ...values,
            photoUrls: values.photoUrls
              .split("\n")
              .map((u) => u.trim())
              .filter(Boolean),
          });
          await utils.nowAdmin.getSettings.invalidate();
          router.refresh();
          toast.success(t("updatedSuccess"));
        } catch {
          toast.error(t("updateFailed"));
        }
      });
    },
    [upsert, utils, router, t],
  );

  const isSaving = upsert.isPending || isPending;
  const showLanguageSelector =
    currentTab === "SNAPSHOT" || currentTab === "GITHUB";

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        {showLanguageSelector ? (
          <GlobalLanguageSelector
            languages={languages}
            activeLangId={activeLangId}
            onLangChange={setActiveLangId}
            buttonIdPrefix="now-settings"
          />
        ) : null}

        {currentTab === "SNAPSHOT" && (
          <FormContent>
            <FormSection title={t("sectionGeneral")} description={snapshotHint}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem label={t("timezone")}>
                      <FormControl>
                        <Input {...field} placeholder="America/Mexico_City" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="statusEmoji"
                  render={({ field }) => (
                    <FormItem label={t("statusEmoji")}>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            {languages.map((lang) => (
              <div
                key={lang.id}
                hidden={lang.id !== activeLangId}
                aria-hidden={lang.id !== activeLangId}
              >
                <FormSection title={t("sectionStatusCopy")}>
                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.statusBody`}
                    render={({ field }) => (
                      <FormItem label={t("statusBody")}>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.statusRelative`}
                    render={({ field }) => (
                      <FormItem label={t("statusRelative")}>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </FormSection>
              </div>
            ))}
          </FormContent>
        )}

        {currentTab === "ACTIVITY" && (
          <FormContent>
            <FormSection title={t("sectionReading")} description={activityHint}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="readingTitle"
                  render={({ field }) => (
                    <FormItem label={t("readingTitle")}>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="readingAuthors"
                  render={({ field }) => (
                    <FormItem label={t("readingAuthors")}>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="readingProgress"
                  render={({ field }) => (
                    <FormItem label={t("readingProgress")}>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <FormSection title={t("sectionWatched")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="watchedTitle"
                  render={({ field }) => (
                    <FormItem label={t("watchedTitle")}>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="watchedRating"
                  render={({ field }) => (
                    <FormItem label={t("watchedRating")}>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <FormSection title={t("sectionPhotos")}>
              <FormField
                control={form.control}
                name="photoUrls"
                render={({ field }) => (
                  <FormItem
                    label={t("photoUrls")}
                    description={t("photoUrlsHint")}
                  >
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </FormSection>
          </FormContent>
        )}

        {currentTab === "GITHUB" && (
          <FormContent>
            <FormSection title={t("sectionGithub")} description={githubHint}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="githubUsername"
                  render={({ field }) => (
                    <FormItem label={t("githubUsername")}>
                      <FormControl>
                        <Input {...field} placeholder="jesushg" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="githubRepo"
                  render={({ field }) => (
                    <FormItem label={t("githubRepo")}>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="githubHref"
                  render={({ field }) => (
                    <FormItem label={t("githubHref")} className="sm:col-span-2">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            {languages.map((lang) => (
              <div
                key={lang.id}
                hidden={lang.id !== activeLangId}
                aria-hidden={lang.id !== activeLangId}
              >
                <FormSection title={t("sectionGithubCopy")}>
                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.githubBody`}
                    render={({ field }) => (
                      <FormItem label={t("githubBody")}>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`translations.${lang.id}.githubRelative`}
                    render={({ field }) => (
                      <FormItem label={t("githubRelative")}>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </FormSection>
              </div>
            ))}
          </FormContent>
        )}

        <FormActions>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? t("saving") : t("save")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
