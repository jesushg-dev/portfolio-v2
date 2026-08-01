"use client";

import { useMemo, Fragment } from "react";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import Skeleton from "react-loading-skeleton";
import type { FC } from "react";

import { useRouter } from "@/i18n/routing";
import { api } from "@/trpc/react";
import { LIMIT_PER_PAGE_XL } from "@/utils/constants";
import FilterType from "@/components/certification/filter-type";
import { stackTypes, typeSKills } from "@/utils/constants/certificates-type";
import { resolveCertificateTabIndex } from "./resolve-certificate-tab";
import CertificateItem from "@/components/certification/certification-item";
import type { StackType } from "@prisma/client";

const NoResult = dynamic(() => import("@/components/shared/no-result"), {
  loading: () => <Skeleton count={10} />,
});

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
  slug: [(typeof stackTypes)[number]];
}

const Certification: FC<ICertificationProps> = ({ slug }) => {
  const { push } = useRouter();
  const t = useTranslations("certification");
  const locale = useLocale();
  const crtValue = useMemo(() => resolveCertificateTabIndex(slug), [slug]);

  const { data, isFetching, isLoading, fetchNextPage } =
    api.portfolio.getCertificates.useInfiniteQuery(
      {
        limit,
        locale,
        type:
          stackTypes[crtValue] === "ALL"
            ? undefined
            : [stackTypes[crtValue] as StackType],
      },
      {
        getNextPageParam: (val) => val.cursor,
      },
    );

  const handleFetchMore = () => {
    void fetchNextPage();
  };

  // change current page when change tab
  const onChangeTab = (val: number) => {
    push(
      typeSKills[val] && typeSKills[val] !== undefined
        ? `/certificates/${typeSKills[val]}`
        : "/certificates",
    );
  };

  return (
    <div className="container mx-auto">
      <FilterType value={crtValue} onChange={onChangeTab} />
      <motion.ul
        initial="hidden"
        variants={container}
        animate="visible"
        className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3"
      >
        {data?.pages.map((page, idx) => {
          const certs = page.certificates ?? [];
          return (
            <Fragment key={page.cursor ?? idx}>
              {certs.map((certificate) => (
                <motion.li
                  layout
                  key={certificate.id}
                  className="flex justify-center"
                  variants={item}
                >
                  <CertificateItem key={certificate.id} {...certificate} />
                </motion.li>
              ))}
            </Fragment>
          );
        })}
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

      {/** if there's not data show no result */}
      {(data?.pages[0]?.certificates?.length ?? 0) === 0 &&
        !isLoading &&
        !isFetching && <NoResult />}

      <div className="mt-8 flex flex-col items-center justify-center gap-4">
        {data?.pages[data.pages.length - 1]?.cursor ? (
          <button
            type="button"
            onClick={handleFetchMore}
            disabled={isFetching ?? isLoading}
            className="bg-primary pressable text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 items-center justify-center rounded-sm px-4 py-3 text-sm font-bold"
          >
            {isFetching ? t("pagination.loading") : t("pagination.loadMore")}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default Certification;
