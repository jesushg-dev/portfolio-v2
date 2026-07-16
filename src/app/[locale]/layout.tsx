import { type ReactNode } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DocumentLang } from "@/components/document-lang";
import { routing } from "@/i18n/routing";
import { buildLocaleAlternates } from "@/lib/seo/alternates";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const headersList = await headers();
  const pathname = headersList.get("pathname") ?? `/${locale}`;

  return {
    alternates: buildLocaleAlternates(locale, pathname),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <>
      <DocumentLang locale={locale} />
      {children}
    </>
  );
}
