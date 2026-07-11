"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
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
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants, Button } from "@/components/ui/button";

import type { RouterOutputs } from "@/trpc/react";

import { readTimelineImages } from "@/features/timeline/lib/timeline-admin-item";

type TimelineItemRow = RouterOutputs["timelineAdmin"]["getMine"][number];

interface TimelineListProps {
  initialItems: TimelineItemRow[];
  languages: AppLanguage[];
  locale: Locale;
}

const isTimelineItemRow = (value: unknown): value is TimelineItemRow => {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<TimelineItemRow>;
  return typeof row.id === "string";
};

export const TimelineList: FC<TimelineListProps> = ({
  initialItems,
  languages,
  locale,
}) => {
  const t = useTranslations("admin.timeline");

  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data: items = initialItems } = api.timelineAdmin.getMine.useQuery(
    undefined,
    {
      initialData: initialItems,
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
        meta: {
          label: t("columnCategory"),
          placeholder: "Search category...",
          variant: "text",
        },
        enableColumnFilter: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs tracking-wide uppercase">
            {row.original.category.toLowerCase()}
          </span>
        ),
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
            <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        ),
        accessorFn: (row) => {
          const startDate = parseDate(row.startDate);
          return startDate ? startDate.getTime() : 0;
        },
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
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
                <span className="text-muted-foreground text-xs">
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
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/timeline/${item.id}/edit`}
                className="bg-muted text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg px-2.5 py-1 text-xs font-medium"
              >
                <Pencil className="mr-1 inline-block h-3 w-3" /> {t("edit")}
              </Link>

              <Button
                disabled={isPending || deletingId === item.id}
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => handleDelete(item.id)}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded"
              >
                {deletingId === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
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
    pageCount: 1,
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
    initialState: {
      sorting: [{ id: "startDate", desc: true }],
    },
    shallow: true,
  });

  return (
    <div className="relative flex h-full min-h-[500px] flex-col">
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <Link
            id="timeline-add"
            href="/admin/timeline/new"
            className={buttonVariants()}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addNew")}
          </Link>
        </DataTableToolbar>
      </DataTable>
    </div>
  );
};
