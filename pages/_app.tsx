import React from 'react';

import type { AppType } from 'next/app';
import type { AppProps } from 'next/app';

import { trpc } from '../utils/trpc';
import { Inter } from '@next/font/google';
import { NextIntlProvider } from 'next-intl';
import { Analytics } from '@vercel/analytics/react';

import '../styles/styles.scss';

const inter = Inter({ subsets: ['latin'] });

const MyApp: AppType = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <div className={inter.className}>
        <NextIntlProvider messages={pageProps.messages}>
          <Component {...pageProps} />
        </NextIntlProvider>
      </div>
      <Analytics />
    </>
  );
};
export default trpc.withTRPC(MyApp);
