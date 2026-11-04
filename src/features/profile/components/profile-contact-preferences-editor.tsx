"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection } from "@/components/shared/form-root";
import { ProfileField } from "./profile-field";

interface ContactLanguage {
  id: string;
  name: string;
  responseTime: string;
}

function ContactPreferencesForm({
  languages,
}: {
  languages: ContactLanguage[];
}) {
  const t = useTranslations("admin.contactPreferences");
  const utils = api.useUtils();
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(
      languages.map((language) => [language.id, language.responseTime]),
    ),
  );
  const [saved, setSaved] = useState(draft);
  const [notice, setNotice] = useState<string | null>(null);
  const mutation = api.profileAdmin.upsertContactPreferences.useMutation();
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  async function save() {
    const submitted = { ...draft };
    try {
      await mutation.mutateAsync({ translations: submitted });
      setSaved(submitted);
      utils.profileAdmin.getContactPreferences.setData(
        undefined,
        languages.map((language) => ({
          ...language,
          responseTime: submitted[language.id] ?? "",
        })),
      );
      setNotice(t("saved"));
    } catch {
      setNotice(t("error"));
    }
  }
  return (
    <FormSection title={t("title")}>
      <p className="text-muted-foreground text-sm">{t("description")}</p>
      {languages.map((language) => (
        <ProfileField
          key={language.id}
          label={`${t("responseTime")} · ${language.name}`}
          inputId={`contact-response-${language.id}`}
        >
          <Input
            id={`contact-response-${language.id}`}
            maxLength={160}
            value={draft[language.id] ?? ""}
            onChange={(event) => {
              setDraft((previous) => ({
                ...previous,
                [language.id]: event.target.value,
              }));
              setNotice(null);
            }}
          />
        </ProfileField>
      ))}
      <Button
        type="button"
        disabled={!dirty || mutation.isPending}
        onClick={() => {
          void save();
        }}
      >
        {mutation.isPending ? t("saving") : t("save")}
      </Button>
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
    </FormSection>
  );
}

export function ProfileContactPreferencesEditor() {
  const t = useTranslations("admin.contactPreferences");
  const query = api.profileAdmin.getContactPreferences.useQuery();
  if (query.isPending)
    return <p className="text-muted-foreground text-sm">{t("loading")}</p>;
  if (query.isError) return <p role="alert">{t("error")}</p>;
  return <ContactPreferencesForm languages={query.data} />;
}
