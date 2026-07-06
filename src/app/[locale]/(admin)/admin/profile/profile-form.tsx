"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { User, FileText, Code2, Image as ImageIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Locale } from "@/i18n/config";
import { api } from "@/trpc/react";
import { LocalizedField } from "@/components/admin/localized-field";
import { TranslationNudgeBanner } from "@/components/admin/translation-nudge-banner";
import { useTranslationNudge } from "@/hooks/admin/use-translation-nudge";
import { Textarea } from "@/components/ui/textarea";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProfileFormProps {
  locale: Locale;
  initial?: {
    fullName: string;
    photoUrl: string;
    degree: { default: string; translations?: Record<string, string> };
    clientImageAlt: { default: string; translations?: Record<string, string> };
  };
  initialAboutMe?: Record<string, unknown> | null;
}

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

function extractLocalizedText(raw: unknown) {
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

type TabKey = "hero" | "about" | "console";
const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "hero", label: "Hero & Profile", icon: ImageIcon },
  { key: "about", label: "About Me", icon: FileText },
  { key: "console", label: "Code Block", icon: Code2 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProfileForm({
  locale,
  initial,
  initialAboutMe,
}: ProfileFormProps) {
  const t = useTranslations("admin.profile");
  const utils = api.useUtils();

  const [activeTab, setActiveTab] = useState<TabKey>("hero");

  // Hero State
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [degree, setDegree] = useState(initial?.degree ?? { default: "" });
  const [clientImageAlt, setClientImageAlt] = useState(
    initial?.clientImageAlt ?? { default: "" },
  );

  // About State
  const [aboutText, setAboutText] = useState(
    extractLocalizedText(initialAboutMe),
  );

  // Code Block State
  // Extract consoleCode string from initialAboutMe
  const initialConsoleCode =
    typeof initialAboutMe?.consoleCode === "string"
      ? initialAboutMe.consoleCode
      : "const dev = {\n  name: 'Jesús',\n  roles: ['Developer', 'Engineer']\n};";

  const [consoleCode, setConsoleCode] = useState(initialConsoleCode);

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const upsertHeader = api.cv.upsertHeader.useMutation();
  const upsertAboutMe = api.cv.upsertAboutMe.useMutation();

  const degreeNudge = useTranslationNudge(`profile_degree_${locale}`);
  const aboutNudge = useTranslationNudge(`about_text_${locale}`);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");
    try {
      // 1. Save Header / Hero
      await upsertHeader.mutateAsync({
        fullName,
        degree,
        photoUrl: photoUrl || null,
        clientImageAlt,
      });

      // 2. Save About Me & Code Block
      const payloadAbout = {
        default: aboutText.default,
        translations: aboutText.translations,
        consoleCode: consoleCode, // injecting the passthrough field
      };
      await upsertAboutMe.mutateAsync({
        aboutMe: payloadAbout,
      });

      // Invalidate TRPC
      await utils.cv.getMine.invalidate();

      // Degree Nudge
      const prevDegreeDefault = initial?.degree?.default ?? "";
      if (degree.default !== prevDegreeDefault) {
        const otherLocaleValues = Object.fromEntries(
          OTHER_LOCALES[locale].map((loc) => [
            loc,
            { ...LOCALE_META[loc], value: degree.translations?.[loc] ?? "" },
          ]),
        );
        degreeNudge.triggerNudge({
          storageKey: `profile_degree_${locale}`,
          fieldLabel: t("degreeLabel"),
          editedLocale: locale,
          editedValue: degree.default,
          otherLocaleValues,
        });
      }

      // About Me Nudge
      const prevAboutDefault = extractLocalizedText(initialAboutMe).default;
      if (aboutText.default !== prevAboutDefault) {
        const otherLocaleValues = Object.fromEntries(
          OTHER_LOCALES[locale].map((loc) => [
            loc,
            { ...LOCALE_META[loc], value: aboutText.translations?.[loc] ?? "" },
          ]),
        );
        aboutNudge.triggerNudge({
          storageKey: `about_text_${locale}`,
          fieldLabel: t("descriptionLabel") || "About Me Description",
          editedLocale: locale,
          editedValue: aboutText.default,
          otherLocaleValues,
        });
      }

      setSuccessMsg(t("savedSuccess"));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm">
      {/* Tabs */}
      <div className="bg-muted/30 flex overflow-hidden rounded-t-xl">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary bg-card"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="p-6">
        {/* --- HERO TAB --- */}
        {activeTab === "hero" && (
          <div className="space-y-6">
            <h2 className="text-foreground text-lg font-semibold">
              {t("heroSection")}
            </h2>
            <div className="flex items-start gap-6">
              {/* Photo preview */}
              <div className="mt-2 shrink-0">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={fullName}
                    className="border-background h-24 w-24 rounded-full border-4 object-cover shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "";
                    }}
                  />
                ) : (
                  <div className="bg-muted flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed">
                    <User className="text-muted-foreground/70 h-10 w-10" />
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="min-w-0 flex-1 space-y-4">
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    {t("fullNameLabel")}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus-visible:ring-3"
                    placeholder="Jesús Hernández"
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    {t("photoUrlLabel")}
                  </label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus-visible:ring-3"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>
            </div>

            <hr className="border-border/60" />

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                {t("professionalTitle")}
              </h3>
              <LocalizedField
                mode="app-locales"
                label={t("degreeLabel")}
                value={degree}
                onChange={setDegree}
                defaultLocale={locale}
                placeholder="e.g. Web Developer"
              />

              {degreeNudge.nudge && (
                <div className="mt-4">
                  <TranslationNudgeBanner
                    nudge={degreeNudge.nudge}
                    onSaveLocale={async (loc, value) => {
                      if (!value) {
                        degreeNudge.markSkipped(loc);
                        return;
                      }
                      const updated = {
                        ...degree,
                        translations: { ...degree.translations, [loc]: value },
                      };
                      setDegree(updated);
                      await upsertHeader.mutateAsync({
                        fullName,
                        degree: updated,
                        photoUrl: photoUrl || null,
                        clientImageAlt,
                      });
                      degreeNudge.markDone(loc);
                    }}
                    onApplyAll={async (value) => {
                      const allTranslations = Object.fromEntries(
                        OTHER_LOCALES[locale].map((loc) => [loc, value]),
                      );
                      const updated = {
                        ...degree,
                        translations: {
                          ...degree.translations,
                          ...allTranslations,
                        },
                      };
                      setDegree(updated);
                      await upsertHeader.mutateAsync({
                        fullName,
                        degree: updated,
                        photoUrl: photoUrl || null,
                        clientImageAlt,
                      });
                      degreeNudge.markAllDone();
                    }}
                    onDismiss={degreeNudge.dismiss}
                  />
                </div>
              )}
            </div>

            <hr className="border-border/60" />

            <div>
              <h3 className="text-foreground mb-1 text-sm font-semibold">
                {t("altTextTitle")}
              </h3>
              <p className="text-muted-foreground mb-4 text-xs">
                {t("altTextHint")}
              </p>
              <LocalizedField
                mode="app-locales"
                label={t("altTextLabel")}
                value={clientImageAlt}
                onChange={setClientImageAlt}
                defaultLocale={locale}
                placeholder="e.g. Photo of Jesús sitting at a desk"
              />
            </div>
          </div>
        )}

        {/* --- ABOUT TAB --- */}
        {activeTab === "about" && (
          <div className="space-y-6">
            <h2 className="text-foreground text-lg font-semibold">
              {t("aboutMeTitle") ?? "About Me"}
            </h2>
            <p className="text-muted-foreground text-sm">
              Provide a detailed description of yourself. You can use multiple
              paragraphs.
            </p>

            <LocalizedField
              mode="app-locales"
              label={t("descriptionLabel") ?? "Description"}
              value={aboutText}
              onChange={setAboutText}
              defaultLocale={locale}
              multiline={true}
              placeholder="I am a passionate software engineer..."
            />

            {aboutNudge.nudge && (
              <div className="mt-4">
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
                    const payload = {
                      default: updated.default,
                      translations: updated.translations,
                      consoleCode,
                    };
                    await upsertAboutMe.mutateAsync({ aboutMe: payload });
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
                    const payload = {
                      default: updated.default,
                      translations: updated.translations,
                      consoleCode,
                    };
                    await upsertAboutMe.mutateAsync({ aboutMe: payload });
                    aboutNudge.markAllDone();
                  }}
                  onDismiss={aboutNudge.dismiss}
                />
              </div>
            )}
          </div>
        )}

        {/* --- CONSOLE CODE TAB --- */}
        {activeTab === "console" && (
          <div className="space-y-4">
            <h2 className="text-foreground text-lg font-semibold">
              Hero Code Block
            </h2>
            <p className="text-muted-foreground text-sm">
              Write the raw code you want to appear in the stylized code block
              section of your portfolio hero.
            </p>

            <div className="border-input bg-muted/30 overflow-hidden rounded-lg border p-1">
              <Textarea
                value={consoleCode}
                onChange={(e) => setConsoleCode(e.target.value)}
                className="text-foreground min-h-[300px] w-full resize-y border-none bg-transparent p-4 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="const developer = {\n  name: 'John Doe'\n};"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="border-border/60 mt-8 flex items-center justify-between border-t pt-5">
          {successMsg ? (
            <p className="text-primary text-sm font-medium">{successMsg}</p>
          ) : upsertHeader.error || upsertAboutMe.error ? (
            <p className="text-destructive text-sm">
              {(upsertHeader.error ?? upsertAboutMe.error)?.message}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Don&apos;t forget to save your changes.
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-2.5 text-sm font-medium shadow transition-colors disabled:opacity-50"
          >
            {isSaving ? t("saving") : t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}
