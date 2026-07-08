"use client";

import type { FC } from "react";

import { locales, type Locale } from "@/i18n/config";

interface ILocaleSegmentProps {
  value: Locale;
  onChange: (locale: Locale) => void;
  defaultLocale: Locale;
  size?: "sm" | "md";
  id?: string;
  buttonIdPrefix?: string;
}

const LocaleSegment: FC<ILocaleSegmentProps> = ({
  value,
  onChange,
  defaultLocale,
  size = "md",
  id,
  buttonIdPrefix,
}) => (
  <div
    id={id}
    role="group"
    aria-label="Language"
    className={`border-border bg-muted/50 inline-flex rounded-lg border p-0.5 ${
      size === "sm" ? "text-xs" : "text-sm"
    }`}
  >
    {locales.map((loc) => {
      const active = value === loc;
      return (
        <button
          key={loc}
          id={buttonIdPrefix ? `${buttonIdPrefix}-${loc}` : undefined}
          type="button"
          onClick={() => onChange(loc)}
          className={`rounded-md px-3 py-1.5 font-medium transition-all ${
            size === "sm" ? "px-2.5 py-1" : ""
          } ${
            active
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {loc.toUpperCase()}
          {loc === defaultLocale ? (
            <span className="sr-only"> (default)</span>
          ) : null}
        </button>
      );
    })}
  </div>
);

export default LocaleSegment;
