export { generateMetadata } from "./metadata";
import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { CertificationsList } from "@/features/certifications/components/certifications-list";
import { getUserCertificationsWithLanguages } from "@/features/certifications/server/certification-queries";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const CertificationsPage: FC<Props> = async ({ params, searchParams }) => {
  const [{ locale }, search] = await Promise.all([params, searchParams]);

  const page = typeof search.page === "string" ? parseInt(search.page) || 1 : 1;
  const perPage =
    typeof search.perPage === "string" ? parseInt(search.perPage) || 10 : 10;

  const [t, { data: initialCertifications, languages, pageCount, totalCount }] =
    await Promise.all([
      getTranslations("admin.certifications"),
      getUserCertificationsWithLanguages({
        page,
        perPage,
        sort: [],
        filters: [],
      }),
    ]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <div className="min-h-0 flex-1">
        <CertificationsList
          initialCertifications={initialCertifications}
          languages={languages}
          locale={locale as Locale}
          pageCount={pageCount}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
};

export default CertificationsPage;
