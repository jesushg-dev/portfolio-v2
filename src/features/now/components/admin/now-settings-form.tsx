"use client";
import type { AppLanguage } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { Form } from "@/components/ui/form";
import { Link } from "@/i18n/routing";
import {
  FormActions,
  FormContent,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";
import { LocalizedFormLanguageBar } from "@/components/admin/shared/localized-form-language-bar";
import { useLocalizedForm } from "@/hooks/admin/use-localized-form";
import type { NowSettingsEditorDTO } from "../../lib/now-editor-dto";
import {
  nowTabSchema,
  type NowSettingsFormValues,
} from "../../lib/now-settings-schema";
import type { NowTab } from "./now-admin-panel";
import { NowTextField } from "./now-settings-fields";
import { NowScheduleEditor } from "./now-schedule-editor";
import { NowActivityEditor } from "./now-activity-editor";
import { NowContribGraph } from "../now-contrib-graph";
import { NowGithubActivity } from "../now-github-activity";
interface Props {
  currentTab: NowTab;
  languages: AppLanguage[];
  settings: NowSettingsEditorDTO;
  snapshotHint?: string;
  activityHint?: string;
  githubHint?: string;
}
export function NowSettingsForm({
  currentTab,
  languages,
  settings,
  snapshotHint,
  activityHint,
  githubHint,
}: Props) {
  const t = useTranslations("admin.forms.nowSettings");
  const utils = api.useUtils();
  const save = api.nowAdmin.saveTab.useMutation();
  const form = useForm<NowSettingsFormValues>({
    defaultValues: settings,
  });
  const { languageProgress, activeLangId, setActiveLangId } = useLocalizedForm({
    languages,
    form,
    buildDefaultValues: () => settings,
    resourceId: settings.id,
    completenessFields: ["statusBody"],
  });
  const slots = useWatch({ control: form.control, name: "statusSchedule" });
  const translationProgress =
    currentTab === "SNAPSHOT"
      ? languageProgress.map((language) => {
          const completed = slots.filter((slot) =>
            slot.translations[language.id]?.body.trim(),
          ).length;
          return {
            ...language,
            totalCount: language.totalCount + slots.length,
            completedCount: language.completedCount + completed,
            hasContent: language.hasContent || completed > 0,
          };
        })
      : languageProgress;
  const { data: calendar, isLoading: loadingCalendar } =
    api.nowAdmin.getGithubContributions.useQuery(undefined, {
      enabled: currentTab === "GITHUB",
    });
  const { data: githubActivity } = api.nowAdmin.getGithubActivity.useQuery(
    undefined,
    {
      enabled: currentTab === "GITHUB",
    },
  );
  const onSubmit = async (values: NowSettingsFormValues): Promise<void> => {
    if (save.isPending) return;
    form.clearErrors();
    const parsed = nowTabSchema.safeParse({
      ...values,
      tab: currentTab.toLowerCase(),
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path
          .map(String)
          .join(".") as FieldPath<NowSettingsFormValues>;
        form.setError(path, { message: issue.message });
      }
      toast.error(parsed.error.issues[0]?.message ?? t("updateFailed"));
      return;
    }
    try {
      const updated = await save.mutateAsync(parsed.data);
      if (updated.tab === "snapshot") {
        form.setValue("statusSchedule", updated.statusSchedule, {
          shouldDirty: false,
        });
      }
      toast.success(t("tabSaved"));
      await utils.nowAdmin.invalidate();
    } catch {
      toast.error(t("updateFailed"));
    }
  };
  return (
    <Form {...form}>
      <FormRoot
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(form.getValues());
        }}
      >
        {currentTab === "SNAPSHOT" ? (
          <LocalizedFormLanguageBar
            languages={translationProgress}
            activeLangId={activeLangId}
            onSelectLang={setActiveLangId}
          />
        ) : null}
        <FormContent error={save.error}>
          <fieldset disabled={save.isPending} className="contents">
            {currentTab === "SNAPSHOT" ? (
              <div className="space-y-6">
                <FormSection
                  title={t("sectionGeneral")}
                  description={snapshotHint}
                >
                  <NowTextField
                    name="timezone"
                    label={t("timezone")}
                    placeholder="America/Managua"
                  />
                </FormSection>
                <NowScheduleEditor
                  languages={languages}
                  activeLangId={activeLangId}
                />
                <section className="border-border bg-muted/20 space-y-4 rounded-xl border p-4 sm:p-5">
                  <h2 className="font-semibold">{t("defaultStatusTitle")}</h2>
                  <p className="text-muted-foreground text-sm">
                    {t("defaultStatusHint")}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <NowTextField name="statusEmoji" label={t("statusEmoji")} />
                    <NowTextField
                      name={`translations.${activeLangId}.statusRelative`}
                      label={t("statusRelative")}
                    />
                  </div>
                  <NowTextField
                    name={`translations.${activeLangId}.statusBody`}
                    label={t("statusBody")}
                    multiline
                  />
                </section>
              </div>
            ) : null}
            {currentTab === "ACTIVITY" ? (
              <div className="space-y-4">
                {activityHint ? (
                  <p className="text-muted-foreground text-sm">
                    {activityHint}
                  </p>
                ) : null}
                <NowActivityEditor />
              </div>
            ) : null}
            {currentTab === "GITHUB" ? (
              <div className="space-y-6">
                <FormSection
                  title={t("sectionGithub")}
                  description={githubHint}
                >
                  <NowTextField
                    name="githubUsername"
                    label={t("githubUsername")}
                    placeholder="jesushg-dev"
                  />
                  <p className="text-muted-foreground text-sm">
                    {t("githubActivityHint")}
                  </p>
                  {githubActivity ? (
                    <NowGithubActivity activity={githubActivity} />
                  ) : null}
                </FormSection>
                <section className="border-border bg-muted/20 space-y-3 rounded-xl border p-4 sm:p-5">
                  <h2 className="font-semibold">{t("contributionPreview")}</h2>
                  {loadingCalendar ? (
                    <p className="text-muted-foreground text-sm">
                      {t("loadingGithub")}
                    </p>
                  ) : calendar ? (
                    <NowContribGraph calendar={calendar} />
                  ) : null}
                  <p className="text-muted-foreground text-xs">
                    {t("githubTokenHint")}
                  </p>
                  <Link
                    href={{
                      pathname: "/admin/credentials/[provider]",
                      params: { provider: "github" },
                    }}
                    className="text-primary inline-flex text-sm font-medium hover:underline"
                  >
                    {t("configureGithub")}
                  </Link>
                </section>
              </div>
            ) : null}
          </fieldset>
        </FormContent>
        <p className="text-muted-foreground text-xs">{t("tabSaveHint")}</p>
        <FormActions isPending={save.isPending} title={t("saveTab")} />
      </FormRoot>
    </Form>
  );
}
