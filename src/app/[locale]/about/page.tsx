import React, { FC } from 'react';

import { unstable_setRequestLocale } from 'next-intl/server';

import PageLayout from '@/components/Layout';

interface IAboutPageProps {
  params: {locale: string};
}

const AboutPage: FC<IAboutPageProps> = ({params: {locale}}) => {

  // Enable static rendering
  unstable_setRequestLocale(locale);

  return (
    <PageLayout>
      <div className="max-w-[460px]">
      </div>
    </PageLayout>
  );
}

export default AboutPage;