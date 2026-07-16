"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, Pencil, Trash2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableFetchingIndicator } from "@/components/shared/data-table/data-table-fetching-indicator";
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

type SkillRow = RouterOutputs["skillsAdmin"]["getMine"]["data"][number];

interface SkillsListProps {
  initialSkills: SkillRow[];
  pageCount: number;
  totalCount: number;
}

export const SkillsList: FC<SkillsListProps> = ({
  initialSkills,
  pageCount: initialPageCount,
  totalCount: initialTotalCount,
}) => {
  const t = useTranslations("admin.skills");
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const [sort] = useQueryState("sort", getSortingStateParser<SkillRow>());

  const [titleFilter] = useQueryState("title");
  const [typeFilter] = useQueryState(
    "type",
    parseAsArrayOf(parseAsString, ","),
  );
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

  const typedSkills = skills;

  const uniqueTypes = useMemo(
    () => Array.from(new Set(skills.map((s) => s.type))),
    [skills],
  );

  const columns = useMemo<ColumnDef<SkillRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all"
            className="translate-y-0.5"
            checked={table.getIsAllPageRowsSelected()}
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
      },
      {
        id: "type",
        accessorKey: "type",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnType")} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs tracking-wide uppercase">
            {row.original.type}
          </span>
        ),
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
    [deletingId, handleDelete, isPending, t, uniqueTypes],
  );

  const { table } = useDataTable({
    data: typedSkills,
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

  return (
    <div className="relative flex h-full flex-col">
      <DataTableFetchingIndicator isFetching={isFetching} />
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <Link
            id="skills-add"
            href="/admin/skills/new"
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
