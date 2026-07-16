import "@/app/globals.css";

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { TRPCReactProvider } from "@/trpc/react";
import PreloadTheme from "@/hoc/preload-theme";
import ThemeContextProvider from "@/hoc/theme-context-provider";
import clsx from "clsx";
import { Inter, Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({ subsets: ["latin"] });
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  metadataBase: new URL("https://www.jesushg.com"),
  alternates: {
    canonical: "/",
    languages: {
      es: "https://www.jesushg.com/es",
      en: "https://www.jesushg.com/en",
      nl: "https://www.jesushg.com/nl",
      "en-US": "https://www.jesushg.com/en",
      "es-ES": "https://www.jesushg.com/es",
    },
  },
  icons: [
    {
      url: "/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      url: "/icon-256x256.png",
      sizes: "256x256",
      type: "image/png",
    },
    {
      url: "/icon-384x384.png",
      sizes: "384x384",
      type: "image/png",
    },
    {
      url: "/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
    {
      url: "/icon-512x512-maskable.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
  openGraph: {
    url: "https://www.jesushg.com",
    type: "website",
    images: [
      {
        url: "https://res.cloudinary.com/js-media/image/upload/v1690307602/portfolio/portfolio-v2_kxkpvh.webp",
        width: 800,
        height: 600,
        alt: "A picture of my personal website",
      },
    ],
  },
  twitter: {
    site: "@jesus_hg",
    images: [
      {
        url: "https://res.cloudinary.com/js-media/image/upload/v1690307602/portfolio/portfolio-v2_kxkpvh.webp",
        width: 800,
        height: 600,
        alt: "A picture of my personal website",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={cn("h-full", "font-sans", geist.variable)}>
      <PreloadTheme />
      <body
        className={clsx(
          inter.className,
          "bg-background-200 text-foreground flex min-h-screen flex-col justify-between overflow-x-hidden scroll-smooth",
        )}
      >
        <NextIntlClientProvider>
          <TRPCReactProvider>
            <ThemeContextProvider>
              <NuqsAdapter>{children}</NuqsAdapter>
            </ThemeContextProvider>
          </TRPCReactProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
