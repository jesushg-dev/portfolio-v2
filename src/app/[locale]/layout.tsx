import { type ReactNode } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

import DocumentRoot, {
  metadata as documentMetadata,
} from "@/app/_components/document-root";
import { routing } from "@/i18n/routing";
import { buildLocaleAlternates } from "@/lib/seo/alternates";
import { Toaster } from "@/components/ui/sonner";

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
    ...documentMetadata,
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

  return (
    <DocumentRoot locale={locale} messages={await getMessages({ locale })}>
      {children}
      <Toaster />
    </DocumentRoot>
  );
}
