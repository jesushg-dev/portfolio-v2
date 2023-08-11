'use client';

import React, { FC, lazy, Suspense, Fragment } from 'react';

import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';

import Layout from '@/components/Layout';
import CertificateItem from '@/components/Certificates/CertificateItem';

import { trpcReact as trpc } from '@/utils/trpc';
import { LIMIT_PER_PAGE_XL } from '@/utils/constants';

//const CertificateItem = lazy(() => import('@/components/Certificates/CertificateItem'));

const limit = LIMIT_PER_PAGE_XL;

const container = {
  hidden: { opacity: 1, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

interface ICvPageProps {}

const CvPage: FC<ICvPageProps> = ({}) => {
  const locale = useLocale() as 'en' | 'es' | 'de';
  const t = useTranslations('certification');

  const { data, isFetching, isLoading, fetchNextPage } = trpc.getCertificates.useInfiniteQuery(
    { limit, locale },
    {
      getNextPageParam: (data) => data.cursor,
    }
  );
  console.log('🚀 ~ file: page.tsx:50 ~ data:', data);

  const handleFetchMore = () => {
    fetchNextPage();
  };

  return (
    <Layout headerAlwaysVisible={true}>
      <section id="certifications" className="relative mx-auto px-4 py-6 lg:container lg:px-20 lg:pt-40 lg:pb-20">
        <div className="absolute [mask-image:linear-gradient(to_bottom,transparent,white)] h-96 inset-x-0 opacity-60 rotate-180 text-gray-500/20 top-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute h-full inset-0 w-full">
            <defs>
              <pattern
                height={32}
                id="grid-pattern"
                patternTransform="translate(0 -1)"
                patternUnits="userSpaceOnUse"
                width={32}
                x="50%"
                y="100%">
                <path d="M0 32V.5H32" fill="none" stroke="currentColor" />
              </pattern>
            </defs>
            <rect fill="url(#grid-pattern)" height="100%" width="100%" />
          </svg>
        </div>
        <div className="container mx-auto">
          <div className="container mx-auto mb-8">
            <div className="-mx-4 flex flex-wrap">
              <div className="w-full px-4">
                <div className="mx-auto mb-[60px] max-w-[510px] text-center">
                  <span className="mb-2 block text-lg font-semibold text-primary-700">{t('subtitle')}</span>
                  <h2 className="mb-4 text-3xl font-bold text-primaryText-500 sm:text-4xl md:text-[40px]">
                    {t('title')}
                  </h2>
                  <p className="text-body-color text-base">{t('description')}</p>
                </div>
              </div>
            </div>
          </div>
          <motion.ul
            initial="hidden"
            variants={container}
            animate="visible"
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {data?.pages.map((page, idx) => (
              <Fragment key={page.cursor ?? idx}>
                {page.data.map((certificate) => (
                  <motion.li layout key={certificate.id} className="flex justify-center" variants={item}>
                    <CertificateItem key={certificate.id} {...certificate} />
                  </motion.li>
                ))}
              </Fragment>
            ))}
          </motion.ul>
          <div className="mt-8 flex flex-col items-center justify-center gap-4">
            {isLoading || isFetching ? (
              <div className="h-10 w-10 animate-spin rounded-full border border-b-2 border-primary-900 "></div>
            ) : null}

            {data?.pages[data.pages.length - 1].hasMore ? (
              <button
                type="button"
                disabled={isFetching || isLoading}
                className="rounded bg-primary-500 px-4 py-2 font-bold text-secondaryText-50 hover:bg-primary-700"
                onClick={handleFetchMore}>
                {isFetching ? t('pagination.loading') : t('pagination.loadMore')}
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CvPage;
