import type { ComponentProps, ReactNode } from "react";
import "@/app/globals.css";

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import PreloadTheme from "./preload-theme";
import ThemeContextProvider from "@/hoc/theme-context-provider";
import clsx from "clsx";
import { Inter, Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { DocumentLang } from "@/components/document-lang";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: false,
});

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  manifest: "/manifest.json",
  metadataBase: new URL("https://www.jesushg.com"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function DocumentRoot({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: Locale;
  messages: NonNullable<
    ComponentProps<typeof NextIntlClientProvider>["messages"]
  >;
}) {
  return (
    <html
      lang={locale}
      className={cn(
        "h-full max-w-full overflow-x-hidden font-sans",
        geist.variable,
      )}
      suppressHydrationWarning
    >
      <head>
        <PreloadTheme />
      </head>
      <body
        className={clsx(
          inter.className,
          "bg-card text-foreground flex min-h-screen w-full max-w-full flex-col justify-between overflow-x-hidden scroll-smooth",
        )}
      >
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone="UTC"
        >
          <DocumentLang locale={locale} />
          <ThemeContextProvider>{children}</ThemeContextProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
