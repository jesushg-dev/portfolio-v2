"use client";

import { type ReactNode, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { locales, type Locale } from "@/i18n/config";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Locale metadata — kept in sync with next-intl config
// ---------------------------------------------------------------------------

const LOCALE_META: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇬🇧" },
  es: { label: "Español", flag: "🇪🇸" },
  nl: { label: "Nederlands", flag: "🇳🇱" },
};

// ---------------------------------------------------------------------------
// DB-language type (for portfolio models)
// ---------------------------------------------------------------------------

export interface DbLanguage {
  id: string;
  code: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type AppLocalesMode = {
  mode: "app-locales";
  /** Current value — a LocalizedText object */
  value: {
    default: string;
    translations?: Partial<Record<Locale, string>>;
  };
  onChange: (value: {
    default: string;
    translations?: Partial<Record<Locale, string>>;
  }) => void;
  /** Which locale is used as the "default" field */
  defaultLocale: Locale;
};

type DbLanguagesMode = {
  mode: "db-languages";
  /** Available languages from AppLanguage table */
  languages: DbLanguage[];
  /** Current translations: { languageId: text } */
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  /** Language code to show first (required, always visible) */
  primaryCode: string;
};

type LocalizedFieldProps = {
  label: string;
  /** Text for the textarea/input */
  placeholder?: string;
  /** Use textarea instead of single-line input */
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  /** Custom render for the field content given the current tab locale/id */
  children?: (localeOrId: string) => ReactNode;
} & (AppLocalesMode | DbLanguagesMode);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function TabList({
  tabs,
  active,
  onSelect,
}: {
  tabs: { key: string; label: string; flag: string }[];
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="border-border flex gap-0 overflow-x-auto border-b">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onSelect(tab.key)}
          className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            active === tab.key
              ? "border-primary text-primary"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          <span>{tab.flag}</span>
          <span className="hidden sm:inline">{tab.label}</span>
          <span className="sm:hidden">{tab.key.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LocalizedField(props: LocalizedFieldProps) {
  const t = useTranslations("admin.forms.localized");
  const {
    label,
    placeholder,
    multiline = false,
    rows = 3,
    disabled = false,
    children,
  } = props;

  const [activeLocale, setActiveLocale] = useState<Locale>(
    props.mode === "app-locales" ? props.defaultLocale : "en",
  );
  const [activeLangId, setActiveLangId] = useState<string>("");
  const [showAddMenu, setShowAddMenu] = useState(false);

  // ── App-locales mode ──────────────────────────────────────────────────────
  if (props.mode === "app-locales") {
    const { value, onChange, defaultLocale } = props;
    const resolvedActiveLocale = activeLocale || defaultLocale;

    const tabs = locales.map((loc) => ({
      key: loc,
      ...LOCALE_META[loc],
    }));

    const getCurrentText = (loc: Locale): string => {
      if (loc === defaultLocale) return value.default;
      return value.translations?.[loc] ?? "";
    };

    const setLocaleText = (loc: Locale, text: string) => {
      if (loc === defaultLocale) {
        onChange({ ...value, default: text });
      } else {
        onChange({
          ...value,
          translations: { ...value.translations, [loc]: text },
        });
      }
    };

    return (
      <div className="border-border bg-card rounded-lg border">
        <div className="border-border/70 border-b px-3 pt-2">
          <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            {label}
          </p>
          <TabList
            tabs={tabs}
            active={resolvedActiveLocale}
            onSelect={(k) => setActiveLocale(k as Locale)}
          />
        </div>
        <div className="p-3">
          {children ? (
            children(resolvedActiveLocale)
          ) : multiline ? (
            <Textarea
              value={getCurrentText(resolvedActiveLocale)}
              onChange={(e) =>
                setLocaleText(resolvedActiveLocale, e.target.value)
              }
              placeholder={placeholder}
              rows={rows}
              disabled={disabled}
              className="resize-none"
            />
          ) : (
            <Input
              type="text"
              value={getCurrentText(resolvedActiveLocale)}
              onChange={(e) =>
                setLocaleText(resolvedActiveLocale, e.target.value)
              }
              placeholder={placeholder}
              disabled={disabled}
            />
          )}
          {resolvedActiveLocale === defaultLocale && (
            <p className="text-muted-foreground/80 mt-1 text-[10px]">
              {t("defaultFallbackHint")}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── DB-languages mode ─────────────────────────────────────────────────────
  const { languages, value, onChange, primaryCode } = props;
  const resolvedActiveLangId =
    activeLangId ??
    languages.find((l) => l.code === primaryCode)?.id ??
    languages[0]?.id ??
    "";

  // Languages that already have an entry in the value map
  const enabledLangIds = new Set(Object.keys(value));
  // Always include the primary language tab
  const primaryLang = languages.find((l) => l.code === primaryCode);
  if (primaryLang) enabledLangIds.add(primaryLang.id);

  const enabledLanguages = languages.filter((l) => enabledLangIds.has(l.id));
  const addableLanguages = languages.filter((l) => !enabledLangIds.has(l.id));

  const tabs = enabledLanguages.map((lang) => ({
    key: lang.id,
    label: lang.name,
    flag: "🌐",
  }));

  const handleAddLanguage = (lang: DbLanguage) => {
    onChange({ ...value, [lang.id]: "" });
    setActiveLangId(lang.id);
    setShowAddMenu(false);
  };

  return (
    <div className="border-border bg-card rounded-lg border">
      <div className="border-border/70 border-b px-3 pt-2">
        <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
          {label}
        </p>
        <div className="flex items-center">
          <TabList
            tabs={tabs}
            active={resolvedActiveLangId}
            onSelect={setActiveLangId}
          />
          {/* Add language button */}
          {addableLanguages.length > 0 && (
            <div className="relative ml-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setShowAddMenu((v) => !v)}
                className="h-7 border-dashed px-2 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                {t("addLanguage")}
              </Button>
              {showAddMenu && (
                <div className="border-border bg-popover absolute top-full right-0 z-10 mt-1 w-44 rounded-lg border shadow-lg">
                  {addableLanguages.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => handleAddLanguage(lang)}
                      className="text-popover-foreground hover:bg-muted w-full px-3 py-2 text-left text-sm"
                    >
                      {lang.name} ({lang.code})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-3">
        {children ? (
          children(resolvedActiveLangId)
        ) : multiline ? (
          <Textarea
            value={value[resolvedActiveLangId] ?? ""}
            onChange={(e) =>
              onChange({ ...value, [resolvedActiveLangId]: e.target.value })
            }
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className="resize-none"
          />
        ) : (
          <Input
            type="text"
            value={value[resolvedActiveLangId] ?? ""}
            onChange={(e) =>
              onChange({ ...value, [resolvedActiveLangId]: e.target.value })
            }
            placeholder={placeholder}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
