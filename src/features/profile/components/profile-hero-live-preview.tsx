"use client";

import { useMemo, type FC } from "react";
import {
  type ProfileLocaleTranslation,
  hasText,
} from "../lib/profile-unified-types";

interface ProfileHeroLivePreviewProps {
  fullName: string;
  photoUrl: string;
  currentTranslation: ProfileLocaleTranslation | null;
  baseTranslation: ProfileLocaleTranslation | null;
  isNonBase: boolean;
  t: {
    fallbackNotice: string;
    defaultBadge: string;
    previewHeading: string;
  };
}

export const ProfileHeroLivePreview: FC<ProfileHeroLivePreviewProps> = ({
  fullName,
  photoUrl,
  currentTranslation,
  baseTranslation,
  isNonBase,
  t,
}) => {
  const tr = currentTranslation ?? baseTranslation;
  const isUsingFallback =
    isNonBase &&
    (!currentTranslation ||
      !hasText(currentTranslation.subtitle) ||
      !hasText(currentTranslation.tagline));

  const badgeText =
    (tr && hasText(tr.badge) ? tr.badge : null) ??
    (baseTranslation && hasText(baseTranslation.badge)
      ? baseTranslation.badge
      : null) ??
    t.defaultBadge;

  const subtitleText =
    (tr && hasText(tr.subtitle) ? tr.subtitle : null) ??
    (baseTranslation && hasText(baseTranslation.subtitle)
      ? baseTranslation.subtitle
      : "") ??
    "";

  const taglineText =
    (tr && hasText(tr.tagline) ? tr.tagline : null) ??
    (baseTranslation && hasText(baseTranslation.tagline)
      ? baseTranslation.tagline
      : "") ??
    "";

  const summaryText =
    (tr && hasText(tr.summary) ? tr.summary : null) ??
    (baseTranslation && hasText(baseTranslation.summary)
      ? baseTranslation.summary
      : "") ??
    "";

  const altText =
    (tr && hasText(tr.alt) ? tr.alt : null) ??
    (baseTranslation && hasText(baseTranslation.alt)
      ? baseTranslation.alt
      : fullName) ??
    fullName;

  // Split name to highlight the last word with accent color
  const { firstWords, lastWord } = useMemo(() => {
    const trimmed = fullName.trim();
    if (!trimmed) return { firstWords: "Developer", lastWord: "" };
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { firstWords: parts[0], lastWord: "" };
    const last = parts.pop() ?? "";
    return { firstWords: parts.join(" "), lastWord: last };
  }, [fullName]);

  // Initials for avatar fallback
  const initials = useMemo(() => {
    const trimmed = fullName.trim();
    if (!trimmed) return "?";
    return trimmed
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
  }, [fullName]);

  return (
    <div className="space-y-3">
      {isUsingFallback && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs font-medium text-amber-500">
          {t.fallbackNotice}
        </div>
      )}

      <div className="border-border/80 from-primary/10 via-card to-card relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            {/* Availability Pill */}
            <div>
              <span className="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
                <span className="bg-primary size-1.5 rounded-full" />
                <span>{badgeText}</span>
              </span>
            </div>

            {/* Main Name Heading with Last Word Highlighted */}
            <h3 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
              <span>{firstWords}</span>
              {lastWord && (
                <>
                  {" "}
                  <span className="text-primary">{lastWord}</span>
                </>
              )}
            </h3>

            {/* Professional Subtitle */}
            {subtitleText && (
              <p className="text-foreground/90 text-sm leading-snug font-semibold">
                {subtitleText}
              </p>
            )}

            {/* Tagline */}
            {taglineText && (
              <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                {taglineText}
              </p>
            )}

            {/* Summary */}
            {summaryText && (
              <p className="text-muted-foreground/80 text-xs leading-relaxed">
                {summaryText}
              </p>
            )}
          </div>

          {/* Avatar with Initials Fallback */}
          <div className="bg-primary/20 text-primary ring-primary/30 relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full text-lg font-bold shadow-md ring-2">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={altText}
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
