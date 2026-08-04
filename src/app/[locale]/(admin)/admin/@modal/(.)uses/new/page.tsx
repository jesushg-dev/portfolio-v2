export { generateMetadata } from "../../../uses/metadata";
import type { UsesItemType } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { PageDialogWrapper } from "@/components/shared/page-container";
import { UsesItemForm } from "@/features/uses/components/admin/uses-item-form";
import { getUsesItemCreatePageData } from "@/features/uses/server/uses-queries";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseType(value: string | undefined): UsesItemType {
  if (value === "SOFTWARE" || value === "BROWSER" || value === "EVERYDAY") {
    return value;
  }
  return "EVERYDAY";
}

export default async function NewUsesItemModal({ searchParams }: Props) {
  const search = await searchParams;
  const type = parseType(
    typeof search.type === "string" ? search.type : undefined,
  );
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.uses"),
    getUsesItemCreatePageData(type),
  ]);

  return (
    <PageDialogWrapper title={t("addNew")} description={t("createDescription")}>
      <UsesItemForm
        initialData={initialData}
        languages={languages}
        defaultType={type}
      />
    </PageDialogWrapper>
  );
}
