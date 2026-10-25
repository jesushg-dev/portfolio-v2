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
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { ExportSeedJsonButton } from "@/components/admin/shared/export-seed-json-button";
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants, Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useQueryState, parseAsInteger } from "nuqs";
import { getSortingStateParser } from "@/lib/parsers";
import type { FilterItemSchema } from "@/lib/parsers";
import { cn } from "@/lib/utils";

type ServiceRow = RouterOutputs["servicesAdmin"]["getMine"]["data"][number];

interface SkillRow {
  id: string;
  title: string;
}

interface ServicesListProps {
  initialServices: ServiceRow[];
  languages: AppLanguage[];
  locale: Locale;
  pageCount: number;
  totalCount: number;
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

export const ServicesList: FC<ServicesListProps> = ({
  initialServices,
  languages,
  locale,
  pageCount: initialPageCount,
  totalCount: initialTotalCount,
}) => {
  const t = useTranslations("admin.services");
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const [sort] = useQueryState("sort", getSortingStateParser<ServiceRow>());

  const [titleFilter] = useQueryState("title");
  const [typeFilter, setTypeFilter] = useQueryState("type");

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
    if (typeFilter) {
      f.push({
        id: "type",
        value: typeFilter,
        variant: "text",
        operator: "iLike",
        filterId: "type",
      });
    }
    return f;
  }, [titleFilter, typeFilter]);

  const {
    data: { data: services, totalCount: trpcTotalCount } = {
      data: initialServices,
      totalCount: initialTotalCount,
    },
    isFetching,
  } = api.servicesAdmin.getMine.useQuery(
    { page, perPage, sort: sort ?? [], filters: parsedFilters },
    {
      placeholderData: {
        data: initialServices,
        pageCount: initialPageCount,
        totalCount: initialTotalCount,
      },
    },
  );

  const { data: { data: rawSkills = [] } = {} } =
    api.skillsAdmin.getMine.useQuery({});

  const deleteService = api.servicesAdmin.deleteItem.useMutation();
  const deleteManyServices = api.servicesAdmin.deleteMany.useMutation();

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setDeletingId(id);
        try {
          await deleteService.mutateAsync({ id });
          toast.success(t("deleteSuccess") || "Deleted successfully");
          await utils.servicesAdmin.getMine.invalidate();
        } catch {
          toast.error(t("deleteError"));
        } finally {
          setDeletingId(null);
        }
      });
    },
    [deleteService, t, utils],
  );

  const skillsById = useMemo(() => {
    const map = new Map<string, SkillRow>();
    for (const skill of rawSkills as SkillRow[]) {
      map.set(skill.id, skill);
    }
    return map;
  }, [rawSkills]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(services.map((s) => s.type))).filter(Boolean);
  }, [services]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: trpcTotalCount };
    for (const s of services) {
      if (s.type) {
        counts[s.type] = (counts[s.type] ?? 0) + 1;
      }
    }
    return counts;
  }, [services, trpcTotalCount]);

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
  }, [typeCounts, t, uniqueTypes]);

  const activeCategory = useMemo(() => {
    return typeFilter ?? "all";
  }, [typeFilter]);

  const handleCategoryChange = useCallback(
    (val: string) => {
      if (val === "all") {
        void setTypeFilter(null);
      } else {
        void setTypeFilter(val);
      }
    },
    [setTypeFilter],
  );

  const columns = useMemo<ColumnDef<AppTableFeatures, ServiceRow>[]>(() => {
    const field = createLocalizedFieldResolver(languages, locale);
    return [
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
        accessorFn: (row) => field(row.translations, "title"),
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
          const service = row.original;
          const tService = field.for(service.translations);
          const title = tService("title") || t("untitled");
          const description = tService("description") || t("noTranslation");

          return (
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary border-primary/20 flex size-9 shrink-0 items-center justify-center rounded-lg border">
                <DynamicIcon name={service.icon} className="size-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <p className="text-foreground text-sm leading-tight font-semibold">
                    {title}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-1.5 py-0.5 text-[0.625rem] font-medium",
                      service.isActive
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                        : "bg-muted text-muted-foreground border-border border",
                    )}
                  >
                    {service.isActive ? t("active") : t("inactive")}
                  </span>
                </div>
                <p className="text-muted-foreground line-clamp-1 text-xs">
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
        meta: {
          label: t("columnType"),
          placeholder: "Search type...",
          variant: "text",
        },
        enableColumnFilter: true,
        cell: ({ row }) => {
          const type = row.original.type;
          if (!type)
            return <span className="text-muted-foreground text-xs">-</span>;
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
          const service = row.original;
          const translationsRecord = service.translations as
            | Record<string, { title?: string; description?: string }>
            | {
                appLanguageId: string;
                title?: string;
                description?: string;
              }[]
            | undefined;

          const statuses = languages.map((lang) => {
            let tr: { title?: string; description?: string } | undefined;
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
        id: "skills",
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
          const service = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/services/${service.id}/edit`}
                className="bg-muted text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap"
              >
                <Pencil className="h-3 w-3" /> {t("edit")}
              </Link>

              <Button
                disabled={isPending || deletingId === service.id}
                variant="ghost"
                size="icon"
                type="button"
                aria-label={t("delete")}
                onClick={() => handleDelete(service.id)}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded"
              >
                {deletingId === service.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          );
        },
      },
    ];
  }, [deletingId, handleDelete, isPending, languages, locale, skillsById, t]);

  const { table } = useDataTable({
    data: services,
    columns,
    rowCount: trpcTotalCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    initialState: {
      sorting: [{ id: "type", desc: true }],
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
        await deleteManyServices.mutateAsync({ ids });
        toast.success(t("bulk.deleteSuccess", { count: ids.length }));
        table.resetRowSelection();
        await utils.servicesAdmin.getMine.invalidate();
      } catch {
        toast.error(t("bulk.deleteError"));
      } finally {
        setIsBulkDeleting(false);
      }
    });
  }, [deleteManyServices, t, table, utils]);

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
            <ExportSeedJsonButton entity="services" />
            <Link href="/admin/services/new" className={buttonVariants()}>
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
