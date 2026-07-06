"use client";

import { useCallback, useMemo, useState, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { Locale } from "@/i18n/config";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants, Button } from "@/components/ui/button";

import type { RouterOutputs } from "@/trpc/react";

type TimelineItemRow = RouterOutputs["timelineAdmin"]["getMine"][number];

interface TimelineListProps {
  initialItems: TimelineItemRow[];
  locale: Locale;
}

const isTimelineItemRow = (value: unknown): value is TimelineItemRow => {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<TimelineItemRow>;
  return typeof row.id === "string";
};

function extractLocalizedText(raw: unknown, locale: Locale): string {
  if (!raw || typeof raw !== "object") return "";
  const obj = raw as Record<string, unknown>;
  const defaultText = typeof obj.default === "string" ? obj.default : "";
  const translations = obj.translations as Record<string, string> | undefined;
  if (translations?.[locale]) {
    return translations[locale];
  }
  return defaultText;
}

export const TimelineList: FC<TimelineListProps> = ({
  initialItems,
  locale,
}) => {
  const t = useTranslations("admin.timeline");

  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: items = initialItems } = api.timelineAdmin.getMine.useQuery(
    undefined,
    {
      initialData: initialItems,
    },
  );

  const deleteItem = api.timelineAdmin.deleteItem.useMutation({
    onSuccess: () => {
      toast.success("Deleted successfully");
      void utils.timelineAdmin.getMine.invalidate();
      setDeletingId(null);
    },
    onError: () => {
      toast.error(t("deleteError"));
      setDeletingId(null);
    },
  });

  const handleDelete = useCallback(
    (id: string) => {
      setDeletingId(id);
      deleteItem.mutate({ id });
    },
    [deleteItem],
  );

  const parseDate = useCallback((dateLike: unknown) => {
    if (
      !dateLike ||
      (typeof dateLike !== "string" &&
        typeof dateLike !== "number" &&
        !(dateLike instanceof Date))
    ) {
      return null;
    }

    const date = new Date(dateLike);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }, []);

  const getDateLabel = useCallback(
    (item: TimelineItemRow) => {
      const startDate = parseDate(item.startDate);
      const endDate = parseDate(item.endDate);
      if (!startDate) return t("noStartDate");

      const startYear = startDate.getFullYear();

      if (item.current) {
        return `${startYear} - ${t("present")}`;
      }

      if (endDate) {
        return `${startYear} - ${endDate.getFullYear()}`;
      }

      return `${startYear}`;
    },
    [parseDate, t],
  );

  const timelineItems = useMemo(() => items.filter(isTimelineItemRow), [items]);

  const columns = useMemo<ColumnDef<TimelineItemRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnTitle")} />
        ),
        meta: {
          label: t("columnTitle"),
          placeholder: "Search title...",
          variant: "text",
        },
        enableColumnFilter: true,
        cell: ({ row }) => {
          const item = row.original;
          const titleText = extractLocalizedText(item.title, locale);
          const descriptionText = extractLocalizedText(
            item.description,
            locale,
          );

          return (
            <div className="space-y-0.5">
              <p className="font-medium text-gray-900">
                {titleText || t("untitled")}
              </p>
              {descriptionText ? (
                <p className="line-clamp-2 text-xs text-gray-500">
                  {descriptionText}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "organization",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t("columnOrganization")}
          />
        ),
        meta: {
          label: t("columnOrganization"),
          placeholder: "Search organization...",
          variant: "text",
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnCategory")} />
        ),
        meta: {
          label: t("columnCategory"),
          placeholder: "Search category...",
          variant: "text",
        },
        enableColumnFilter: true,
        cell: ({ row }) => (
          <span className="text-xs tracking-wide text-gray-500 uppercase">
            {row.original.category.toLowerCase()}
          </span>
        ),
      },
      {
        accessorKey: "period",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 text-xs font-semibold tracking-wide text-gray-500 uppercase"
          >
            {t("columnPeriod")}
            <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        ),
        accessorFn: (row) => {
          const startDate = parseDate(row.startDate);
          return startDate ? startDate.getTime() : 0;
        },
        cell: ({ row }) => (
          <span className="text-xs text-gray-500">
            {getDateLabel(row.original)}
          </span>
        ),
      },
      {
        accessorKey: "location",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnLocation")} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-gray-500">
            {row.original.location ?? "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnActions")} />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/timeline/${item.id}/edit`}
                className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                <Pencil className="mr-1 inline-block h-3 w-3" /> {t("edit")}
              </Link>
              {deletingId === item.id ? (
                <span className="text-xs text-red-500">{t("deleting")}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [deletingId, getDateLabel, handleDelete, locale, parseDate, t],
  );

  const { table } = useDataTable({
    data: timelineItems,
    columns,
    pageCount: 1,
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
    initialState: {
      sorting: [{ id: "title", desc: false }],
    },
    shallow: true,
  });

  return (
    <div className="relative flex h-full min-h-[500px] flex-col">
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <Link href="/admin/timeline/new" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addNew")}
          </Link>
        </DataTableToolbar>
      </DataTable>
    </div>
  );
};
