import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProcessPageShell } from "@/features/process-pages/components/process-section-header";
import { UsesBrowserSection } from "@/features/uses/components/uses-browser-section";
import { UsesCodingSection } from "@/features/uses/components/uses-coding-section";
import { UsesEverydaySection } from "@/features/uses/components/uses-everyday-section";
import { UsesNote } from "@/features/uses/components/uses-note";
import { UsesSoftwareSection } from "@/features/uses/components/uses-software-section";
import { UsesView } from "@/features/uses/components/uses-view";
import { renderInlineMarkdownLinks } from "@/features/uses/lib/render-inline-markdown-links";
import { getUsesPageData } from "@/features/uses/server/uses-public";
import { type Locale as AppLocale, locales } from "@/i18n/config";
import { isPublicPageLive } from "@/lib/public-preview-pages";

export { generateMetadata } from "./metadata";

interface UsesRouteProps {
  params: Promise<{ locale: AppLocale }>;
}

const isLocale = (value: string): value is AppLocale =>
  (locales as readonly string[]).includes(value);

export default async function UsesPage({ params }: UsesRouteProps) {
  if (!isPublicPageLive("uses")) notFound();

  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const [t, data] = await Promise.all([
    getTranslations("main.uses"),
    getUsesPageData(locale),
  ]);

  if (!data) notFound();

  const everydayItems = data.everyday
    .filter((item) => Boolean(item.image))
    .map((item) => ({
      id: item.id,
      href: item.href,
      image: item.image!,
      title: item.title,
      description: item.description ?? "",
    }));

  const softwareItems = data.software
    .filter((item) => Boolean(item.image))
    .map((item) => ({
      id: item.id,
      href: item.href,
      image: item.image!,
      title: item.title,
    }));

  const browserExtensions = data.browser.map((item) => ({
    href: item.href,
    label: item.title,
  }));

  return (
    <ProcessPageShell>
      <UsesView
        hero={{
          eyebrow: t("hero.eyebrow"),
          title: t("hero.title"),
          titleHighlight: t("hero.titleHighlight"),
          description: t("hero.description"),
          tabsLabel: t("hero.tabsLabel"),
          workspaceCaption: t("hero.workspaceCaption"),
          workspaceAlt: t("hero.workspaceAlt"),
          workspaceImage: data.settings.workspaceImage,
          workspaceTags: data.settings.workspaceTags,
        }}
        tabLabels={{
          all: t("hero.tabs.all"),
          everyday: t("hero.tabs.everyday"),
          software: t("hero.tabs.software"),
          browser: t("hero.tabs.browser"),
          coding: t("hero.tabs.coding"),
        }}
        everyday={
          <UsesEverydaySection
            title={t("everyday.title")}
            items={everydayItems}
            coffee={{
              title: t("everyday.coffee.title"),
              description: t("everyday.coffee.description"),
              celebrateLabel: t("everyday.coffee.celebrate"),
              ariaLabel: t("everyday.coffee.aria"),
            }}
          />
        }
        software={
          <UsesSoftwareSection
            title={t("software.title")}
            items={softwareItems}
            clarifications={data.settings.clarifications.map((body) =>
              renderInlineMarkdownLinks(body),
            )}
          />
        }
        browser={
          <UsesBrowserSection
            title={t("browser.title")}
            intro={
              data.settings.browserIntro
                ? renderInlineMarkdownLinks(data.settings.browserIntro)
                : null
            }
            extensions={browserExtensions}
          />
        }
        coding={
          <UsesCodingSection
            title={t("coding.title")}
            intro={
              data.settings.codingIntro
                ? renderInlineMarkdownLinks(data.settings.codingIntro)
                : null
            }
            previewCaption={t("coding.previewCaption")}
            previewLightAlt={t("coding.previewLightAlt")}
            previewDarkAlt={t("coding.previewDarkAlt")}
            previewLight={data.settings.codingPreviewLight}
            previewDark={data.settings.codingPreviewDark}
          />
        }
        note={
          <UsesNote
            before={t("note.before")}
            linkLabel={t("note.linkLabel")}
            after={t("note.after")}
          />
        }
      />
    </ProcessPageShell>
  );
}
