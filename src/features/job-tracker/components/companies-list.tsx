"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import { Plus, Pencil, Trash2, Globe, Mail } from "lucide-react";
import { FaLinkedin } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { useQueryState, parseAsInteger } from "nuqs";

import { api, type RouterOutputs } from "@/trpc/react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableFetchingIndicator } from "@/components/shared/data-table/data-table-fetching-indicator";
import { DataTableBulkBar } from "@/components/shared/data-table/data-table-bulk-bar";
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants, Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [isPending, startTransition] = useTransition();

  const [pendingDeleteCompany, setPendingDeleteCompany] =
    useState<CompanyRow | null>(null);
  const [cannotDeleteCompany, setCannotDeleteCompany] =
    useState<CompanyRow | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState<
    CompanyRow[] | null
  >(null);

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
  const deleteManyCompanies =
    api.jobTrackerAdmin.deleteManyCompanies.useMutation();

  const handleRequestDelete = useCallback((company: CompanyRow) => {
    if (company.applicationsCount && company.applicationsCount > 0) {
      setCannotDeleteCompany(company);
    } else {
      setPendingDeleteCompany(company);
    }
  }, []);

  const handleConfirmSingleDelete = useCallback(() => {
    if (!pendingDeleteCompany) return;
    const companyId = pendingDeleteCompany.id;
    startTransition(async () => {
      try {
        await deleteCompany.mutateAsync({ id: companyId });
        toast.success(t("deleteCompanySuccess"));
        setPendingDeleteCompany(null);
        await Promise.all([
          utils.jobTrackerAdmin.getCompanies.invalidate(),
          utils.jobTrackerAdmin.getDashboardStats.invalidate(),
        ]);
      } catch {
        toast.error(t("deleteCompanyError"));
      }
    });
  }, [deleteCompany, pendingDeleteCompany, t, utils]);

  const handleRequestBulkDelete = useCallback(
    (selectedRows: CompanyRow[]) => {
      const companiesWithApps = selectedRows.filter(
        (c) => c.applicationsCount && c.applicationsCount > 0,
      );
      if (companiesWithApps.length > 0) {
        const totalApps = companiesWithApps.reduce(
          (acc, c) => acc + (c.applicationsCount ?? 0),
          0,
        );
        toast.error(t("cannotDeleteWithApps", { count: totalApps }));
        return;
      }
      setPendingBulkDelete(selectedRows);
    },
    [t],
  );

  const columns = useMemo<ColumnDef<AppTableFeatures, CompanyRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label={t("columnActions")}
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={row.original.name}
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
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
        cell: ({ row }) => {
          const appCount = row.original.applicationsCount ?? 0;
          return (
            <div>
              <p className="text-foreground font-medium">{row.original.name}</p>
              {appCount > 0 ? (
                <p className="text-muted-foreground text-xs">
                  {appCount}{" "}
                  {appCount === 1
                    ? t("singleApplicationCount")
                    : t("multipleApplicationsCount")}
                </p>
              ) : row.original.location ? (
                <p className="text-muted-foreground text-xs">
                  {row.original.location}
                </p>
              ) : null}
            </div>
          );
        },
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
            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Mail className="size-3.5" />
              {row.original.email}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      },
      {
        id: "website",
        accessorKey: "website",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnWebsite")} />
        ),
        cell: ({ row }) => {
          const hasWebsite = Boolean(row.original.website);
          const hasLinkedin = Boolean(row.original.linkedinUrl);
          if (!hasWebsite && !hasLinkedin) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          return (
            <div className="flex flex-wrap items-center gap-3">
              {hasWebsite ? (
                <a
                  href={row.original.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary flex items-center gap-1 text-sm hover:underline"
                >
                  <Globe className="size-3.5" />
                  {t("websiteLink")}
                </a>
              ) : null}
              {hasLinkedin ? (
                <a
                  href={row.original.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary flex items-center gap-1 text-sm hover:underline"
                >
                  <FaLinkedin className="size-3.5" />
                  LinkedIn
                </a>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "actions",
        size: 120,
        header: t("columnActions"),
        cell: ({ row }) => {
          const company = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <Link
                href={{
                  pathname: "/admin/job-tracker/companies/[id]/edit",
                  params: { id: company.id },
                }}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <Pencil className="mr-1 size-3.5" /> {t("edit")}
              </Link>
              <Button
                disabled={isPending}
                variant="ghost"
                size="icon"
                type="button"
                aria-label={t("delete")}
                onClick={() => handleRequestDelete(company)}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-8"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleRequestDelete, isPending, t],
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

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);

  const handleConfirmBulkDelete = useCallback(() => {
    if (!pendingBulkDelete || pendingBulkDelete.length === 0) return;
    const ids = pendingBulkDelete.map((c) => c.id);
    startTransition(async () => {
      try {
        await deleteManyCompanies.mutateAsync({ ids });
        toast.success(t("deleteManySuccess"));
        setPendingBulkDelete(null);
        table.resetRowSelection();
        await Promise.all([
          utils.jobTrackerAdmin.getCompanies.invalidate(),
          utils.jobTrackerAdmin.getDashboardStats.invalidate(),
        ]);
      } catch {
        toast.error(t("deleteManyError"));
      }
    });
  }, [deleteManyCompanies, pendingBulkDelete, t, table, utils]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-auto">
      <DataTableFetchingIndicator isFetching={isFetching} />
      <DataTable
        table={table}
        bulkBar={
          <DataTableBulkBar
            selectedCount={selectedRows.length}
            onClearSelection={() => table.resetRowSelection()}
            onDeleteSelected={() => handleRequestBulkDelete(selectedRows)}
            isDeleting={isPending}
          />
        }
      >
        <DataTableToolbar table={table}>
          <Link
            id="companies-add"
            href="/admin/job-tracker/companies/new"
            className={buttonVariants({ variant: "outline" })}
          >
            <Plus className="mr-1.5 size-4" />
            {t("newCompany")}
          </Link>
        </DataTableToolbar>
      </DataTable>

      {/* Cannot delete dialog (company has active applications) */}
      <Dialog
        open={Boolean(cannotDeleteCompany)}
        onOpenChange={(open) => !open && setCannotDeleteCompany(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("cannotDeleteTitle")}</DialogTitle>
            <DialogDescription>
              {cannotDeleteCompany
                ? t("cannotDeleteWithApps", {
                    count: cannotDeleteCompany.applicationsCount ?? 0,
                  })
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="default"
              onClick={() => setCannotDeleteCompany(null)}
            >
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm single delete dialog */}
      <Dialog
        open={Boolean(pendingDeleteCompany)}
        onOpenChange={(open) => !open && setPendingDeleteCompany(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {pendingDeleteCompany
                ? t("deleteConfirmMessage", { name: pendingDeleteCompany.name })
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setPendingDeleteCompany(null)}
            >
              {t("timeline.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleConfirmSingleDelete}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm bulk delete dialog */}
      <Dialog
        open={Boolean(pendingBulkDelete)}
        onOpenChange={(open) => !open && setPendingBulkDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteManyConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {pendingBulkDelete
                ? t("deleteManyConfirmMessage", {
                    count: pendingBulkDelete.length,
                  })
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setPendingBulkDelete(null)}
            >
              {t("timeline.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleConfirmBulkDelete}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
