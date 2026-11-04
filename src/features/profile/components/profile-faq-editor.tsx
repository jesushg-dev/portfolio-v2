"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSection } from "@/components/shared/form-root";
import { ProfileField } from "./profile-field";
import { FaqItemsSchema, type FaqItem } from "@/features/home/lib/faq-content";
import { ExportSeedJsonButton } from "@/components/admin/shared/export-seed-json-button";

interface FaqLanguage {
  id: string;
  name: string;
  code: string;
  items: FaqItem[];
}

function FaqForm({ languages }: { languages: FaqLanguage[] }) {
  const t = useTranslations("admin.homeFaq");
  const utils = api.useUtils();
  const [activeId, setActiveId] = useState(languages[0]?.id ?? "");
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(
      languages.map((language) => [language.id, language.items]),
    ),
  );
  const [saved, setSaved] = useState(drafts);
  const [notice, setNotice] = useState<string | null>(null);
  const mutation = api.profileAdmin.upsertFaq.useMutation();
  const items = drafts[activeId] ?? [];
  const dirty = JSON.stringify(items) !== JSON.stringify(saved[activeId] ?? []);

  function updateItems(next: FaqItem[]) {
    setDrafts((previous) => ({ ...previous, [activeId]: next }));
    setNotice(null);
  }

  async function save() {
    const parsed = FaqItemsSchema.safeParse(items);
    if (!parsed.success) {
      setNotice(t("invalid"));
      return;
    }
    try {
      await mutation.mutateAsync({
        appLanguageId: activeId,
        items: parsed.data,
      });
      utils.profileAdmin.getFaqEditor.setData(undefined, (previous) =>
        previous?.map((language) =>
          language.id === activeId
            ? { ...language, items: parsed.data }
            : language,
        ),
      );
      setDrafts((previous) =>
        JSON.stringify(previous[activeId]) === JSON.stringify(items)
          ? { ...previous, [activeId]: parsed.data }
          : previous,
      );
      setSaved((previous) => ({ ...previous, [activeId]: parsed.data }));
      setNotice(t("saved"));
    } catch {
      setNotice(t("error"));
    }
  }

  if (languages.length === 0) return null;
  return (
    <FormSection title={t("title")}>
      <ExportSeedJsonButton entity="faq" />
      <p className="text-muted-foreground text-sm">{t("description")}</p>
      <Tabs
        value={activeId}
        onValueChange={(value) => {
          setActiveId(String(value));
          setNotice(null);
        }}
      >
        <TabsList variant="line" className="max-w-full overflow-x-auto">
          {languages.map((language) => (
            <TabsTrigger key={language.id} value={language.id}>
              {language.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="space-y-5">
        {items.length === 0 && (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        )}
        {items.map((item, index) => (
          <div
            key={`${activeId}-${index}`}
            className="border-border space-y-3 rounded-2xl border p-4"
          >
            <ProfileField
              label={t("question")}
              inputId={`faq-question-${index}`}
            >
              <Input
                id={`faq-question-${index}`}
                maxLength={300}
                value={item.question}
                onChange={(event) =>
                  updateItems(
                    items.map((row, i) =>
                      i === index
                        ? { ...row, question: event.target.value }
                        : row,
                    ),
                  )
                }
              />
            </ProfileField>
            <ProfileField label={t("answer")} inputId={`faq-answer-${index}`}>
              <Textarea
                id={`faq-answer-${index}`}
                maxLength={5000}
                rows={4}
                value={item.answer}
                onChange={(event) =>
                  updateItems(
                    items.map((row, i) =>
                      i === index
                        ? { ...row, answer: event.target.value }
                        : row,
                    ),
                  )
                }
              />
            </ProfileField>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={index === 0}
                onClick={() => {
                  const next = [...items];
                  [next[index - 1], next[index]] = [
                    next[index],
                    next[index - 1],
                  ];
                  updateItems(next);
                }}
              >
                {t("moveUp")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={index === items.length - 1}
                onClick={() => {
                  const next = [...items];
                  [next[index], next[index + 1]] = [
                    next[index + 1],
                    next[index],
                  ];
                  updateItems(next);
                }}
              >
                {t("moveDown")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => updateItems(items.filter((_, i) => i !== index))}
              >
                {t("remove")}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={items.length >= 30}
          onClick={() => updateItems([...items, { question: "", answer: "" }])}
        >
          {t("add")}
        </Button>
        <Button
          type="button"
          disabled={!dirty || mutation.isPending}
          onClick={() => {
            void save();
          }}
        >
          {mutation.isPending ? t("saving") : t("save")}
        </Button>
      </div>
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
    </FormSection>
  );
}

export function ProfileFaqEditor() {
  const t = useTranslations("admin.homeFaq");
  const query = api.profileAdmin.getFaqEditor.useQuery();
  if (query.isPending)
    return <p className="text-muted-foreground text-sm">{t("loading")}</p>;
  if (query.isError) return <p role="alert">{t("error")}</p>;
  return <FaqForm languages={query.data} />;
}
