"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import { Loader2, ArrowUpDown, Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { Locale } from "@/i18n/config";
import { getTimelineTranslationText } from "@/features/timeline/lib/timeline-editor-dto";
import type { AppLanguage } from "@prisma/client";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableFetchingIndicator } from "@/components/shared/data-table/data-table-fetching-indicator";
import { DataTableCategoryChips } from "@/components/shared/data-table/data-table-category-chips";
import {
  LanguageStatusBadge,
  computeTranslationStatus,
} from "@/components/shared/data-table/language-status-badge";
import { DataTableBulkBar } from "@/components/shared/data-table/data-table-bulk-bar";
import { Checkbox } from "@/components/ui/checkbox";
import { ExportSeedJsonButton } from "@/components/admin/shared/export-seed-json-button";
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants, Button } from "@/components/ui/button";
import { useQueryState, parseAsInteger } from "nuqs";
import { getSortingStateParser } from "@/lib/parsers";
import type { FilterItemSchema } from "@/lib/parsers";
import { cn } from "@/lib/utils";

import type { RouterOutputs } from "@/trpc/react";

import { readTimelineImages } from "@/features/timeline/lib/timeline-admin-item";

type TimelineItemRow =
  RouterOutputs["timelineAdmin"]["getMine"]["data"][number];

interface TimelineListProps {
  initialItems: TimelineItemRow[];
  languages: AppLanguage[];
  locale: Locale;
  pageCount: number;
  totalCount: number;
}

const isTimelineItemRow = (value: unknown): value is TimelineItemRow => {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<TimelineItemRow>;
  return typeof row.id === "string";
};

const CATEGORY_STYLES: Record<string, string> = {
  WORK: "bg-primary/15 text-primary border-primary/25",
  STUDY: "bg-violet-500/15 text-violet-600 border-violet-500/25",
  COURSE: "bg-amber-500/15 text-amber-600 border-amber-500/25",
};

function getCategoryLabel(
  t: ReturnType<typeof useTranslations<"admin.timeline">>,
  category: string,
): string {
  switch (category) {
    case "WORK":
      return t("categories.work");
    case "STUDY":
      return t("categories.study");
    case "COURSE":
      return t("categories.course");
    default:
      return category;
  }
}

export const TimelineList: FC<TimelineListProps> = ({
  initialItems,
  languages,
  locale,
  pageCount: initialPageCount,
  totalCount: initialTotalCount,
}) => {
  const t = useTranslations("admin.timeline");

  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const [sort] = useQueryState(
    "sort",
    getSortingStateParser<TimelineItemRow>(),
  );

  const [titleFilter] = useQueryState("title");
  const [orgFilter] = useQueryState("organization");
  const [catFilter, setCatFilter] = useQueryState("category");

  const parsedFilters = useMemo((): FilterItemSchema[] => {
    const f: FilterItemSchema[] = [];
    if (titleFilter) {
      f.push({
        id: "title",
        value: titleFilter,
        variant: "text",
        operator: "iLike",
        filterId: "title",
      });
    }
    if (orgFilter) {
      f.push({
        id: "organization",
        value: orgFilter,
        variant: "text",
        operator: "iLike",
        filterId: "organization",
      });
    }
    if (catFilter) {
      f.push({
        id: "category",
        value: catFilter,
        variant: "text",
        operator: "iLike",
        filterId: "category",
      });
    }
    return f;
  }, [titleFilter, orgFilter, catFilter]);

  const {
    data: { data: items, totalCount: trpcTotalCount } = {
      data: initialItems,
      totalCount: initialTotalCount,
    },
    isFetching,
  } = api.timelineAdmin.getMine.useQuery(
    { page, perPage, sort: sort ?? [], filters: parsedFilters },
    {
      placeholderData: {
        data: initialItems,
        pageCount: initialPageCount,
        totalCount: initialTotalCount,
      },
    },
  );

  const deleteItem = api.timelineAdmin.deleteItem.useMutation();

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setDeletingId(id);
        try {
          await deleteItem.mutateAsync({ id });
          toast.success(t("deleteSuccess"));
          await utils.timelineAdmin.getMine.invalidate();
        } catch {
          toast.error(t("deleteError"));
        } finally {
          setDeletingId(null);
        }
      });
    },
    [deleteItem, t, utils],
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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: trpcTotalCount,
      WORK: 0,
      STUDY: 0,
      COURSE: 0,
    };
    for (const item of timelineItems) {
      if (item.category && item.category in counts) {
        counts[item.category] = (counts[item.category] ?? 0) + 1;
      }
    }
    return counts;
  }, [timelineItems, trpcTotalCount]);

  const categories = useMemo(
    () => [
      { value: "all", label: t("categories.all"), count: categoryCounts.all },
      {
        value: "WORK",
        label: t("categories.work"),
        count: categoryCounts.WORK,
      },
      {
        value: "STUDY",
        label: t("categories.study"),
        count: categoryCounts.STUDY,
      },
      {
        value: "COURSE",
        label: t("categories.course"),
        count: categoryCounts.COURSE,
      },
    ],
    [categoryCounts, t],
  );

  const columns = useMemo<ColumnDef<AppTableFeatures, TimelineItemRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label={t("bulk.selected")}
            className="translate-y-0.5"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(Boolean(value))
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={t("bulk.selected")}
            className="translate-y-0.5"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
          />
        ),
        enableHiding: false,
        enableSorting: false,
        size: 40,
      },
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
        enableSorting: false,
        enableColumnFilter: true,
        cell: ({ row }) => {
          const item = row.original;
          const titleText = getTimelineTranslationText(
            item,
            languages,
            locale,
            "title",
          );
          const descriptionText = getTimelineTranslationText(
            item,
            languages,
            locale,
            "description",
          );

          return (
            <div className="space-y-0.5">
              <p className="text-foreground font-medium">
                {titleText || t("untitled")}
              </p>
              {descriptionText ? (
                <p className="text-muted-foreground line-clamp-2 text-xs">
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
        enableColumnFilter: false,
        cell: ({ row }) => {
          const cat = row.original.category;
          const badgeStyle =
            CATEGORY_STYLES[cat] ??
            "bg-muted text-muted-foreground border-border";
          return (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
                badgeStyle,
              )}
            >
              {getCategoryLabel(t, cat)}
            </span>
          );
        },
      },
      {
        accessorKey: "startDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-muted-foreground h-auto p-0 text-xs font-semibold tracking-wide uppercase"
          >
            {t("columnPeriod")}
            <ArrowUpDown className="ml-1 size-3.5" />
          </Button>
        ),
        accessorFn: (row) => {
          const startDate = parseDate(row.startDate);
          return startDate ? startDate.getTime() : 0;
        },
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
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
          <span className="text-muted-foreground text-xs">
            {row.original.location ?? "-"}
          </span>
        ),
      },
      {
        id: "languages",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnLanguages")} />
        ),
        cell: ({ row }) => {
          const item = row.original;
          const statuses = languages.map((lang) => {
            const tr = item.translations?.[lang.id];
            const status = computeTranslationStatus(tr, [
              "title",
              "description",
            ]);
            return {
              code: lang.code,
              name: lang.name,
              status,
            };
          });

          return <LanguageStatusBadge languages={statuses} />;
        },
      },
      {
        id: "images",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnImages")} />
        ),
        cell: ({ row }) => {
          const images = readTimelineImages(row.original);
          if (images.length === 0) {
            return <span className="text-muted-foreground text-xs">—</span>;
          }

          return (
            <div className="flex items-center gap-2">
              <div className="bg-muted relative h-10 w-14 overflow-hidden rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[0]}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              {images.length > 1 ? (
                <span className="text-muted-foreground text-xs tabular-nums">
                  +{images.length - 1}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "actions",
        size: 100,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnActions")} />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              <Link
                href={`/admin/timeline/${item.id}/edit`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-8 gap-1.5 px-2.5 text-xs font-medium",
                )}
              >
                <Pencil className="size-3.5" />
                <span>{t("edit")}</span>
              </Link>

              <Button
                disabled={isPending || deletingId === item.id}
                variant="ghost"
                size="icon"
                type="button"
                aria-label={t("delete")}
                onClick={() => handleDelete(item.id)}
                className="text-muted-foreground hover:bg-destructive/15 hover:text-destructive size-8 rounded-lg"
              >
                {deletingId === item.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </div>
          );
        },
      },
    ],
    [
      deletingId,
      getDateLabel,
      handleDelete,
      isPending,
      languages,
      locale,
      parseDate,
      t,
    ],
  );

  const { table } = useDataTable({
    data: timelineItems,
    columns,
    rowCount: trpcTotalCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    initialState: {
      sorting: [{ id: "startDate", desc: true }],
    },
    shallow: true,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const selectedIds = useMemo(
    () => selectedRows.map((r) => r.original.id),
    [selectedRows],
  );

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      try {
        await Promise.all(
          selectedIds.map((id) => deleteItem.mutateAsync({ id })),
        );
        toast.success(t("bulk.deleteConfirmTitle"));
        table.resetRowSelection();
        await utils.timelineAdmin.getMine.invalidate();
      } catch {
        toast.error(t("deleteError"));
      }
    });
  }, [deleteItem, selectedIds, t, table, utils]);

  const bulkBar = useMemo(() => {
    if (selectedCount === 0) return null;
    return (
      <DataTableBulkBar
        selectedCount={selectedCount}
        onClearSelection={() => table.resetRowSelection()}
        onDeleteSelected={handleBulkDelete}
        isDeleting={isPending}
        selectedText={t("bulk.selected")}
        clearText={t("bulk.clear")}
        deleteText={t("bulk.delete")}
      />
    );
  }, [selectedCount, table, handleBulkDelete, isPending, t]);

  return (
    <div className="relative flex h-full flex-col gap-3">
      <DataTableFetchingIndicator isFetching={isFetching} />

      <div className="flex flex-col gap-2">
        <DataTableToolbar table={table}>
          <div className="flex flex-wrap items-center gap-2">
            <ExportSeedJsonButton entity="timeline" />
            <Link
              id="timeline-add"
              href="/admin/timeline/new"
              className={buttonVariants()}
            >
              <Plus className="mr-2 size-4" />
              {t("addNew")}
            </Link>
          </div>
        </DataTableToolbar>

        <div className="overflow-x-auto pb-1">
          <DataTableCategoryChips
            chips={categories}
            value={catFilter ?? "all"}
            onChange={(val) => {
              void setCatFilter(val === "all" ? null : val);
            }}
          />
        </div>
      </div>

      <DataTable table={table} bulkBar={bulkBar} />
    </div>
  );
};
