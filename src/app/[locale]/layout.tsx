import clsx from 'clsx';
import { ReactNode } from 'react';

import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { createTranslator, NextIntlClientProvider } from 'next-intl';

import TrpcProvider from '@/hoc/TrpcProvider';
import PreloadTheme from '@/hoc/PreloadTheme';
import ThemeContextProvider from '@/hoc/ThemeContextProvider';

import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

type Props = {
  children: ReactNode;
  params: { locale: string };
};

async function getMessages(locale: string) {
  try {
    return {
      ...(await import(`../../../messages/${locale}/main.json`)).default,
      ...(await import(`../../../messages/${locale}/global.json`)).default,
    };
  } catch (error) {
    notFound();
  }
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const messages = await getMessages(locale);

  // You can use the core (non-React) APIs when you have to use next-intl
  // outside of components. Potentially this will be simplified in the future
  // (see https://next-intl-docs.vercel.app/docs/next-13/server-components).
  const t = createTranslator({ locale, messages });

  return {
    title: t('main.meta.title'),
    description: t('main.meta.description'),
    themeColor: '#05f',
    keywords: t('main.meta.keywords'),
    manifest: '/manifest.json',
    metadataBase: new URL('https://www.jesushg.com'),
    alternates: {
      canonical: '/',
      languages: {
        es: 'https://www.jesushg.com/es',
        en: 'https://www.jesushg.com/en',
        de: 'https://www.jesushg.com/de',
        'en-US': 'https://www.jesushg.com/en',
        'es-ES': 'https://www.jesushg.com/es',
      },
    },
    icons: [
      {
        url: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icon-256x256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        url: '/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        url: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        url: '/icon-512x512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        // purpose: 'maskable',
      },
    ],
    openGraph: {
      title: t('main.meta.title'),
      description: t('main.meta.description'),
      url: 'https://www.jesushg.com',
      type: 'website',
      images: [
        {
          url: 'https://res.cloudinary.com/js-media/image/upload/v1690307602/portfolio/portfolio-v2_kxkpvh.webp',
          width: 800,
          height: 600,
          alt: 'Og Image Alt',
        },
      ],
    },
    twitter: {
      site: '@jesus_hg',
      title: t('main.meta.title'),
      description: t('main.meta.description'),
      images: [
        {
          url: 'https://res.cloudinary.com/js-media/image/upload/v1690307602/portfolio/portfolio-v2_kxkpvh.webp',
          width: 800,
          height: 600,
          alt: 'Og Image Alt',
        },
      ],
    },
  };
}

/**<Head>

        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png"></link>


        <meta property="og:title" content="Portfolio - Jesús Hernández " />
        <meta property="og:url" content="https://www.jesushg.com" />
        <meta
          property="og:image"
          content="https://res.cloudinary.com/js-media/image/upload/v1690307602/portfolio/portfolio-v2_kxkpvh.webp"
        />
        <meta
          property="og:description"
          content="Hi, I'm Jesús Hernández, a Full-Stack Web Developer in React.js | Next.js | React Native | HTML 5 | CSS3 | Typescript | Responsive Design | C# | Asp.net Core | Git | Azure | SCRUM | Agile Methodology"
        />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary" />
        <meta property="twitter:title" content="Portfolio - Jesús Hernández " />
        <meta
          name="twitter:image"
          content="https://res.cloudinary.com/js-media/image/upload/v1690307602/portfolio/portfolio-v2_kxkpvh.webp"
        />
        <meta
          property="twitter:description"
          content="Hi, I'm Jesús Hernández, a Full-Stack Web Developer in React.js | Next.js | React Native | HTML 5 | CSS3 | Typescript | Responsive Design | C# | Asp.net Core | Git | Azure | SCRUM | Agile Methodology"
        />
      </Head> */

export default async function LocaleLayout({ children, params: { locale } }: Props) {
  const messages = await getMessages(locale);

  return (
    <html className="h-full" lang={locale}>
      <PreloadTheme />
      <body
        className={clsx(inter.className, 'flex min-h-screen flex-col justify-between scroll-smooth bg-background-200')}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TrpcProvider>
            <ThemeContextProvider>{children}</ThemeContextProvider>
          </TrpcProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
