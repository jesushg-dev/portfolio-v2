"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface DataTableFetchingIndicatorProps {
  isFetching: boolean;
}

export function DataTableFetchingIndicator({
  isFetching,
}: DataTableFetchingIndicatorProps) {
  const t = useTranslations("admin.dataTable");

  if (!isFetching) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-end">
      <div className="bg-background/80 border-border m-3 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs shadow-sm backdrop-blur-sm">
        <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
        <span className="text-muted-foreground">{t("loading")}</span>
      </div>
    </div>
  );
}
