"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Award,
  ExternalLink,
} from "lucide-react";
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
import { ExportSeedJsonButton } from "@/components/admin/shared/export-seed-json-button";
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants, Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useQueryState,
  parseAsInteger,
} from "nuqs";
import { getSortingStateParser } from "@/lib/parsers";
import type { FilterItemSchema } from "@/lib/parsers";
import { cn } from "@/lib/utils";

type CertificationRow =
  RouterOutputs["certificationsAdmin"]["getMine"]["data"][number];

interface SkillRow {
  id: string;
  title: string;
}

interface CertificationsListProps {
  initialCertifications: CertificationRow[];
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

export const CertificationsList: FC<CertificationsListProps> = ({
  initialCertifications,
  languages,
  locale,
  pageCount: initialPageCount,
  totalCount: initialTotalCount,
}) => {
  const t = useTranslations("admin.certifications");
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const [sort] = useQueryState(
    "sort",
    getSortingStateParser<CertificationRow>(),
  );

  const [titleFilter] = useQueryState("title");
  const [companyFilter, setCompanyFilter] = useQueryState("company");

  const parsedFilters = useMemo((): FilterItemSchema[] => {
    const f: FilterItemSchema[] = [];
    if (titleFilter)
      f.push({
        id: "title",
        value: titleFilter,
        variant: "text",
        operator: "iLike",
        filterId: "title",
      });
    if (companyFilter)
      f.push({
        id: "company",
        value: companyFilter,
        variant: "text",
        operator: "iLike",
        filterId: "company",
      });
    return f;
  }, [titleFilter, companyFilter]);

  const {
    data: { data: certifications, totalCount: trpcTotalCount } = {
      data: initialCertifications,
      totalCount: initialTotalCount,
    },
    isFetching,
  } = api.certificationsAdmin.getMine.useQuery(
    { page, perPage, sort: sort ?? [], filters: parsedFilters },
    {
      placeholderData: {
        data: initialCertifications,
        pageCount: initialPageCount,
        totalCount: initialTotalCount,
      },
    },
  );

  const { data: { data: rawSkills = [] } = {} } =
    api.skillsAdmin.getMine.useQuery({});

  const deleteCertification = api.certificationsAdmin.deleteItem.useMutation();
  const deleteManyCertifications =
    api.certificationsAdmin.deleteMany.useMutation();

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setDeletingId(id);
        try {
          await deleteCertification.mutateAsync({ id });
          toast.success(t("deleteSuccess") || "Deleted successfully");
          await utils.certificationsAdmin.getMine.invalidate();
        } catch {
          toast.error(t("deleteError"));
        } finally {
          setDeletingId(null);
        }
      });
    },
    [deleteCertification, t, utils],
  );

  const skillsById = useMemo(() => {
    const map = new Map<string, SkillRow>();
    for (const skill of rawSkills as SkillRow[]) {
      map.set(skill.id, skill);
    }
    return map;
  }, [rawSkills]);

  const uniqueCompanies = useMemo(() => {
    return Array.from(new Set(certifications.map((c) => c.company))).filter(
      Boolean,
    );
  }, [certifications]);

  const companyCounts = useMemo(() => {
    const counts: Record<string, number> = { all: trpcTotalCount };
    for (const cert of certifications) {
      if (cert.company) {
        counts[cert.company] = (counts[cert.company] ?? 0) + 1;
      }
    }
    return counts;
  }, [certifications, trpcTotalCount]);

  const categories = useMemo(() => {
    const items = [
      {
        value: "all",
        label: t("categories.all") || "All",
        count: companyCounts.all,
      },
    ];
    for (const company of uniqueCompanies) {
      items.push({
        value: company,
        label: company,
        count: companyCounts[company] ?? 0,
      });
    }
    return items;
  }, [companyCounts, t, uniqueCompanies]);

  const activeCategory = useMemo(() => {
    return companyFilter ?? "all";
  }, [companyFilter]);

  const handleCategoryChange = useCallback(
    (val: string) => {
      if (val === "all") {
        void setCompanyFilter(null);
      } else {
        void setCompanyFilter(val);
      }
    },
    [setCompanyFilter],
  );

  const columns = useMemo<
    ColumnDef<AppTableFeatures, CertificationRow>[]
  >(() => {
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
        enableColumnFilter: false,
        cell: ({ row }) => {
          const cert = row.original;
          const title = field(cert.translations, "title") || t("untitled");
          return (
            <div className="flex items-center gap-3">
              <div className="bg-muted border-border flex size-9 shrink-0 items-center justify-center rounded-lg border">
                {cert.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cert.image}
                    alt=""
                    className="size-5 object-contain"
                  />
                ) : (
                  <Award className="text-muted-foreground size-4" />
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <p className="text-foreground text-sm leading-tight font-semibold">
                    {title}
                  </p>
                  {cert.url && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="View Credential"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                <span className="text-muted-foreground text-xs">
                  {cert.company}
                  {cert.issuedDate ? ` · ${cert.issuedDate}` : ""}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "company",
        accessorKey: "company",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnCompany")} />
        ),
        meta: {
          label: t("columnCompany"),
          placeholder: "Search company...",
          variant: "text",
        },
        enableColumnFilter: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs font-medium">
            {row.original.company}
          </span>
        ),
      },
      {
        id: "type",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t("columnType") || "Type"}
          />
        ),
        cell: ({ row }) => {
          const types = (row.original.type as string[]) ?? [];
          if (types.length === 0)
            return <span className="text-muted-foreground text-xs">-</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {types.map((type) => {
                const badgeStyle =
                  STACK_TYPE_STYLES[type] ??
                  "bg-muted text-muted-foreground border-border";
                return (
                  <span
                    key={type}
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide",
                      badgeStyle,
                    )}
                  >
                    {type}
                  </span>
                );
              })}
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
          const cert = row.original;
          const translationsRecord = cert.translations as
            | Record<string, { title?: string }>
            | { appLanguageId: string; title?: string }[]
            | undefined;

          const statuses = languages.map((lang) => {
            let tr: { title?: string } | undefined;
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
            const status = computeTranslationStatus(tr, ["title"]);
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
          const cert = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/certifications/${cert.id}/edit`}
                className="bg-muted text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap"
              >
                <Pencil className="h-3 w-3" /> {t("edit")}
              </Link>

              <Button
                disabled={isPending || deletingId === cert.id}
                variant="ghost"
                size="icon"
                type="button"
                aria-label={t("delete")}
                onClick={() => handleDelete(cert.id)}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded"
              >
                {deletingId === cert.id ? (
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
    data: certifications,
    columns,
    rowCount: trpcTotalCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    initialState: {
      sorting: [{ id: "company", desc: false }],
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
        await deleteManyCertifications.mutateAsync({ ids });
        toast.success(t("bulk.deleteSuccess", { count: ids.length }));
        table.resetRowSelection();
        await utils.certificationsAdmin.getMine.invalidate();
      } catch {
        toast.error(t("bulk.deleteError"));
      } finally {
        setIsBulkDeleting(false);
      }
    });
  }, [deleteManyCertifications, t, table, utils]);

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
            <ExportSeedJsonButton entity="certifications" />
            <Link
              id="certifications-add"
              href="/admin/certifications/new"
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
