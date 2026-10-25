"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import { Loader2, Pencil, Trash2, Plus, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableFetchingIndicator } from "@/components/shared/data-table/data-table-fetching-indicator";
import { DataTableCategoryChips } from "@/components/shared/data-table/data-table-category-chips";
import { DataTableBulkBar } from "@/components/shared/data-table/data-table-bulk-bar";
import {
  LanguageStatusBadge,
  computeTranslationStatus,
} from "@/components/shared/data-table/language-status-badge";
import SkillIcon from "@/features/home/components/skills/skill-icon";
import { ExportSeedJsonButton } from "@/components/admin/shared/export-seed-json-button";
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants, Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useQueryState,
  parseAsInteger,
  parseAsArrayOf,
  parseAsString,
} from "nuqs";
import { getSortingStateParser } from "@/lib/parsers";
import type { FilterItemSchema } from "@/lib/parsers";
import type { RouterOutputs } from "@/trpc/react";
import type { AppLanguage } from "@prisma/client";
import { cn } from "@/lib/utils";

type SkillRow = RouterOutputs["skillsAdmin"]["getMine"]["data"][number];

interface SkillsListProps {
  initialSkills: SkillRow[];
  pageCount: number;
  totalCount: number;
  languages?: AppLanguage[];
}

const STACK_TYPE_STYLES: Record<string, string> = {
  FRONTEND: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  BACKEND: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  DATABASE: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  DEVOPS: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  MOBILE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TOOLS: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  CYBERSECURITY: "bg-red-500/10 text-red-500 border-red-500/20",
  AI: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  ARCHITECTURE: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  DATA: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  SOFTSKILLS: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  QUALITY_DELIVERY: "bg-lime-500/10 text-lime-500 border-lime-500/20",
};

export const SkillsList: FC<SkillsListProps> = ({
  initialSkills,
  pageCount: initialPageCount,
  totalCount: initialTotalCount,
  languages: initialLanguages,
}) => {
  const t = useTranslations("admin.skills");
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const [sort] = useQueryState("sort", getSortingStateParser<SkillRow>());

  const [titleFilter] = useQueryState("title");
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsArrayOf(parseAsString, ","),
  );

  const languagesQuery = api.appLanguagesAdmin?.getAll?.useQuery?.(undefined, {
    initialData: initialLanguages,
  });
  const dbLanguages = languagesQuery?.data ?? [];
  const activeLanguages = initialLanguages ?? dbLanguages;

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
    if (Array.isArray(typeFilter) && typeFilter.length > 0) {
      f.push({
        id: "type",
        value: typeFilter,
        variant: "multiSelect",
        operator: "inArray",
        filterId: "type",
      });
    }
    return f;
  }, [titleFilter, typeFilter]);

  const {
    data: { data: skills, totalCount: trpcTotalCount } = {
      data: initialSkills,
      totalCount: initialTotalCount,
    },
    isFetching,
  } = api.skillsAdmin.getMine.useQuery(
    { page, perPage, sort: sort ?? [], filters: parsedFilters },
    {
      placeholderData: {
        data: initialSkills,
        pageCount: initialPageCount,
        totalCount: initialTotalCount,
      },
    },
  );

  const deleteSkill = api.skillsAdmin.deleteItem.useMutation();
  const deleteManySkills = api.skillsAdmin.deleteMany.useMutation();
  const [isPending, startTransition] = useTransition();

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setDeletingId(id);
        try {
          await deleteSkill.mutateAsync({ id });
          toast.success(t("deleteSuccess") || "Deleted successfully");
          await utils.skillsAdmin.getMine.invalidate();
        } catch {
          toast.error(t("deleteError"));
        } finally {
          setDeletingId(null);
        }
      });
    },
    [deleteSkill, t, utils],
  );

  const uniqueTypes = useMemo(
    () => Array.from(new Set(skills.map((s) => s.type))).filter(Boolean),
    [skills],
  );

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: trpcTotalCount };
    for (const skill of skills) {
      if (skill.type) {
        counts[skill.type] = (counts[skill.type] ?? 0) + 1;
      }
    }
    return counts;
  }, [skills, trpcTotalCount]);

  const categories = useMemo(() => {
    const items = [
      {
        value: "all",
        label: t("categories.all") || "All",
        count: typeCounts.all,
      },
    ];
    for (const type of uniqueTypes) {
      items.push({
        value: type,
        label: type,
        count: typeCounts[type] ?? 0,
      });
    }
    return items;
  }, [t, typeCounts, uniqueTypes]);

  const activeCategory = useMemo(() => {
    if (!typeFilter || typeFilter.length === 0) return "all";
    return typeFilter[0] ?? "all";
  }, [typeFilter]);

  const handleCategoryChange = useCallback(
    (val: string) => {
      if (val === "all") {
        void setTypeFilter(null);
      } else {
        void setTypeFilter([val]);
      }
    },
    [setTypeFilter],
  );

  const columns = useMemo<ColumnDef<AppTableFeatures, SkillRow>[]>(
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
        id: "title",
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
          const skill = row.original;
          return (
            <div className="flex items-center gap-3">
              <SkillIcon
                image={skill.image}
                title={skill.title}
                tile
                size="sm"
              />
              <div className="flex flex-col">
                <span className="text-foreground text-sm leading-tight font-semibold">
                  {skill.title}
                </span>
                {skill.featured && (
                  <span className="text-primary mt-0.5 inline-flex items-center gap-1 text-[0.6875rem] font-medium">
                    <Sparkles className="size-2.5" />
                    Featured
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "type",
        accessorKey: "type",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnType")} />
        ),
        cell: ({ row }) => {
          const type = row.original.type;
          const badgeStyle =
            STACK_TYPE_STYLES[type] ??
            "bg-muted text-muted-foreground border-border";
          return (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
                badgeStyle,
              )}
            >
              {type}
            </span>
          );
        },
        meta: {
          label: t("columnType"),
          variant: "multiSelect",
          options: uniqueTypes.map((type) => ({
            label: type,
            value: type,
          })),
        },
        enableColumnFilter: true,
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
          const skill = row.original;
          const translationsRecord = skill.translations as
            | Record<string, { description?: string }>
            | {
                appLanguageId: string;
                title?: string;
                description?: string;
              }[]
            | undefined;

          const statuses = activeLanguages.map((lang) => {
            let tr: { description?: string } | undefined;
            if (Array.isArray(translationsRecord)) {
              tr = translationsRecord.find(
                (tItem) => tItem.appLanguageId === lang.id,
              );
            } else if (
              translationsRecord &&
              typeof translationsRecord === "object"
            ) {
              tr = translationsRecord[lang.id];
            }
            const status = computeTranslationStatus(tr, ["description"]);
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
        id: "actions",
        size: 100,
        header: t("columnActions"),
        cell: ({ row }) => {
          const skill = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/skills/${skill.id}/edit`}
                className="bg-muted text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap"
              >
                <Pencil className="h-3 w-3" /> {t("edit")}
              </Link>

              <Button
                disabled={isPending || deletingId === skill.id}
                variant="ghost"
                size="icon"
                type="button"
                aria-label={t("delete")}
                onClick={() => handleDelete(skill.id)}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded"
              >
                {deletingId === skill.id ? (
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
    [activeLanguages, deletingId, handleDelete, isPending, t, uniqueTypes],
  );

  const { table } = useDataTable({
    data: skills,
    columns,
    rowCount: trpcTotalCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    initialState: {
      sorting: [{ id: "title", desc: false }],
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
        await deleteManySkills.mutateAsync({ ids });
        toast.success(t("bulk.deleteSuccess", { count: ids.length }));
        table.resetRowSelection();
        await utils.skillsAdmin.getMine.invalidate();
      } catch {
        toast.error(t("bulk.deleteError"));
      } finally {
        setIsBulkDeleting(false);
      }
    });
  }, [deleteManySkills, t, table, utils]);

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
            <ExportSeedJsonButton entity="skills" />
            <Link
              id="skills-add"
              href="/admin/skills/new"
              className={buttonVariants()}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("addNew")}
            </Link>
          </div>
        </DataTableToolbar>

        <DataTableCategoryChips
          chips={categories}
          value={activeCategory}
          onChange={handleCategoryChange}
        />
      </DataTable>
    </div>
  );
};
