"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import { Plus, Pencil, Trash2, Loader2, Globe, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { useQueryState, parseAsInteger } from "nuqs";

import { api, type RouterOutputs } from "@/trpc/react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableFetchingIndicator } from "@/components/shared/data-table/data-table-fetching-indicator";
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants, Button } from "@/components/ui/button";
import { getSortingStateParser } from "@/lib/parsers";
import type { FilterItemSchema } from "@/lib/parsers";

type CompanyRow =
  RouterOutputs["jobTrackerAdmin"]["getCompanies"]["data"][number];

interface CompaniesListProps {
  initialCompanies: CompanyRow[];
  pageCount: number;
  totalCount: number;
}

export const CompaniesList: FC<CompaniesListProps> = ({
  initialCompanies,
  pageCount: initialPageCount,
  totalCount: initialTotalCount,
}) => {
  const t = useTranslations("admin.jobTracker");
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [page] = useQueryState("companiesPage", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState(
    "companiesPerPage",
    parseAsInteger.withDefault(10),
  );
  const [sort] = useQueryState(
    "companiesSort",
    getSortingStateParser<CompanyRow>(),
  );

  const [nameFilter] = useQueryState("name");
  const [emailFilter] = useQueryState("email");

  const parsedFilters = useMemo((): FilterItemSchema[] => {
    const f: FilterItemSchema[] = [];
    if (nameFilter) {
      f.push({
        id: "name",
        value: nameFilter,
        variant: "text",
        operator: "iLike",
        filterId: "name",
      });
    }
    if (emailFilter) {
      f.push({
        id: "email",
        value: emailFilter,
        variant: "text",
        operator: "iLike",
        filterId: "email",
      });
    }
    return f;
  }, [nameFilter, emailFilter]);

  const {
    data: { data: companies, totalCount: trpcTotalCount } = {
      data: initialCompanies,
      totalCount: initialTotalCount,
    },
    isFetching,
  } = api.jobTrackerAdmin.getCompanies.useQuery(
    { page, perPage, sort: sort ?? [], filters: parsedFilters },
    {
      placeholderData: {
        data: initialCompanies,
        pageCount: initialPageCount,
        totalCount: initialTotalCount,
      },
    },
  );

  const deleteCompany = api.jobTrackerAdmin.deleteCompany.useMutation();

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setDeletingId(id);
        try {
          await deleteCompany.mutateAsync({ id });
          toast.success(t("deleteCompanySuccess"));
          await utils.jobTrackerAdmin.getCompanies.invalidate();
          await utils.jobTrackerAdmin.getDashboardStats.invalidate();
        } catch {
          toast.error(t("deleteCompanyError"));
        } finally {
          setDeletingId(null);
        }
      });
    },
    [deleteCompany, t, utils],
  );

  const columns = useMemo<ColumnDef<AppTableFeatures, CompanyRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnName")} />
        ),
        meta: {
          label: t("columnName"),
          placeholder: t("filterNamePlaceholder"),
          variant: "text",
        },
        enableColumnFilter: true,
        cell: ({ row }) => (
          <p className="text-foreground font-medium">{row.original.name}</p>
        ),
      },
      {
        id: "email",
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnEmail")} />
        ),
        meta: {
          label: t("columnEmail"),
          placeholder: t("filterEmailPlaceholder"),
          variant: "text",
        },
        enableColumnFilter: true,
        cell: ({ row }) =>
          row.original.email ? (
            <div className="text-muted-foreground flex items-center gap-1 text-sm">
              <Mail className="h-3 w-3" />
              {row.original.email}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          ),
      },
      {
        id: "website",
        accessorKey: "website",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnWebsite")} />
        ),
        cell: ({ row }) =>
          row.original.website ? (
            <a
              href={row.original.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary flex items-center gap-1 text-sm hover:underline"
            >
              <Globe className="h-3 w-3" />
              {t("websiteLink")}
            </a>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          ),
      },
      {
        id: "actions",
        size: 120,
        header: t("columnActions"),
        cell: ({ row }) => {
          const company = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={{
                  pathname: "/admin/job-tracker/companies/[id]/edit",
                  params: { id: company.id },
                }}
                className="bg-muted text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap"
              >
                <Pencil className="h-3 w-3" /> {t("edit")}
              </Link>
              <Button
                disabled={isPending || deletingId === company.id}
                variant="ghost"
                size="icon"
                type="button"
                aria-label={t("delete")}
                onClick={() => handleDelete(company.id)}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded"
              >
                {deletingId === company.id ? (
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
    [deletingId, handleDelete, isPending, t],
  );

  const { table } = useDataTable({
    data: companies,
    columns,
    rowCount: trpcTotalCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    queryKeys: {
      page: "companiesPage",
      perPage: "companiesPerPage",
      sort: "companiesSort",
      filters: "companiesFilters",
      joinOperator: "companiesJoinOperator",
    },
    initialState: {
      sorting: [{ id: "name", desc: false }],
    },
    shallow: true,
  });

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-auto">
      <DataTableFetchingIndicator isFetching={isFetching} />
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <Link
            id="companies-add"
            href="/admin/job-tracker/companies/new"
            className={buttonVariants({ variant: "outline" })}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("newCompany")}
          </Link>
        </DataTableToolbar>
      </DataTable>
    </div>
  );
};
