import { getPublicLocale } from "@/lib/public-site/locale";
import type { FC, ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { HeadingAccent, ShowcaseSection } from "@/components/shared/showcase";
import { api } from "@/trpc/server";
import { type Locale, locales } from "@/i18n/config";
import { resolvePublicTenant } from "@/lib/public-site/tenant";
import AboutTerminalLazy from "./about-terminal-lazy";

const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/**
 * Parses markdown-style **bold** text into strong elements with primary styling.
 */
function formatAboutParagraph(text: string): ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="text-primary font-semibold">
          {boldText}
        </strong>
      );
    }
    return part;
  });
}

const About: FC = async () => {
  const locale = await getPublicLocale();
  const t = await getTranslations({
    locale,
    namespace: "main.about",
  });

  const tenant = await resolvePublicTenant();

  const [aboutData, terminalData] = await Promise.all([
    tenant && isLocale(locale)
      ? api.portfolio.getAboutPublic({ locale })
      : Promise.resolve(null),
    tenant && isLocale(locale)
      ? api.terminal.getPublic({ locale })
      : Promise.resolve(null),
  ]);

  const paragraphs = aboutData?.paragraphs ?? [];

  return (
    <ShowcaseSection
      variant="tile-dark"
      ariaLabelledBy="about-heading"
      className="border-border/80 border-t"
    >
      {/* 2-column layout matching prototype: Info on left, Terminal on right */}
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
        <div>
          <p className="text-primary mb-3 font-mono text-xs font-semibold tracking-wider uppercase sm:text-sm">
            {t("subtitle")}
          </p>
          <h2
            id="about-heading"
            className="text-foreground text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl"
          >
            {t("titleLead")} <HeadingAccent>{t("titleGradient")}</HeadingAccent>
          </h2>
          <p className="text-muted-foreground mt-5 text-base leading-relaxed sm:text-lg">
            {paragraphs[0] ? formatAboutParagraph(paragraphs[0]) : t("title")}
          </p>
          {paragraphs.length > 1 ? (
            <div className="mt-4 space-y-4">
              {paragraphs.slice(1).map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-muted-foreground text-base leading-relaxed sm:text-lg"
                >
                  {formatAboutParagraph(paragraph)}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        {/* Right column: Terminal window */}
        <div className="w-full">
          <AboutTerminalLazy data={terminalData} />
        </div>
      </div>
    </ShowcaseSection>
  );
};

export default About;
