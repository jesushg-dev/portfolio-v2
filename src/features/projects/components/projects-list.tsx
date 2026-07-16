"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import type { Locale } from "@/i18n/config";
import type { AppLanguage } from "@prisma/client";
import { getTitleDescriptionForLocale } from "@/lib/i18n/localized-display";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableFetchingIndicator } from "@/components/shared/data-table/data-table-fetching-indicator";
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants, Button } from "@/components/ui/button";
import { useQueryState, parseAsInteger } from "nuqs";
import { getSortingStateParser } from "@/lib/parsers";
import type { FilterItemSchema } from "@/lib/parsers";

type ProjectRow = RouterOutputs["projectsAdmin"]["getMine"]["data"][number];

interface SkillRow {
  id: string;
  title: string;
  image?: string | null;
}

interface ProjectsListProps {
  initialProjects: ProjectRow[];
  languages: AppLanguage[];
  locale: Locale;
  pageCount: number;
  totalCount: number;
}

export const ProjectsList: FC<ProjectsListProps> = ({
  initialProjects,
  languages,
  locale,
  pageCount: initialPageCount,
  totalCount: initialTotalCount,
}) => {
  const t = useTranslations("admin.projects");
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const [sort] = useQueryState("sort", getSortingStateParser<ProjectRow>());

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
    data: { data: projects, totalCount: trpcTotalCount } = {
      data: initialProjects,
      totalCount: initialTotalCount,
    },
    isFetching,
  } = api.projectsAdmin.getMine.useQuery(
    { page, perPage, sort: sort ?? [], filters: parsedFilters },
    {
      placeholderData: {
        data: initialProjects,
        pageCount: initialPageCount,
        totalCount: initialTotalCount,
      },
    },
  );

  const { data: { data: rawSkills = [] } = {} } =
    api.skillsAdmin.getMine.useQuery({});

  const deleteProject = api.projectsAdmin.deleteItem.useMutation();
  const [isPending, startTransition] = useTransition();

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setDeletingId(id);
        try {
          await deleteProject.mutateAsync({ id });
          toast.success(t("deleteSuccess") || "Deleted successfully");
          await utils.projectsAdmin.getMine.invalidate();
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
        enableSorting: false,
        accessorFn: (row) =>
          getTitleDescriptionForLocale(
            row.translations,
            languages,
            locale,
            "title",
          ),
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
            getTitleDescriptionForLocale(
              row.original.translations,
              languages,
              locale,
              "title",
            ) || t("untitled");
          const description =
            getTitleDescriptionForLocale(
              row.original.translations,
              languages,
              locale,
              "description",
            ) || t("noTranslation");
          return (
            <div className="space-y-0.5">
              <p className="text-foreground font-medium">{title}</p>
              <p className="text-muted-foreground line-clamp-2 text-xs">
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
          <span className="text-muted-foreground text-xs tracking-wide uppercase">
            {row.original.type ?? "-"}
          </span>
        ),
      },
      {
        id: "skills",
        enableSorting: false,
        enableColumnFilter: false,
        accessorFn: (row) =>
          row.skillIds
            .map((skillId) => skillsById.get(skillId)?.title ?? "")
            .filter(Boolean)
            .join(", ") ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnSkills")} />
        ),
        cell: ({ row }) => {
          const skillTitles =
            row.original.skillIds
              .map((skillId) => skillsById.get(skillId)?.title ?? "")
              .filter(Boolean) ?? [];

          return (
            <p className="text-muted-foreground line-clamp-2 text-xs">
              {skillTitles.length > 0 ? skillTitles.join(", ") : "-"}
            </p>
          );
        },
      },
      {
        id: "actions",
        size: 100,
        header: t("columnActions"),
        cell: ({ row }) => {
          const project = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/projects/${project.id}/edit`}
                className="bg-muted text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap"
              >
                <Pencil className="h-3 w-3" /> {t("edit")}
              </Link>

              <Button
                disabled={isPending || deletingId === project.id}
                variant="ghost"
                size="icon"
                type="button"
                aria-label={t("delete")}
                onClick={() => handleDelete(project.id)}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded"
              >
                {deletingId === project.id ? (
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
    [deletingId, handleDelete, isPending, languages, locale, skillsById, t],
  );

  const { table } = useDataTable({
    data: projects,
    columns,
    rowCount: trpcTotalCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    initialState: {
      sorting: [{ id: "type", desc: false }],
    },
    shallow: true,
  });

  return (
    <div className="relative flex h-full flex-col">
      <DataTableFetchingIndicator isFetching={isFetching} />
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <Link
            id="projects-add"
            href="/admin/projects/new"
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
