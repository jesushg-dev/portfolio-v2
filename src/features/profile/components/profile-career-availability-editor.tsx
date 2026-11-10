"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormSection } from "@/components/shared/form-root";
import { ProfileField } from "./profile-field";

interface AvailabilityData {
  availableForWork: boolean;
  translations: {
    id: string;
    name: string;
    code: string;
    title: string;
    description: string;
  }[];
}

function AvailabilityForm({ initial }: { initial: AvailabilityData }) {
  const t = useTranslations("admin.careerAvailability");
  const id = useId();
  const utils = api.useUtils();
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [languageId, setLanguageId] = useState(
    initial.translations[0]?.id ?? "",
  );
  const [notice, setNotice] = useState<string | null>(null);
  const mutation = api.profileAdmin.upsertCareerAvailability.useMutation();
  const translation = draft.translations.find((row) => row.id === languageId);

  function updateTranslation(field: "title" | "description", value: string) {
    setDraft((previous) => ({
      ...previous,
      translations: previous.translations.map((row) =>
        row.id === languageId ? { ...row, [field]: value } : row,
      ),
    }));
    setNotice(null);
  }

  async function save() {
    const submitted = draft;
    try {
      await mutation.mutateAsync({
        availableForWork: submitted.availableForWork,
        translations: submitted.translations.map((row) => ({
          appLanguageId: row.id,
          title: row.title,
          description: row.description,
        })),
      });
      setSaved(submitted);
      utils.profileAdmin.getCareerAvailabilityEditor.setData(
        undefined,
        submitted,
      );
      await utils.portfolio.getHeroPublic.invalidate();
      setNotice(t("saved"));
    } catch {
      setNotice(t("error"));
    }
  }

  return (
    <FormSection title={t("title")}>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {t("description")}
      </p>
      <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
        <label htmlFor={`${id}-available`} className="text-sm font-medium">
          {t("available")}
        </label>
        <Switch
          id={`${id}-available`}
          checked={draft.availableForWork}
          onCheckedChange={(checked) => {
            setDraft((previous) => ({
              ...previous,
              availableForWork: checked,
            }));
            setNotice(null);
          }}
        />
      </div>
      <ProfileField label={t("language")} inputId={`${id}-language`}>
        <select
          id={`${id}-language`}
          value={languageId}
          onChange={(event) => setLanguageId(event.target.value)}
          className="border-border bg-background text-foreground min-h-11 w-full rounded-xl border px-3 py-2 text-sm"
        >
          {draft.translations.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </ProfileField>
      {translation ? (
        <>
          <ProfileField label={t("nextTitle")} inputId={`${id}-title`}>
            <Input
              id={`${id}-title`}
              value={translation.title}
              maxLength={160}
              onChange={(event) =>
                updateTranslation("title", event.target.value)
              }
            />
          </ProfileField>
          <ProfileField
            label={t("nextDescription")}
            inputId={`${id}-description`}
          >
            <Textarea
              id={`${id}-description`}
              value={translation.description}
              maxLength={1000}
              rows={4}
              onChange={(event) =>
                updateTranslation("description", event.target.value)
              }
            />
          </ProfileField>
        </>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => {
            void save();
          }}
          disabled={
            mutation.isPending ||
            JSON.stringify(draft) === JSON.stringify(saved)
          }
        >
          {mutation.isPending ? t("saving") : t("save")}
        </Button>
        <p role="status" className="text-muted-foreground text-sm">
          {notice}
        </p>
      </div>
    </FormSection>
  );
}

export function ProfileCareerAvailabilityEditor() {
  const t = useTranslations("admin.careerAvailability");
  const query = api.profileAdmin.getCareerAvailabilityEditor.useQuery();
  if (!query.data)
    return (
      <p role="status" className="text-muted-foreground text-sm">
        {query.isError ? t("error") : t("loading")}
      </p>
    );
  return <AvailabilityForm initial={query.data} />;
}
