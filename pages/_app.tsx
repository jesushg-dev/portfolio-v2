import '../styles/styles.scss';
import type { AppProps } from 'next/app';
import { Inter } from '@next/font/google';
import { NextIntlProvider } from 'next-intl';

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <NextIntlProvider messages={pageProps.messages}>
      <main className={inter.className}>
        <Component {...pageProps} />
      </main>
    </NextIntlProvider>
  );
}
