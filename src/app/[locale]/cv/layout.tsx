import { ReactNode } from 'react';

import { notFound } from 'next/navigation';
import { createTranslator, NextIntlClientProvider } from 'next-intl';
import type { Metadata } from 'next';

type Props = {
  children: ReactNode;
  params: { locale: string };
};

async function getMessages(locale: string) {
  try {
    return {
      ...(await import(`../../../../messages/${locale}/cv.json`)).default,
      ...(await import(`../../../../messages/${locale}/global.json`)).default,
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
    title: t('curriculum.title'),
  };
}

export default async function LocaleLayout({ children, params: { locale } }: Props) {
  const messages = await getMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
