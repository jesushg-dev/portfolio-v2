"use client";

import type { AppLanguage } from "@prisma/client";
import { type FC, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  HiOutlineBookOpen,
  HiOutlineCollection,
  HiOutlineStatusOnline,
} from "react-icons/hi";
import { FaGithub } from "react-icons/fa";

import { api } from "@/trpc/react";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { NowFocusEditorDTO } from "@/features/now/lib/now-editor-dto";
import { NowFocusesList } from "@/features/now/components/admin/now-focuses-list";

type NowTab = "SNAPSHOT" | "ACTIVITY" | "GITHUB" | "FOCUSES";

const TAB_TYPES: NowTab[] = ["SNAPSHOT", "ACTIVITY", "GITHUB", "FOCUSES"];

interface NowAdminPanelProps {
  initialTab: NowTab;
  languages: AppLanguage[];
  settings: NowSettingsEditorDTO;
  focuses: NowFocusEditorDTO[];
}

export const NowAdminPanel: FC<NowAdminPanelProps> = ({
  initialTab,
  languages,
  settings,
  focuses,
}) => {
  const t = useTranslations("admin.now");
  const tForm = useTranslations("admin.forms.nowSettings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringEnum(TAB_TYPES).withDefault(initialTab),
  );
  const currentTab = tab ?? initialTab;

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
          tForm("statusBodyRequired"),
        ),
      }),
    [tForm],
  );

  type FormValues = z.infer<typeof schema>;

  const upsert = api.nowAdmin.upsertSettings.useMutation();
  const utils = api.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...settings,
      photoUrls: settings.photoUrls.join("\n"),
    },
  });

  const { activeLangId, setActiveLangId } = useLocalizedForm({
    languages,
    form,
    buildDefaultValues: () => ({
      ...settings,
      photoUrls: settings.photoUrls.join("\n"),
    }),
    resourceId: settings.id,
  });

  const onSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        try {
          await upsert.mutateAsync({
            ...values,
            photoUrls: values.photoUrls
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          });
          await utils.nowAdmin.getSettings.invalidate();
          toast.success(tForm("updatedSuccess"));
          router.refresh();
        } catch {
          toast.error(tForm("updateFailed"));
        }
      });
    },
    [upsert, utils, router, tForm],
  );

  const isSaving = upsert.isPending || isPending;
  const showLanguageSelector =
    currentTab === "SNAPSHOT" || currentTab === "GITHUB";
  const showSave = currentTab !== "FOCUSES";

  return (
    <Tabs
      value={currentTab}
      onValueChange={(value) => {
        void setTab((value as NowTab) ?? "SNAPSHOT");
      }}
      className="flex min-h-0 flex-1 flex-col gap-6"
    >
      <TabsList aria-label={t("tabsLabel")}>
        <TabsTrigger value="SNAPSHOT" className="gap-1.5">
          <HiOutlineStatusOnline className="size-4" />
          {t("tabs.snapshot")}
        </TabsTrigger>
        <TabsTrigger value="ACTIVITY" className="gap-1.5">
          <HiOutlineBookOpen className="size-4" />
          {t("tabs.activity")}
        </TabsTrigger>
        <TabsTrigger value="GITHUB" className="gap-1.5">
          <FaGithub className="size-4" />
          {t("tabs.github")}
        </TabsTrigger>
        <TabsTrigger value="FOCUSES" className="gap-1.5">
          <HiOutlineCollection className="size-4" />
          {t("tabs.focuses")}
        </TabsTrigger>
      </TabsList>

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

          <TabsContent value="SNAPSHOT" className="min-h-0 flex-1">
            <FormContent>
              <FormSection
                title={tForm("sectionGeneral")}
                description={t("sections.snapshotHint")}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem label={tForm("timezone")}>
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
                      <FormItem label={tForm("statusEmoji")}>
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
                  <FormSection title={tForm("sectionStatusCopy")}>
                    <FormField
                      control={form.control}
                      name={`translations.${lang.id}.statusBody`}
                      render={({ field }) => (
                        <FormItem label={tForm("statusBody")}>
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
                        <FormItem label={tForm("statusRelative")}>
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
          </TabsContent>

          <TabsContent value="ACTIVITY" className="min-h-0 flex-1">
            <FormContent>
              <FormSection
                title={tForm("sectionReading")}
                description={t("sections.activityHint")}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="readingTitle"
                    render={({ field }) => (
                      <FormItem label={tForm("readingTitle")}>
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
                      <FormItem label={tForm("readingAuthors")}>
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
                      <FormItem label={tForm("readingProgress")}>
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

              <FormSection title={tForm("sectionWatched")}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="watchedTitle"
                    render={({ field }) => (
                      <FormItem label={tForm("watchedTitle")}>
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
                      <FormItem label={tForm("watchedRating")}>
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

              <FormSection title={tForm("sectionPhotos")}>
                <FormField
                  control={form.control}
                  name="photoUrls"
                  render={({ field }) => (
                    <FormItem
                      label={tForm("photoUrls")}
                      description={tForm("photoUrlsHint")}
                    >
                      <FormControl>
                        <Textarea {...field} rows={4} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </FormSection>
            </FormContent>
          </TabsContent>

          <TabsContent value="GITHUB" className="min-h-0 flex-1">
            <FormContent>
              <FormSection
                title={tForm("sectionGithub")}
                description={t("sections.githubHint")}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="githubUsername"
                    render={({ field }) => (
                      <FormItem label={tForm("githubUsername")}>
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
                      <FormItem label={tForm("githubRepo")}>
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
                      <FormItem
                        label={tForm("githubHref")}
                        className="sm:col-span-2"
                      >
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
                  <FormSection title={tForm("sectionGithubCopy")}>
                    <FormField
                      control={form.control}
                      name={`translations.${lang.id}.githubBody`}
                      render={({ field }) => (
                        <FormItem label={tForm("githubBody")}>
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
                        <FormItem label={tForm("githubRelative")}>
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
          </TabsContent>

          <TabsContent value="FOCUSES" className="min-h-0 flex-1">
            <NowFocusesList initialFocuses={focuses} />
          </TabsContent>

          {showSave ? (
            <FormActions>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? tForm("saving") : tForm("save")}
              </Button>
            </FormActions>
          ) : null}
        </FormRoot>
      </Form>
    </Tabs>
  );
};

export type { NowTab };
