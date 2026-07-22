import { type ReactNode } from "react";
import "@/app/globals.css";

import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "next-intl";

import Layout from "@/components/app-layout";
import TrpcProvider from "@/components/providers/trpc-provider";
import {
  CV_PDF_MODE_HEADER,
} from "@/lib/tenant/headers";

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

  const isPdfMode = (await headers()).get(CV_PDF_MODE_HEADER) === "1";

  if (isPdfMode) {
    return children;
  }

  return (
    <TrpcProvider>
      <Layout headerAlwaysVisible>{children}</Layout>
    </TrpcProvider>
  );
}
