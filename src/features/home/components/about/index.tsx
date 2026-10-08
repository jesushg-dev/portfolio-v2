import type { FC } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import HeaderArticle from "@/components/shared/header-article";
import { cn } from "@/lib/utils";

import { TimelineHorizontalPreview } from "./timeline-horizontal-preview";
import AboutTerminalLazy from "./about-terminal-lazy";

import { resolveTenant } from "@/lib/tenant/resolve";
import { api } from "@/trpc/server";
import { type Locale, locales } from "@/i18n/config";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

function formatAboutParagraph(paragraph: string): React.ReactNode {
  const regex = /(?:\*\*|<b>|<strong>)(.*?)(?:\*\*|<\/b>|<\/strong>)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(paragraph)) !== null) {
    if (match.index > lastIndex) {
      parts.push(paragraph.slice(lastIndex, match.index));
    }

    const content = match[1];
    parts.push(
      <strong
        key={`${match.index}-${content}`}
        className="text-primary font-bold"
      >
        {content}
      </strong>,
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < paragraph.length) {
    parts.push(paragraph.slice(lastIndex));
  }

  return parts.length > 0 ? parts : paragraph;
}

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
    <div className="bg-muted border-border/40 relative w-full overflow-hidden border-y">
      <section className="mx-auto px-4 py-16 sm:px-6 lg:container lg:px-20 lg:py-20">
        <HeaderArticle
          title={t("title")}
          subtitle={t("subtitle")}
          className="mb-12 sm:mb-14"
        />

        <article
          className={cn(
            "grid items-center gap-10 lg:gap-14",
            showTerminalColumn
              ? "lg:grid-cols-[1fr_1.1fr]"
              : "mx-auto max-w-4xl",
          )}
        >
          {paragraphs.length > 0 ? (
            <div className="space-y-4">
              {paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-muted-foreground text-center text-base leading-relaxed sm:text-lg sm:leading-8 lg:text-start"
                >
                  {formatAboutParagraph(paragraph)}
                </p>
              ))}
            </div>
          ) : null}

          {showTerminalColumn ? (
            <AboutTerminalLazy data={terminalData} />
          ) : null}
        </article>

        {timelineItems.length > 0 ? (
          <div className="mt-16 sm:mt-20">
            <TimelineHorizontalPreview items={timelineItems} />
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default About;
