import type { ReactNode } from "react";
import { cookies } from "next/headers";
import "@/app/globals.css";

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import PreloadTheme from "@/hoc/preload-theme";
import ThemeContextProvider from "@/hoc/theme-context-provider";
import clsx from "clsx";
import { Inter, Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], display: "swap" });
import { Toaster } from "@/components/ui/sonner";

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

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const lang = locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : defaultLocale;

  return (
    <html
      lang={lang}
      className={cn(
        "h-full max-w-full overflow-x-hidden font-sans",
        geist.variable,
      )}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
      </head>
      <PreloadTheme />
      <body
        className={clsx(
          inter.className,
          "bg-card text-foreground flex min-h-screen w-full max-w-full flex-col justify-between overflow-x-hidden scroll-smooth",
        )}
      >
        <NextIntlClientProvider>
          <ThemeContextProvider>{children}</ThemeContextProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
