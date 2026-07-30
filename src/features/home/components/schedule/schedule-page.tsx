"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { InlineWidget } from "react-calendly";

import { useRouter } from "@/i18n/routing";
import { CALENDLY_PAGE_SETTINGS } from "@/utils/calendly-url";

interface SchedulePageProps {
  calendlyUrl: string;
}

export function SchedulePage({ calendlyUrl }: SchedulePageProps) {
  const t = useTranslations("main.contact");
  const router = useRouter();
  const url = calendlyUrl.trim();

  if (!url) return null;

  return (
    <section className="bg-background min-h-screen pt-24 pb-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="border-border bg-card/50 text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t("schedulePageBack")}
          </button>
          <h1 className="text-foreground text-2xl font-semibold sm:text-3xl">
            {t("schedulePageTitle")}
          </h1>
        </header>

        <InlineWidget
          url={url}
          pageSettings={CALENDLY_PAGE_SETTINGS}
          className="calendly-inline-widget-dark"
          styles={{
            minWidth: "100%",
            height: "calc(100dvh - 13rem)",
            background: "transparent",
          }}
        />
      </div>
    </section>
  );
}
