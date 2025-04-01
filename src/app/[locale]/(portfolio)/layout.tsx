import "@/app/globals.css";

import { setRequestLocale } from "next-intl/server";
import type { Locale } from "next-intl";

import Layout from "@/components/Layout";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Layout headerAlwaysVisible>{children}</Layout>;
}
