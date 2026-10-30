"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api, type RouterOutputs } from "@/trpc/react";
import { toast } from "sonner";
import type { Locale } from "@/i18n/config";
import type { AppLanguage } from "@prisma/client";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
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
import { cn } from "@/lib/utils";

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

const STACK_TYPE_STYLES: Record<string, string> = {
  FRONTEND: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  BACKEND: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  FULLSTACK: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  MOBILE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  DESKTOP: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
};

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
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsArrayOf(parseAsString),
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
    if (typeFilter && typeFilter.length > 0) {
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
  const deleteMany = api.projectsAdmin.deleteMany.useMutation();
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

  const columns = useMemo<ColumnDef<AppTableFeatures, ProjectRow>[]>(() => {
    const field = createLocalizedFieldResolver(languages, locale);
    return [
      {
        id: "select",
        header: ({ table: tInstance }) => (
          <Checkbox
            checked={
              tInstance.getIsAllPageRowsSelected() ||
              (tInstance.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              tInstance.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "title",
        enableSorting: false,
        accessorFn: (row) => field(row.translations, "title"),
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
          const tProject = field.for(row.original.translations);
          const title = tProject("title") || t("untitled");
          const description = tProject("description") || t("noTranslation");
          return (
            <div className="flex items-center gap-3">
              {row.original.image ? (
                <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={row.original.image}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              ) : null}
              <div className="min-w-0 space-y-0.5">
                <p className="text-foreground truncate font-medium">{title}</p>
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {description}
                </p>
              </div>
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
        cell: ({ row }) => {
          const type = row.original.type;
          if (!type) {
            return (
              <span className="text-muted-foreground text-xs tracking-wide uppercase">
                -
              </span>
            );
          }
          const style =
            STACK_TYPE_STYLES[type] ??
            "bg-muted text-muted-foreground border-border";
          return (
            <span
              className={cn(
                "rounded border px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide uppercase",
                style,
              )}
            >
              {type}
            </span>
          );
        },
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
          const projectSkills = row.original.skillIds
            .map((skillId) => skillsById.get(skillId))
            .filter((s): s is SkillRow => Boolean(s));

          if (projectSkills.length === 0) {
            return <span className="text-muted-foreground text-xs">-</span>;
          }

          return (
            <div className="flex max-w-xs flex-wrap items-center gap-1.5">
              {projectSkills.slice(0, 4).map((skill) => (
                <span
                  key={skill.id}
                  className="bg-muted text-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.6875rem]"
                  title={skill.title}
                >
                  <SkillIcon
                    image={skill.image}
                    title={skill.title}
                    size="sm"
                    className="size-3.5"
                  />
                  <span>{skill.title}</span>
                </span>
              ))}
              {projectSkills.length > 4 ? (
                <span className="text-muted-foreground text-[0.625rem] font-semibold">
                  +{projectSkills.length - 4}
                </span>
              ) : null}
            </div>
          );
        },
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
                <Pencil className="size-3" /> {t("edit")}
              </Link>

              <Button
                disabled={isPending || deletingId === project.id}
                variant="ghost"
                size="icon"
                type="button"
                aria-label={t("delete")}
                onClick={() => handleDelete(project.id)}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-8 rounded"
              >
                {deletingId === project.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </div>
          );
        },
      },
    ];
  }, [deletingId, handleDelete, isPending, languages, locale, skillsById, t]);

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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: trpcTotalCount };
    for (const p of projects) {
      if (p.type) {
        counts[p.type] = (counts[p.type] ?? 0) + 1;
      }
    }
    return counts;
  }, [projects, trpcTotalCount]);

  const categories = useMemo(() => {
    return [
      {
        value: "all",
        id: "all",
        label: t("categories.all") || "All",
        count: trpcTotalCount,
      },
      {
        value: "FRONTEND",
        id: "FRONTEND",
        label: "Frontend",
        count: categoryCounts.FRONTEND ?? 0,
      },
      {
        value: "FULLSTACK",
        id: "FULLSTACK",
        label: "Fullstack",
        count: categoryCounts.FULLSTACK ?? 0,
      },
      {
        value: "BACKEND",
        id: "BACKEND",
        label: "Backend",
        count: categoryCounts.BACKEND ?? 0,
      },
      {
        value: "MOBILE",
        id: "MOBILE",
        label: "Mobile",
        count: categoryCounts.MOBILE ?? 0,
      },
    ];
  }, [categoryCounts, t, trpcTotalCount]);

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  const handleBulkDelete = useCallback(() => {
    const ids = table
      .getFilteredSelectedRowModel()
      .rows.map((r) => r.original.id);
    if (ids.length === 0) return;
    startTransition(async () => {
      try {
        await deleteMany.mutateAsync({ ids });
        toast.success(
          t("bulk.deleteSuccess", { count: ids.length }) ||
            `${ids.length} projects deleted`,
        );
        table.resetRowSelection();
        await utils.projectsAdmin.getMine.invalidate();
      } catch {
        toast.error(
          t("bulk.deleteError") || "Failed to delete selected projects",
        );
      }
    });
  }, [deleteMany, t, table, utils]);

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

  const activeCategory = typeFilter?.[0] ?? "all";

  return (
    <div className="relative flex h-full flex-col gap-3">
      <DataTableFetchingIndicator isFetching={isFetching} />

      <div className="flex flex-col gap-2">
        <DataTableToolbar table={table}>
          <div className="flex flex-wrap items-center gap-2">
            <ExportSeedJsonButton entity="projects" />
            <Link
              id="projects-add"
              href="/admin/projects/new"
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
            value={activeCategory}
            onChange={(val) => {
              void setTypeFilter(val === "all" ? null : [val]);
            }}
          />
        </div>
      </div>

      <DataTable table={table} bulkBar={bulkBar} />
    </div>
  );
};
