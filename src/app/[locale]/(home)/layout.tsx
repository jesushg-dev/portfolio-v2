import "@/app/globals.css";

import { setRequestLocale } from "next-intl/server";
import type { Locale } from "next-intl";

import Layout from "@/components/Layout";
import clsx from "clsx";

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <html className="h-full" lang={locale}>
      <body
        className={clsx(
          inter.className,
          "bg-background-200 flex min-h-screen flex-col justify-between overflow-x-hidden scroll-smooth",
        )}
      ><Layout>{children}</Layout></body>
  </html>;
}
