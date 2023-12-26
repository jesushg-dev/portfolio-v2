import React, { FC } from 'react';

import dynamic from 'next/dynamic';
import { locales } from '@/config';
import TaskBar from '@/components/WinDesktop/TaskBar';

const Desktop = dynamic(() => import('@/components/WinDesktop/Desktop'), {
  ssr: false,
});

import type { Metadata } from 'next';

interface IWinElevenPageProps {
  params: { locale: string };
}

const WinElevenPage: FC<IWinElevenPageProps> = ({}) => {
  return (
    <div className="w-screen h-screen bg-windows-11 bg-center bg-cover relative overflow-hidden">
      <div className="flex flex-col w-full h-full overflow-hidden">
        <div className="flex-1 w-full relative">
          <Desktop />
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
