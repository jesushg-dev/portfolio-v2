"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import { Loader2, Plus, Pencil, Trash2, Settings2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { Locale } from "@/i18n/config";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableFetchingIndicator } from "@/components/shared/data-table/data-table-fetching-indicator";
import { DataTableBulkBar } from "@/components/shared/data-table/data-table-bulk-bar";
import {
  LanguageStatusBadge,
  computeTranslationStatus,
} from "@/components/shared/data-table/language-status-badge";
import { ExportSeedJsonButton } from "@/components/admin/shared/export-seed-json-button";
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants, Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { getSoftSkillTranslationText } from "@/features/soft-skills/lib/soft-skill-editor-dto";
import type { RouterOutputs } from "@/trpc/react";
import type { AppLanguage } from "@prisma/client";
import { useQueryState, parseAsInteger } from "nuqs";
import { getSortingStateParser } from "@/lib/parsers";
import type { FilterItemSchema } from "@/lib/parsers";

type SoftSkillRow = RouterOutputs["softSkillsAdmin"]["getMine"]["data"][number];

interface SoftSkillsListProps {
  initialItems: SoftSkillRow[];
  languages: AppLanguage[];
  locale: Locale;
  pageCount: number;
  totalCount: number;
}

export const SoftSkillsList: FC<SoftSkillsListProps> = ({
  initialItems,
  languages,
  locale,
  pageCount: initialPageCount,
  totalCount: initialTotalCount,
}) => {
  const t = useTranslations("admin.softSkills");

  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const [sort] = useQueryState("sort", getSortingStateParser<SoftSkillRow>());
  const [titleFilter] = useQueryState("title");

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
    return f;
  }, [titleFilter]);

  const {
    data: { data: items, totalCount: trpcTotalCount } = {
      data: initialItems,
      totalCount: initialTotalCount,
    },
    isFetching,
  } = api.softSkillsAdmin.getMine.useQuery(
    { page, perPage, sort: sort ?? [], filters: parsedFilters },
    {
      placeholderData: {
        data: initialItems,
        pageCount: initialPageCount,
        totalCount: initialTotalCount,
      },
    },
  );

  const deleteItem = api.softSkillsAdmin.deleteItem.useMutation();
  const deleteManyItems = api.softSkillsAdmin.deleteMany.useMutation();

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setDeletingId(id);
        try {
          await deleteItem.mutateAsync({ id });
          toast.success(t("deleteSuccess"));
          await utils.softSkillsAdmin.getMine.invalidate();
        } catch {
          toast.error(t("deleteError"));
        } finally {
          setDeletingId(null);
        }
      });
    },
    [deleteItem, t, utils],
  );

  const columns = useMemo<ColumnDef<AppTableFeatures, SoftSkillRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all"
            className="translate-y-0.5"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label="Select row"
            className="translate-y-0.5"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
        enableHiding: false,
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: "icon",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnIcon")} />
        ),
        cell: ({ row }) => (
          <div className="border-border bg-muted/40 flex size-9 items-center justify-center rounded-lg border">
            <DynamicIcon
              name={row.original.icon}
              className="text-primary size-4"
            />
          </div>
        ),
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
          const titleText = getSoftSkillTranslationText(
            row.original,
            languages,
            locale,
            "title",
          );
          const descriptionText = getSoftSkillTranslationText(
            row.original,
            languages,
            locale,
            "description",
          );

          return (
            <div className="space-y-0.5">
              <p className="text-foreground text-sm leading-tight font-semibold">
                {titleText || t("untitled")}
              </p>
              {descriptionText ? (
                <p className="text-muted-foreground line-clamp-1 text-xs">
                  {descriptionText}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "languages",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t("columnLanguages") || "Languages"}
          />
        ),
        cell: ({ row }) => {
          const softSkill = row.original;
          const statuses = languages.map((lang) => {
            const tr = softSkill.translations?.[lang.id];
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
        accessorKey: "isVisible",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnVisible")} />
        ),
        cell: ({ row }) =>
          row.original.isVisible ? (
            <Badge variant="secondary">{t("visible")}</Badge>
          ) : (
            <Badge variant="outline">{t("hidden")}</Badge>
          ),
      },
      {
        accessorKey: "order",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnOrder")} />
        ),
      },
      {
        id: "actions",
        size: 100,
        header: t("columnActions"),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/soft-skills/${item.id}/edit`}
                className="bg-muted text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap"
              >
                <Pencil className="h-3 w-3" /> {t("edit")}
              </Link>

              <Button
                disabled={isPending || deletingId === item.id}
                variant="ghost"
                size="icon"
                type="button"
                aria-label={t("delete")}
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
    [deletingId, handleDelete, isPending, languages, locale, t],
  );

  const { table } = useDataTable({
    data: items,
    columns,
    rowCount: trpcTotalCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    initialState: {
      sorting: [{ id: "order", desc: false }],
    },
    shallow: true,
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  const handleBulkDelete = useCallback(() => {
    const ids = table
      .getFilteredSelectedRowModel()
      .rows.map((r) => r.original.id);
    if (ids.length === 0) return;

    const confirmMsg = t("bulk.deleteConfirm", { count: ids.length });
    if (!window.confirm(confirmMsg)) return;

    startTransition(async () => {
      setIsBulkDeleting(true);
      try {
        await deleteManyItems.mutateAsync({ ids });
        toast.success(t("bulk.deleteSuccess", { count: ids.length }));
        table.resetRowSelection();
        await utils.softSkillsAdmin.getMine.invalidate();
      } catch {
        toast.error(t("bulk.deleteError"));
      } finally {
        setIsBulkDeleting(false);
      }
    });
  }, [deleteManyItems, t, table, utils]);

  return (
    <div className="relative flex h-full flex-col">
      <DataTableFetchingIndicator isFetching={isFetching} />
      <DataTable
        table={table}
        bulkBar={
          <DataTableBulkBar
            selectedCount={selectedCount}
            onClearSelection={() => table.resetRowSelection()}
            onDeleteSelected={handleBulkDelete}
            isDeleting={isBulkDeleting}
            clearLabel={t("bulk.clear")}
            deleteLabel={t("bulk.delete")}
            selectedLabel={t("bulk.selected", { count: selectedCount })}
          />
        }
      >
        <DataTableToolbar table={table}>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/soft-skills/settings"
              id="soft-skills-settings"
              className={buttonVariants({ variant: "outline" })}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              {t("sectionSettings")}
            </Link>
            <ExportSeedJsonButton entity="softSkills" />
            <Link
              href="/admin/soft-skills/new"
              id="soft-skills-add"
              className={buttonVariants()}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("addNew")}
            </Link>
          </div>
        </DataTableToolbar>
      </DataTable>
    </div>
  );
};
