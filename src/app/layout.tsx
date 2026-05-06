import "@/app/globals.css";

// Import Swiper styles
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/controller";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/keyboard";

import type { Metadata } from "next";
import { locales } from "@/i18n/config";
import { NextIntlClientProvider } from "next-intl";
import { TRPCReactProvider } from "@/trpc/react";
import PreloadTheme from "@/hoc/preload-theme";
import ThemeContextProvider from "@/hoc/theme-context-provider";
import clsx from "clsx";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className="h-full">
      <PreloadTheme />
      <body
        className={clsx(
          inter.className,
          "bg-background-200 flex min-h-screen flex-col justify-between overflow-x-hidden scroll-smooth",
        )}
      >
        <NextIntlClientProvider>
          <TRPCReactProvider>
            <ThemeContextProvider>{children}</ThemeContextProvider>
          </TRPCReactProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
