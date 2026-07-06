"use client";

import { type FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Code2, Clock } from "lucide-react";

import type { Locale } from "@/i18n/config";
import { api } from "@/trpc/react";
import { LocalizedField } from "@/components/admin/localized-field";
import {
  TimelineEditor,
  type ExperienceEntry,
} from "@/components/admin/timeline-editor";
import { TranslationNudgeBanner } from "@/components/admin/translation-nudge-banner";
import { useTranslationNudge } from "@/hooks/admin/use-translation-nudge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LocalizedText = { default: string; translations?: Record<string, string> };

interface ConsoleData {
  name: string;
  languages: { spanish: string; english: string; dutch: string };
  profession: string;
}

interface AboutFormProps {
  locale: Locale;
  initialAboutMe: Record<string, unknown> | null;
  initialExperiences: {
    id: string;
    company: string;
    role: unknown;
    dates: string | null;
    current: boolean;
    order: number;
    responsibilities: {
      id: string;
      text: unknown;
      order: number;
    }[];
  }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOCALE_META: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇬🇧" },
  es: { label: "Español", flag: "🇪🇸" },
  nl: { label: "Nederlands", flag: "🇳🇱" },
};

const OTHER_LOCALES: Record<Locale, Locale[]> = {
  en: ["es", "nl"],
  es: ["en", "nl"],
  nl: ["en", "es"],
};

function extractLocalizedText(raw: unknown): LocalizedText {
  if (!raw || typeof raw !== "object") return { default: "" };
  const obj = raw as Record<string, unknown>;
  return {
    default: typeof obj.default === "string" ? obj.default : "",
    translations:
      typeof obj.translations === "object" && obj.translations !== null
        ? (obj.translations as Record<string, string>)
        : undefined,
  };
}

function extractConsole(raw: Record<string, unknown> | null): ConsoleData {
  const c = raw?.console as Record<string, unknown> | undefined;
  return {
    name: typeof c?.name === "string" ? c.name : "",
    languages: {
      spanish:
        typeof (c?.languages as Record<string, string>)?.spanish === "string"
          ? (c!.languages as Record<string, string>).spanish
          : "",
      english:
        typeof (c?.languages as Record<string, string>)?.english === "string"
          ? (c!.languages as Record<string, string>).english
          : "",
      dutch:
        typeof (c?.languages as Record<string, string>)?.dutch === "string"
          ? (c!.languages as Record<string, string>).dutch
          : "",
    },
    profession: typeof c?.profession === "string" ? c.profession : "",
  };
}

type TabKey = "description" | "console" | "timeline";

const TABS: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: "description", label: "Description", icon: FileText },
  { key: "console", label: "Code Block", icon: Code2 },
  { key: "timeline", label: "Timeline", icon: Clock },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AboutForm({
  locale,
  initialAboutMe,
  initialExperiences,
}: AboutFormProps) {
  const t = useTranslations("admin.about");
  const utils = api.useUtils();

  const [activeTab, setActiveTab] = useState<TabKey>("description");

  // About Me text
  const [aboutText, setAboutText] = useState<LocalizedText>(
    extractLocalizedText(initialAboutMe),
  );

  // Console data
  const [consoleData, setConsoleData] = useState<ConsoleData>(
    extractConsole(initialAboutMe),
  );

  const [isSavingAbout, setIsSavingAbout] = useState(false);
  const [aboutSuccess, setAboutSuccess] = useState("");

  const aboutNudge = useTranslationNudge(`about_text_${locale}`);

  const upsertAboutMe = api.cv.upsertAboutMe.useMutation({
    onSuccess: () => void utils.cv.getMine.invalidate(),
  });

  // Merge aboutText + consoleData into the single JSON blob for the DB
  const buildAboutMePayload = (text: LocalizedText, console: ConsoleData) => ({
    default: text.default,
    translations: text.translations,
    console,
  });

  const handleSaveAbout = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingAbout(true);
    setAboutSuccess("");
    try {
      const payload = buildAboutMePayload(aboutText, consoleData);
      await upsertAboutMe.mutateAsync({
        aboutMe: {
          default: payload.default,
          translations: payload.translations,
        },
      });
      // Nudge for other locales
      const prevDefault = extractLocalizedText(initialAboutMe).default;
      if (aboutText.default !== prevDefault) {
        const otherLocaleValues = Object.fromEntries(
          OTHER_LOCALES[locale].map((loc) => [
            loc,
            {
              ...LOCALE_META[loc],
              value: aboutText.translations?.[loc] ?? "",
            },
          ]),
        );
        aboutNudge.triggerNudge({
          storageKey: `about_text_${locale}`,
          fieldLabel: t("descriptionLabel"),
          editedLocale: locale,
          editedValue: aboutText.default,
          otherLocaleValues,
        });
      }
      setAboutSuccess(t("savedSuccess"));
    } finally {
      setIsSavingAbout(false);
    }
  };

  // Timeline mutations
  const createExperience = api.cv.createExperience.useMutation({
    onSuccess: () => void utils.cv.getMine.invalidate(),
  });
  const updateExperience = api.cv.updateExperience.useMutation({
    onSuccess: () => void utils.cv.getMine.invalidate(),
  });
  const deleteExperience = api.cv.deleteExperience.useMutation({
    onSuccess: () => void utils.cv.getMine.invalidate(),
  });

  // Map DB experiences → TimelineEditor entries
  const timelineEntries: ExperienceEntry[] = initialExperiences.map((exp) => ({
    id: exp.id,
    company: exp.company,
    role: extractLocalizedText(exp.role),
    dates: exp.dates ?? "",
    current: exp.current,
    responsibilities: exp.responsibilities.map((r) => ({
      id: r.id,
      text: extractLocalizedText(r.text),
    })),
    _status: "saved",
  }));

  const handleSaveExperience = async (entry: ExperienceEntry) => {
    const data = {
      company: entry.company,
      role: entry.role,
      dates: entry.dates,
      current: entry.current,
      order: 0,
      responsibilities: entry.responsibilities.map((r, idx) => ({
        text: r.text,
        order: idx,
      })),
    };
    if (entry._status === "new" || entry.id.startsWith("new_")) {
      await createExperience.mutateAsync(data);
    } else {
      await updateExperience.mutateAsync({ id: entry.id, ...data });
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {/* ── Tab: Description ──────────────────────────────────── */}
        {activeTab === "description" && (
          <form onSubmit={handleSaveAbout} className="space-y-4">
            <p className="text-xs text-gray-500">{t("descriptionHint")}</p>
            <LocalizedField
              mode="app-locales"
              label={t("descriptionLabel")}
              value={aboutText}
              onChange={setAboutText}
              defaultLocale={locale}
              placeholder="Tell your story…"
              multiline
              rows={6}
            />
            {aboutNudge.nudge && (
              <TranslationNudgeBanner
                nudge={aboutNudge.nudge}
                onSaveLocale={async (loc, value) => {
                  if (!value) {
                    aboutNudge.markSkipped(loc);
                    return;
                  }
                  const updated = {
                    ...aboutText,
                    translations: { ...aboutText.translations, [loc]: value },
                  };
                  setAboutText(updated);
                  await upsertAboutMe.mutateAsync({
                    aboutMe: {
                      default: updated.default,
                      translations: updated.translations,
                    },
                  });
                  aboutNudge.markDone(loc);
                }}
                onApplyAll={async (value) => {
                  const allTranslations = Object.fromEntries(
                    OTHER_LOCALES[locale].map((loc) => [loc, value]),
                  );
                  const updated = {
                    ...aboutText,
                    translations: {
                      ...aboutText.translations,
                      ...allTranslations,
                    },
                  };
                  setAboutText(updated);
                  await upsertAboutMe.mutateAsync({
                    aboutMe: {
                      default: updated.default,
                      translations: updated.translations,
                    },
                  });
                  aboutNudge.markAllDone();
                }}
                onDismiss={aboutNudge.dismiss}
              />
            )}
            <div className="flex justify-end gap-2 pt-2">
              {aboutSuccess && (
                <p className="mr-auto text-sm text-green-600">{aboutSuccess}</p>
              )}
              <button
                type="submit"
                disabled={isSavingAbout}
                className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {isSavingAbout ? t("saving") : t("save")}
              </button>
            </div>
          </form>
        )}

        {/* ── Tab: Console / Code Block ─────────────────────────── */}
        {activeTab === "console" && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">{t("consoleHint")}</p>

            {/* Live preview of the code block */}
            <div className="rounded-xl bg-gray-900 p-4 font-mono text-sm text-gray-100">
              <p className="text-purple-400">const aboutMe = () =&gt; {"{"}</p>
              <p className="pl-4 text-gray-300">return {"{"}</p>
              <p className="pl-8">
                <span className="text-yellow-300">name</span>
                <span className="text-gray-400">: </span>
                <span className="text-green-300">
                  &apos;{consoleData.name || "Your name"}&apos;
                </span>
                <span className="text-gray-400">,</span>
              </p>
              <p className="pl-8">
                <span className="text-yellow-300">languages</span>
                <span className="text-gray-400">: {"{"}</span>
              </p>
              <p className="pl-12">
                <span className="text-yellow-300">spanish</span>
                <span className="text-gray-400">: </span>
                <span className="text-green-300">
                  &apos;{consoleData.languages.spanish || "Native"}&apos;
                </span>
                <span className="text-gray-400">,</span>
              </p>
              <p className="pl-12">
                <span className="text-yellow-300">english</span>
                <span className="text-gray-400">: </span>
                <span className="text-green-300">
                  &apos;{consoleData.languages.english || "B2+"}&apos;
                </span>
                <span className="text-gray-400">,</span>
              </p>
              <p className="pl-12">
                <span className="text-yellow-300">dutch</span>
                <span className="text-gray-400">: </span>
                <span className="text-green-300">
                  &apos;{consoleData.languages.dutch || "A1"}&apos;
                </span>
              </p>
              <p className="pl-8 text-gray-400">{"}"}</p>
              <p className="pl-8">
                <span className="text-yellow-300">profession</span>
                <span className="text-gray-400">: </span>
                <span className="text-green-300">
                  &apos;{consoleData.profession || "Software Developer"}&apos;
                </span>
              </p>
              <p className="pl-4 text-gray-300">{"}"}</p>
              <p className="text-purple-400">{"}"}</p>
            </div>

            {/* Editable fields */}
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    key: "name",
                    label: "Name (name)",
                    placeholder: "Jesús Hernández",
                  },
                  {
                    key: "profession",
                    label: "Profession (profession)",
                    placeholder: "Software Developer",
                  },
                ] as {
                  key: keyof Omit<ConsoleData, "languages">;
                  label: string;
                  placeholder: string;
                }[]
              ).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={consoleData[key]}
                    onChange={(e) =>
                      setConsoleData((d) => ({ ...d, [key]: e.target.value }))
                    }
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
              ))}
              {(
                [
                  {
                    key: "spanish",
                    label: "Spanish level",
                    placeholder: "Native",
                  },
                  {
                    key: "english",
                    label: "English level",
                    placeholder: "B2+",
                  },
                  { key: "dutch", label: "Dutch level", placeholder: "A1" },
                ] as {
                  key: keyof ConsoleData["languages"];
                  label: string;
                  placeholder: string;
                }[]
              ).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={consoleData.languages[key]}
                    onChange={(e) =>
                      setConsoleData((d) => ({
                        ...d,
                        languages: { ...d.languages, [key]: e.target.value },
                      }))
                    }
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={async () => {
                  const existing = extractLocalizedText(initialAboutMe);
                  await upsertAboutMe.mutateAsync({
                    aboutMe: {
                      default: existing.default,
                      translations: existing.translations,
                      console: consoleData,
                    },
                  });
                }}
                className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                {t("save")}
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: Timeline ─────────────────────────────────────── */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">{t("timelineHint")}</p>
            <TimelineEditor
              entries={timelineEntries}
              defaultLocale={locale}
              onSave={handleSaveExperience}
              onDelete={async (id) => {
                await deleteExperience.mutateAsync({ id });
              }}
              onReorder={() => {
                // Order is preserved by DB query on page reload
                // Full reorder via batch update can be added later
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
