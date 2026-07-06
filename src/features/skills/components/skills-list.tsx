"use client";

import { useCallback, useMemo, useState, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import type { RouterOutputs } from "@/trpc/react";

type SkillRow = RouterOutputs["portfolioAdmin"]["getMySkills"][number];

interface SkillsListProps {
  initialSkills: SkillRow[];
}

export const SkillsList: FC<SkillsListProps> = ({ initialSkills }) => {
  const t = useTranslations("admin.skills");
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: skills = initialSkills } =
    api.portfolioAdmin.getMySkills.useQuery(undefined, {
      initialData: initialSkills,
    });

  const deleteSkill = api.portfolioAdmin.deleteSkill.useMutation({
    onSuccess: () => {
      toast.success("Deleted successfully");
      void utils.portfolioAdmin.getMySkills.invalidate();
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
      deleteSkill.mutate({ id });
    },
    [deleteSkill],
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
          <span className="text-xs tracking-wide text-gray-500 uppercase">
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
        header: t("columnActions"),
        cell: ({ row }) => {
          const skill = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/skills/${skill.id}/edit`}
                className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                aria-label={t("edit")}
              >
                <Pencil className="h-3 w-3" />
              </Link>
              {deletingId === skill.id ? (
                <span className="text-xs text-red-500">{t("deleting")}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDelete(skill.id)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={t("delete")}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [deletingId, handleDelete, t, uniqueTypes],
  );

  const { table } = useDataTable({
    data: typedSkills,
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
          <Link href="/admin/skills/new" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addNew")}
          </Link>
        </DataTableToolbar>
      </DataTable>
    </div>
  );
};
