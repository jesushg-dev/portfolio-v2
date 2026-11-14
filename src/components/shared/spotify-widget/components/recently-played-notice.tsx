"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";

import { formatPlayedAt } from "../utils/format-played-at";

interface RecentlyPlayedNoticeProps {
  playedAt?: string;
  locale: string;
  compact?: boolean;
}

export const RecentlyPlayedNotice: FC<RecentlyPlayedNoticeProps> = ({
  playedAt,
  locale,
  compact = false,
}) => {
  const t = useTranslations("global.footer");
  const playedAtLabel = playedAt ? formatPlayedAt(playedAt, locale) : null;

  return (
    <p
      style={{
        color: compact
          ? "rgba(255, 255, 255, 0.7)"
          : "rgba(255, 255, 255, 0.85)",
      }}
      className={
        compact
          ? "mb-1 line-clamp-2 text-[0.625rem] leading-snug"
          : "mb-2 text-center text-xs font-medium"
      }
    >
      {compact ? (
        <>
          {t("spotify.notPlayingNow")}
          {playedAtLabel
            ? ` · ${t("spotify.lastPlayed")} ${playedAtLabel}`
            : ` · ${t("spotify.lastPlayed")}`}
        </>
      ) : (
        t("spotify.notPlayingNow")
      )}
    </p>
  );
};

export default RecentlyPlayedNotice;
