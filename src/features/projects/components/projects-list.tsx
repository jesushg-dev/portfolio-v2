"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants } from "@/components/ui/button";

type ProjectRow = RouterOutputs["portfolioAdmin"]["getMyProjects"][number];

interface SkillRow {
  id: string;
  title: string;
  image?: string | null;
}

interface ProjectsListProps {
  initialProjects: ProjectRow[];
}

export const ProjectsList: FC<ProjectsListProps> = ({ initialProjects }) => {
  const t = useTranslations("admin.projects");
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: projects = initialProjects } =
    api.portfolioAdmin.getMyProjects.useQuery(undefined, {
      initialData: initialProjects,
    });

  const { data: rawSkills = [] } = api.portfolioAdmin.getMySkills.useQuery();

  const deleteProject = api.portfolioAdmin.deleteProject.useMutation();
  const [, startTransition] = useTransition();

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setDeletingId(id);
        try {
          await deleteProject.mutateAsync({ id });
          toast.success(t("deleteSuccess") || "Deleted successfully");
          await utils.portfolioAdmin.getMyProjects.invalidate();
        } catch {
          toast.error(t("deleteError"));
        } finally {
          setDeletingId(null);
        }
      });
    },
    [deleteProject, t, utils],
  );

  const skillsById = useMemo(() => {
    const map = new Map<string, SkillRow>();
    for (const skill of rawSkills as SkillRow[]) {
      map.set(skill.id, skill);
    }
    return map;
  }, [rawSkills]);

  const columns = useMemo<ColumnDef<ProjectRow>[]>(
    () => [
      {
        id: "title",
        accessorFn: (row) => row.ProjectTranslation?.[0]?.title ?? "",
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
          const title =
            row.original.ProjectTranslation?.[0]?.title ?? t("untitled");
          const description =
            row.original.ProjectTranslation?.[0]?.description ??
            t("noTranslation");
          return (
            <div className="space-y-0.5">
              <p className="font-medium text-gray-900">{title}</p>
              <p className="line-clamp-2 text-xs text-gray-500">
                {description}
              </p>
            </div>
          );
        },
      },
      {
        id: "type",
        accessorFn: (row) => row.type ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnType")} />
        ),
        cell: ({ row }) => (
          <span className="text-xs tracking-wide text-gray-500 uppercase">
            {row.original.type ?? "-"}
          </span>
        ),
      },
      {
        id: "skills",
        accessorFn: (row) =>
          row.ProjectSkill?.map((ps) => skillsById.get(ps.skillId)?.title ?? "")
            .filter(Boolean)
            .join(", ") ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnSkills")} />
        ),
        cell: ({ row }) => {
          const skillTitles =
            row.original.ProjectSkill?.map(
              (ps) => skillsById.get(ps.skillId)?.title ?? "",
            ).filter(Boolean) ?? [];

          return (
            <p className="line-clamp-2 text-xs text-gray-500">
              {skillTitles.length > 0 ? skillTitles.join(", ") : "-"}
            </p>
          );
        },
      },
      {
        id: "actions",
        header: t("columnActions"),
        cell: ({ row }) => {
          const project = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/projects/${project.id}/edit`}
                className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                <Pencil className="mr-1 inline-block h-3 w-3" />{" "}
                {t("edit")}
              </Link>
              {deletingId === project.id ? (
                <span className="text-xs text-red-500">
                  {t("deleting")}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDelete(project.id)}
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
    [deletingId, handleDelete, skillsById, t],
  );

  const { table } = useDataTable({
    data: projects,
    columns,
    pageCount: 1,
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
    initialState: {
      sorting: [{ id: "title" as Extract<keyof ProjectRow, string>, desc: false }],
    },
    shallow: true,
  });

  return (
    <div className="relative flex h-full min-h-[500px] flex-col">
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <Link href="/admin/projects/new" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addNew")}
          </Link>
        </DataTableToolbar>
      </DataTable>
    </div>
  );
};
