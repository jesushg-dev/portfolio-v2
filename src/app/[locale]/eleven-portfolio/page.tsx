import React, { FC } from 'react';

import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import { unstable_setRequestLocale } from 'next-intl/server';

import TaskBar from '@/components/WinDesktop/TaskBar';
import { Windows } from '@/components/WinDesktop/WindowDnd';

import WindowProvider from '@/hoc/WindowContext';
import DesktopContextProvider from '@/hoc/DesktopContextProvider';

import { locales } from '@/config';
import type { Metadata } from 'next';

const Desktop = dynamic(() => import('@/components/WinDesktop/Desktop'), {
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
  unstable_setRequestLocale(params.locale);

  return (
    <div className="w-screen h-screen bg-windows-11 bg-center bg-cover relative overflow-hidden">
      <div className="flex flex-col w-full h-full overflow-hidden">
        <WindowProvider>
          <div className="flex-1 w-full relative">
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
}: Omit<IWinElevenPageProps, 'children'>): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'curriculum' });

  return {
    title: t('title'),
    description: t('aboutMe'),
    manifest: '/manifest.json',
    metadataBase: new URL('https://www.jesushg.com'),
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default WinElevenPage;
