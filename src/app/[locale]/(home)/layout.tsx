import { type ReactNode } from "react";
import "@/app/globals.css";

import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "next-intl";

import Layout from "@/components/app-layout";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "main",
  });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    keywords: t("meta.keywords"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
    },
    twitter: {
      title: t("meta.title"),
      description: t("meta.description"),
    },
  };
}

export default async function RootLayout({
  children,
  modal,
  params,
}: {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <>
      <Layout>{children}</Layout>
      {modal}
    </>
  );
}
