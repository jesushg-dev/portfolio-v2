import { notFound } from "next/navigation";

import { ProcessPageView } from "@/features/process-pages/components/process-page-view";
import { locales, type Locale } from "@/i18n/config";
import { processPageHref } from "@/lib/process-pages/process-page-href";
import { getPublicLocale } from "@/lib/public-site/locale";
import { buildPublicAlternates } from "@/lib/public-site/metadata";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { api } from "@/trpc/server";

export { publicProcessParams as generateStaticParams } from "@/lib/public-site/static-params";
export { generateMetadata } from "./metadata";

interface ProcessPageRouteProps {
  params: Promise<{
    locale: Locale;
    slug: string;
  }>;
}

export default async function ProcessPageRoute({
  params,
}: ProcessPageRouteProps) {
  const { slug, locale } = await params;
  const activeLocale = locales.includes(locale)
    ? locale
    : await getPublicLocale();

  const page = await api.processPages.getBySlug({ slug, locale: activeLocale });

  if (!page) notFound();

  const href = processPageHref(slug);
  const alternates = await buildPublicAlternates(activeLocale, href);
  const pageUrl = alternates.canonical;
  const pageTitle = page.metaTitle || page.heroTitle || page.menuTitle;
  const pageDescription = page.metaDescription || page.heroDescription || "";
  const previewImage =
    slug === "how-i-use-ai" || slug === "qa-collaboration"
      ? `${SITE_URL}/previews/process-${slug}.webp`
      : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageTitle,
        description: pageDescription,
        inLanguage: activeLocale,
        isPartOf: {
          "@type": "WebSite",
          "@id": `${SITE_URL}#website`,
          name: SITE_NAME,
          url: SITE_URL,
        },
        breadcrumb: {
          "@id": `${pageUrl}#breadcrumb`,
        },
        mainEntity: {
          "@id": `${pageUrl}#article`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Process",
            item: `${SITE_URL}/#process`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: pageTitle,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "TechArticle",
        "@id": `${pageUrl}#article`,
        headline: pageTitle,
        description: pageDescription,
        inLanguage: activeLocale,
        image: previewImage ? [previewImage] : undefined,
        author: {
          "@type": "Person",
          name: "Jesús Hernández",
          url: SITE_URL,
        },
        publisher: {
          "@type": "Person",
          name: "Jesús Hernández",
          url: SITE_URL,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${pageUrl}#webpage`,
        },
        about: page.heroEyebrow || "Engineering Process",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProcessPageView page={page} />
    </>
  );
}
