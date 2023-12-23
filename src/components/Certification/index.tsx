"use client";

import React, { FC, useState, useEffect, Fragment, lazy } from 'react';

import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';

import FilterType from '@/components/Certification/FilterType';
import CertificateItem from '@/components/Certification/CertificateItem';

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

interface ICertificationProps {
  slug: (typeof stackTypes)[number];
}

const Certification: FC<ICertificationProps> = ({slug}) => {
  const locale = useLocale() as 'en' | 'es' | 'nl';
  const [crtValue, setCrtValue] = useState<number>(0);

  const t = useTranslations('certification');

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
    if (slug) {
      const slugUpperCase = slug.toUpperCase();
      setCrtValue(stackTypes.findIndex((type) => type === slugUpperCase));
    }
  }, [slug]);


  return (
    <div className="container mx-auto">
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
  );
};

export default Certification;