import React from 'react';

import { trpc } from '../utils/trpc';
import { Inter } from '@next/font/google';
import { NextIntlProvider } from 'next-intl';
import { Analytics } from '@vercel/analytics/react';

import PreloadTheme from '../hoc/PreloadTheme';
import ThemeContextProvider from '../hoc/ThemeContextProvider';

import type { AppType } from 'next/app';
import type { AppProps } from 'next/app';
import '../styles/styles.scss';

const inter = Inter({ subsets: ['latin'] });

const MyApp: AppType = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <PreloadTheme />
      <div className={inter.className}>
        <NextIntlProvider messages={pageProps.messages}>
          <ThemeContextProvider>
            <Component {...pageProps} />
          </ThemeContextProvider>
        </NextIntlProvider>
      </div>
      <Analytics />
    </>
  );
};
export default trpc.withTRPC(MyApp);
