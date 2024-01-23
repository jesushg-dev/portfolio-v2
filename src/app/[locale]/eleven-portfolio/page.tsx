import React from "react";
import dynamic from "next/dynamic";
import {
  getTranslations,
  unstable_setRequestLocale as unStableSetRequestLocale,
} from "next-intl/server";
import type { FC } from "react";
import type { Metadata } from "next";

import TaskBar from "@/components/WinDesktop/TaskBar";
import { Windows } from "@/components/WinDesktop/WindowDnd";
import WindowProvider from "@/hoc/WindowContext";
import DesktopContextProvider from "@/hoc/DesktopContextProvider";
import { locales } from "@/config";

const Desktop = dynamic(() => import("@/components/WinDesktop/Desktop"), {
  ssr: false,
});

interface IWinElevenPageProps {
  params: { locale: string };
}

// https://www.google.com/?igu=1
// https://github1s.com/
// https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0

const WinElevenPage: FC<IWinElevenPageProps> = ({ params }) => {
  // Enable static rendering
  unStableSetRequestLocale(params.locale);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-windows-11 bg-cover bg-center">
      <div className="flex h-full w-full flex-col overflow-hidden">
        <WindowProvider>
          <div className="relative w-full flex-1">
            <DesktopContextProvider>
              <Desktop />
              <Windows />
            </DesktopContextProvider>
          </div>
          <TaskBar />
        </WindowProvider>
      </div>
    </div>
  );
};

export async function generateMetadata({
  params: { locale },
}: Omit<IWinElevenPageProps, "children">): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "curriculum" });

  return {
    title: t("title"),
    description: t("aboutMe"),
    manifest: "/manifest.json",
    metadataBase: new URL("https://www.jesushg.com"),
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default WinElevenPage;
