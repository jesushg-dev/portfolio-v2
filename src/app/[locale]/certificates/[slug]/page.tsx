'use client';

import React, { FC, useState, useEffect, Fragment, lazy } from 'react';

import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import Skeleton from 'react-loading-skeleton';

import Layout from '@/components/Layout';
import CertificateItem from '@/components/Certification/CertificateItem';

import HeaderArticle from '@/components/Common/HeaderArticle';
import FilterType from '@/components/Certification/FilterType';

import { trpcReact as trpc } from '@/utils/trpc';
import { LIMIT_PER_PAGE_XL } from '@/utils/constants';

import { stackTypes } from '@/utils/constants/certificatesType';

const NoResult = lazy(() => import('@/components/Common/NoResult'));

type UndefinedOrStackTypes = Exclude<(typeof stackTypes)[number], 'ALL'> | undefined;

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

interface ICvPageProps {
  params: {
    slug: (typeof stackTypes)[number];
  };
}

const CvPage: FC<ICvPageProps> = ({ params }) => {
  const locale = useLocale() as 'en' | 'es' | 'de';
  const t = useTranslations('certification');

  const [crtValue, setCrtValue] = useState<number>(0);

  const { data, isFetching, isLoading, fetchNextPage } = trpc.getCertificates.useInfiniteQuery(
    {
      limit,
      locale,
      type: stackTypes[crtValue] === 'ALL' ? undefined : (stackTypes[crtValue] as UndefinedOrStackTypes),
    },
    {
      getNextPageParam: (data) => data.cursor,
    }
  );

  const handleFetchMore = () => {
    fetchNextPage();
  };

  useEffect(() => {
    if (params.slug) {
      const slugUpperCase = params.slug.toUpperCase();
      setCrtValue(stackTypes.findIndex((type) => type === slugUpperCase));
    }
  }, [params]);

  return (
    <Layout headerAlwaysVisible={true}>
      <div className="overflow-hidden">
        <section id="certifications" className="relative mx-auto px-4 pb-6 lg:container lg:px-20 pt-20 lg:pb-20">
          <div className="absolute [mask-image:linear-gradient(to_bottom,transparent,white)] h-96 -inset-x-10 opacity-60 rotate-180 text-gray-500/20 top-0">
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
            <HeaderArticle title={t('title')} subtitle={t('subtitle')} description={t('description')} />
            <FilterType value={crtValue} onChange={setCrtValue} />
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

            {isLoading && (
              <Skeleton
                inline
                count={10}
                width="100%"
                height="19rem"
                className="rounded-md"
                containerClassName="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3"
              />
            )}

            {/**if there's not data show no result */}
            {data?.pages[0].data.length === 0 && !isLoading && !isFetching && <NoResult />}

            <div className="mt-8 flex flex-col items-center justify-center gap-4">
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
      </div>
    </Layout>
  );
};

//generate static paths for stackTypes (frontend, backend, etc) with typescript
export const generateStaticParams = () => {
  return stackTypes.map((type) => ({
    slug: type.toLowerCase(),
  }));
};

/*// todo: i need to determine if i should continue using TRPC or directly use the Prisma Client
// this does not work with TRPC because it does not support getStaticPaths
const getCertificates = async ({ params }: { params: { slug: string } }) => {
  const locale = params.locale as 'en' | 'es' | 'de';
  const type = stackTypes.find((type) => type.toLowerCase() === params.slug.toUpperCase());
  const certificates = await trpc.getCertificates.query({ locale, type });
  return { props: { certificates } };
};*/

export default CvPage;
