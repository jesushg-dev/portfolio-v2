"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { toast } from "sonner";

import { ExportSeedJsonButton } from "@/components/admin/shared/export-seed-json-button";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableFetchingIndicator } from "@/components/shared/data-table/data-table-fetching-indicator";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useDataTable } from "@/hooks/use-data-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import { getSortingStateParser } from "@/lib/parsers";
import type { FilterItemSchema } from "@/lib/parsers";
import { api, type RouterOutputs } from "@/trpc/react";

type ProcessPageRow =
  RouterOutputs["processPagesAdmin"]["getMine"]["data"][number];

interface ProcessPagesListProps {
  initialPages: ProcessPageRow[];
  pageCount: number;
  totalCount: number;
}

function toUpsertInput(row: ProcessPageRow) {
  return {
    slug: row.slug,
    template: row.template,
    isPublished: row.isPublished,
    showInNav: row.showInNav,
    order: row.order,
    navIcon: row.navIcon,
    translations: row.translations,
    contentByLanguage: row.contentByLanguage,
  };
}

export const ProcessPagesList: FC<ProcessPagesListProps> = ({
  initialPages,
  pageCount: initialPageCount,
  totalCount: initialTotalCount,
}) => {
  const t = useTranslations("admin.processPages");
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(20));
  const [sort] = useQueryState("sort", getSortingStateParser<ProcessPageRow>());
  const [titleFilter] = useQueryState("title", parseAsString);
  const [slugFilter] = useQueryState("slug", parseAsString);

  const parsedFilters = useMemo((): FilterItemSchema[] => {
    const filters: FilterItemSchema[] = [];
    if (titleFilter) {
      filters.push({
        id: "title",
        value: titleFilter,
        variant: "text",
        operator: "iLike",
        filterId: "title",
      });
    }
    if (slugFilter) {
      filters.push({
        id: "slug",
        value: slugFilter,
        variant: "text",
        operator: "iLike",
        filterId: "slug",
      });
    }
    return filters;
  }, [titleFilter, slugFilter]);

  const {
    data: { data: pages, totalCount: trpcTotalCount } = {
      data: initialPages,
      totalCount: initialTotalCount,
    },
    isFetching,
  } = api.processPagesAdmin.getMine.useQuery(
    {
      page,
      perPage,
      sort: sort ?? [],
      filters: parsedFilters,
    },
    {
      placeholderData: {
        data: initialPages,
        pageCount: initialPageCount,
        totalCount: initialTotalCount,
      },
    },
  );

  const deleteItem = api.processPagesAdmin.deleteItem.useMutation();
  const updateItem = api.processPagesAdmin.updateItem.useMutation();

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setDeletingId(id);
        try {
          await deleteItem.mutateAsync({ id });
          await utils.processPagesAdmin.getMine.invalidate();
          toast.success(t("deletedSuccess"));
        } catch {
          toast.error(t("deleteFailed"));
        } finally {
          setDeletingId(null);
        }
      });
    },
    [deleteItem, utils, t],
  );

  const handleToggle = useCallback(
    (
      row: ProcessPageRow,
      field: "isPublished" | "showInNav",
      value: boolean,
    ) => {
      startTransition(async () => {
        setTogglingId(`${row.id}:${field}`);
        try {
          await updateItem.mutateAsync({
            id: row.id,
            ...toUpsertInput(row),
            [field]: value,
          });
          await utils.processPagesAdmin.getMine.invalidate();
        } catch {
          toast.error(t("toggleFailed"));
        } finally {
          setTogglingId(null);
        }
      });
    },
    [updateItem, utils, t],
  );

  const columns = useMemo<ColumnDef<AppTableFeatures, ProcessPageRow>[]>(
    () => [
      {
        accessorKey: "order",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columns.order")} />
        ),
        cell: ({ row }) => row.original.order,
      },
      {
        id: "title",
        accessorFn: (row) =>
          Object.values(row.translations)[0]?.menuTitle ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columns.title")} />
        ),
        meta: {
          label: t("columns.title"),
          placeholder: t("searchTitle"),
          variant: "text",
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "slug",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columns.slug")} />
        ),
        meta: {
          label: t("columns.slug"),
          placeholder: t("searchSlug"),
          variant: "text",
        },
        enableColumnFilter: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-xs">
            {row.original.slug}
          </span>
        ),
      },
      {
        id: "widgets",
        accessorFn: (row) =>
          Object.values(row.contentByLanguage)[0]?.sections.length ?? 0,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columns.widgets")} />
        ),
        cell: ({ row }) =>
          Object.values(row.original.contentByLanguage)[0]?.sections.length ??
          0,
        enableSorting: false,
      },
      {
        id: "isPublished",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t("columns.published")}
          />
        ),
        cell: ({ row }) => {
          const busy =
            togglingId === `${row.original.id}:isPublished` && isPending;
          return (
            <Switch
              checked={row.original.isPublished}
              disabled={busy}
              aria-label={t("columns.published")}
              onCheckedChange={(checked) =>
                handleToggle(row.original, "isPublished", checked)
              }
            />
          );
        },
        enableSorting: false,
      },
      {
        id: "showInNav",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columns.inNav")} />
        ),
        cell: ({ row }) => {
          const busy =
            togglingId === `${row.original.id}:showInNav` && isPending;
          return (
            <Switch
              checked={row.original.showInNav}
              disabled={busy}
              aria-label={t("columns.inNav")}
              onCheckedChange={(checked) =>
                handleToggle(row.original, "showInNav", checked)
              }
            />
          );
        },
        enableSorting: false,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const id = row.original.id;
          const isDeleting = deletingId === id && isPending;
          return (
            <div className="flex items-center justify-end gap-1">
              <Link
                href={`/admin/process-pages/${id}/edit`}
                className={buttonVariants({ variant: "ghost", size: "icon" })}
              >
                <Pencil className="size-4" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                disabled={isDeleting}
                onClick={() => handleDelete(id)}
              >
                {isDeleting ? (
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
    [t, deletingId, togglingId, isPending, handleDelete, handleToggle],
  );

  const { table } = useDataTable({
    data: pages ?? [],
    columns,
    rowCount: trpcTotalCount ?? initialTotalCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    initialState: {
      sorting: [{ id: "order", desc: false }],
    },
    shallow: true,
  });

  return (
    <div className="relative flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {t("count", { count: trpcTotalCount ?? initialTotalCount })}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <ExportSeedJsonButton entity="processPages" />
          <Link
            href="/admin/process-pages/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-1 size-4" />
            {t("addNew")}
          </Link>
        </div>
      </div>
      <DataTableFetchingIndicator isFetching={isFetching} />
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
};
