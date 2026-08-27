"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { UsesItemType } from "@prisma/client";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { toast } from "sonner";

import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableFetchingIndicator } from "@/components/shared/data-table/data-table-fetching-indicator";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { useDataTable } from "@/hooks/use-data-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import { getSortingStateParser } from "@/lib/parsers";
import type { FilterItemSchema } from "@/lib/parsers";
import { api, type RouterOutputs } from "@/trpc/react";

type UsesItemRow = RouterOutputs["usesAdmin"]["getMine"]["data"][number];

interface UsesItemsListProps {
  type: UsesItemType;
  initialItems: UsesItemRow[];
  pageCount: number;
  totalCount: number;
}

export const UsesItemsList: FC<UsesItemsListProps> = ({
  type,
  initialItems,
  pageCount: initialPageCount,
  totalCount: initialTotalCount,
}) => {
  const t = useTranslations("admin.uses");
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(20));
  const [sort] = useQueryState("sort", getSortingStateParser<UsesItemRow>());
  const [titleFilter] = useQueryState("title", parseAsString);

  const parsedFilters = useMemo((): FilterItemSchema[] => {
    if (!titleFilter) return [];
    return [
      {
        id: "title",
        value: titleFilter,
        variant: "text",
        operator: "iLike",
        filterId: "title",
      },
    ];
  }, [titleFilter]);

  const {
    data: { data: items, totalCount: trpcTotalCount } = {
      data: initialItems,
      totalCount: initialTotalCount,
    },
    isFetching,
  } = api.usesAdmin.getMine.useQuery(
    {
      page,
      perPage,
      sort: sort ?? [],
      filters: parsedFilters,
      type,
    },
    {
      placeholderData: {
        data: initialItems,
        pageCount: initialPageCount,
        totalCount: initialTotalCount,
      },
    },
  );

  const deleteItem = api.usesAdmin.deleteItem.useMutation();

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setDeletingId(id);
        try {
          await deleteItem.mutateAsync({ id });
          await utils.usesAdmin.getMine.invalidate();
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

  const columns = useMemo<ColumnDef<AppTableFeatures, UsesItemRow>[]>(
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
        accessorFn: (row) => Object.values(row.translations)[0]?.title ?? "",
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
        accessorKey: "href",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columns.href")} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground max-w-55 truncate text-xs">
            {row.original.href}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const id = row.original.id;
          const isDeleting = deletingId === id && isPending;
          return (
            <div className="flex items-center justify-end gap-1">
              <Link
                href={`/admin/uses/${id}/edit`}
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
    [t, deletingId, isPending, handleDelete],
  );

  const { table } = useDataTable({
    data: items ?? [],
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
        <Link
          href={`/admin/uses/new?type=${type}`}
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="mr-1 size-4" />
          {t("addNew")}
        </Link>
      </div>
      <DataTableFetchingIndicator isFetching={isFetching} />
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
};
