export { generateMetadata } from "../metadata";
import type { UsesItemType } from "@prisma/client";
import { getTranslations } from "next-intl/server";

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

export default async function NewUsesItemPage({ searchParams }: Props) {
  const search = await searchParams;
  const type = parseType(
    typeof search.type === "string" ? search.type : undefined,
  );
  const [t, { initialData, languages }] = await Promise.all([
    getTranslations("admin.uses"),
    getUsesItemCreatePageData(type),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("addNew")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("createDescription")}
        </p>
      </div>
      <UsesItemForm
        initialData={initialData}
        languages={languages}
        defaultType={type}
      />
    </div>
  );
}
