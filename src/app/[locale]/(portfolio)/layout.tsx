import { type ReactNode } from "react";
import "@/app/globals.css";

import { setRequestLocale } from "next-intl/server";
import type { Locale } from "next-intl";

import Layout from "@/components/app-layout";

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return <Layout headerAlwaysVisible>{children}</Layout>;
}
