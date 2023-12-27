import React, { FC } from 'react';

import dynamic from 'next/dynamic';

import Hero from '@/components/Home/Hero';
import TaskBar from '@/components/WinDesktop/TaskBar';
import WindowDnd from '@/components/WinDesktop/WindowDnd';
import DesktopContextProvider from '@/hoc/DesktopContextProvider';

import { locales } from '@/config';
import type { Metadata } from 'next';

const Desktop = dynamic(() => import('@/components/WinDesktop/Desktop'), {
  ssr: false,
});

const Window = dynamic(() => import('@/components/WinDesktop/Window'), {
  ssr: false,
});

interface IWinElevenPageProps {
  params: { locale: string };
}
// https://github1s.com/
//https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0

const WinElevenPage: FC<IWinElevenPageProps> = ({}) => {
  return (
    <div className="w-screen h-screen bg-windows-11 bg-center bg-cover relative overflow-hidden">
      <div className="flex flex-col w-full h-full overflow-hidden">
        <div className="flex-1 w-full relative">
          <DesktopContextProvider>
            <Desktop />

            {/*<Window title="Visual Studio Code" size={{ width: 1000, height: 520 }}>
              <iframe
                src="https://www.google.com/?igu=1"
                width="100%"
                height="100%"
                frameBorder="0"
                allow="encrypted-media"
              />
            </Window>*/}
            <WindowDnd title="Visual Studio Code" size={{ width: 1000, height: 520 }}>
              <Hero />
              {/*
              <iframe
                src="https://www.google.com/?igu=1"
                width="100%"
                height="100%"
                frameBorder="0"
                allow="encrypted-media"
              />
              */}
            </WindowDnd>
          </DesktopContextProvider>
        </div>
        <TaskBar />
      </div>
    </div>
  );
};

/*export async function generateMetadata({ params: { locale } }: Omit<IWinElevenPageProps, 'children'>): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: "curriculum"});
  
  return {
    title: t('title'),
    description: t("aboutMe"),
    manifest: '/manifest.json',
    metadataBase: new URL('https://www.jesushg.com'),
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}*/

export default WinElevenPage;
