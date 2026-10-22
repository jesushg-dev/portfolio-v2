"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Skeleton from "react-loading-skeleton";
import type { FC } from "react";

import { api } from "@/trpc/react";
import { LIMIT_PER_PAGE_BIG } from "@/utils/constants";
import type { stackTypes } from "@/utils/constants/certificates-type";
import { CertificatesCatalogView } from "./certificates-catalog-view";
import type { CertificateType } from "@/utils/interfaces/types";

const NoResult = dynamic(() => import("@/components/shared/no-result"), {
  loading: () => <Skeleton count={10} />,
});

interface ICertificationProps {
  slug?: [(typeof stackTypes)[number]] | string[];
  initialCertificates?: CertificateType[];
  initialSearchParams?: Record<string, string | string[] | undefined>;
}

const Certification: FC<ICertificationProps> = ({
  slug,
  initialCertificates,
  initialSearchParams,
}) => {
  const t = useTranslations("certification");
  const locale = useLocale();

  const hasInitial = Boolean(
    initialCertificates && initialCertificates.length > 0,
  );

  const { data, isFetching, isLoading, fetchNextPage } =
    api.portfolio.getCertificates.useInfiniteQuery(
      {
        limit: LIMIT_PER_PAGE_BIG,
        locale,
      },
      {
        getNextPageParam: (val) => val.cursor,
        enabled: !hasInitial,
      },
    );

  const allCertificates = useMemo<CertificateType[]>(() => {
    if (initialCertificates && initialCertificates.length > 0) {
      return initialCertificates;
    }
    return data?.pages.flatMap((page) => page.certificates ?? []) ?? [];
  }, [data, initialCertificates]);

  if (isLoading && allCertificates.length === 0) {
    return (
      <div className="mx-auto w-full px-4 pt-24 pb-20 sm:px-6 sm:pt-28 lg:container lg:px-20">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <Skeleton width="8rem" height="1.25rem" className="mb-2" />
          <Skeleton width="18rem" height="2.5rem" className="mb-4" />
          <Skeleton width="26rem" height="1.5rem" />
        </div>
        <Skeleton
          inline
          count={6}
          width="100%"
          height="19rem"
          className="react-loading-skeleton rounded-2xl"
          containerClassName="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        />
      </div>
    );
  }

  if (allCertificates.length === 0 && !isLoading && !isFetching) {
    return (
      <div className="mx-auto w-full px-4 pt-24 pb-20 sm:px-6 sm:pt-28 lg:container lg:px-20">
        <NoResult />
      </div>
    );
  }

  const lastPage = data?.pages[data.pages.length - 1];
  const lastPageCursor = lastPage?.cursor;
  const hasMore = Boolean(
    lastPageCursor &&
    ((lastPage as { hasMore?: boolean } | undefined)?.hasMore === true ||
      ((lastPage as { hasMore?: boolean } | undefined)?.hasMore !== false &&
        allCertificates.length >= LIMIT_PER_PAGE_BIG)),
  );

  const handleFetchMore = () => {
    void fetchNextPage();
  };

  return (
    <div className="bg-background min-h-screen">
      <CertificatesCatalogView
        initialCertificates={allCertificates}
        initialTypeSlug={slug?.[0]}
        initialSearchParams={initialSearchParams}
      />

      {hasMore ? (
        <div className="mt-8 flex flex-col items-center justify-center pb-12">
          <button
            type="button"
            onClick={handleFetchMore}
            disabled={isFetching || isLoading}
            className="bg-primary pressable text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-sm px-4 py-3 text-sm font-bold"
          >
            {isFetching ? t("pagination.loading") : t("pagination.loadMore")}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default Certification;
