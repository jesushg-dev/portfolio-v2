import type { FC } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import HeaderArticle from "@/components/shared/header-article";

import { TimelineHorizontalPreview } from "./timeline-horizontal-preview";
import AboutTerminalLazy from "./about-terminal-lazy";

import { resolveTenant } from "@/lib/tenant/resolve";
import { api } from "@/trpc/server";
import { type Locale, locales } from "@/i18n/config";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

const About: FC = async () => {
  const t = await getTranslations("main.about");
  const locale = await getLocale();

  const tenant = await resolveTenant();

  const [aboutData, terminalData, timelineItems] = await Promise.all([
    tenant && isLocale(locale)
      ? api.portfolio.getAboutPublic({ locale })
      : Promise.resolve(null),
    tenant && isLocale(locale)
      ? api.terminal.getPublic({ locale })
      : Promise.resolve(null),
    tenant && isLocale(locale)
      ? api.portfolio.getTimelinePublic({
          locale,
          category: "WORK",
          limit: 4,
        })
      : Promise.resolve([]),
  ]);

  const paragraphs = aboutData?.paragraphs ?? [];
  const hasTerminal = aboutData?.hasTerminal ?? false;
  const showTerminalColumn = Boolean(tenant && (hasTerminal || terminalData));

  return (
    <div className="overflow-hidden">
      <section
        id="about"
        className="mx-auto px-4 pb-4 lg:container lg:px-20 lg:pb-20"
      >
        <HeaderArticle title={t("title")} description="" subtitle="" />
        <article
          className={
            showTerminalColumn
              ? "grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-16 lg:pb-8"
              : "grid grid-cols-1 gap-4 lg:pb-8"
          }
        >
          {paragraphs.length > 0 ? (
            <div
              className={`space-y-4 ${showTerminalColumn ? "" : "mx-auto max-w-3xl"}`}
            >
              {paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-primaryText-500 text-center text-base lg:text-start"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          {showTerminalColumn ? (
            <AboutTerminalLazy data={terminalData} />
          ) : null}
        </article>

        <div
          aria-labelledby="about-timeline-heading"
          className="flex flex-col items-center gap-2"
        >
          <div className="border-background-200 w-full border-b py-6 font-bold lg:hidden">
            <h2
              id="about-timeline-heading"
              className="text-foreground text-center"
            >
              {t("timeline.title")}
            </h2>
          </div>
          <div className="w-full overflow-x-auto lg:pt-4">
            <div className="flex flex-col items-center gap-2">
              <TimelineHorizontalPreview items={timelineItems} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
