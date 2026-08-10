"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/app-table-features";
import {
  Plus,
  Pencil,
  Eye,
  Trash2,
  Loader2,
  Building2,
  Calendar,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQueryState, parseAsInteger } from "nuqs";

import { api, type RouterOutputs } from "@/trpc/react";
import type { Locale } from "@/i18n/config";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableFetchingIndicator } from "@/components/shared/data-table/data-table-fetching-indicator";
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSortingStateParser } from "@/lib/parsers";
import type { FilterItemSchema } from "@/lib/parsers";
import { statusVariants } from "@/features/job-tracker/lib/constants";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";

type ApplicationRow =
  RouterOutputs["jobTrackerAdmin"]["getApplications"]["data"][number];

interface ApplicationsListProps {
  initialApplications: ApplicationRow[];
  locale: Locale;
  pageCount: number;
  totalCount: number;
}

export const ApplicationsList: FC<ApplicationsListProps> = ({
  initialApplications,
  locale,
  pageCount: initialPageCount,
  totalCount: initialTotalCount,
}) => {
  const t = useTranslations("admin.jobTracker");
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const [sort] = useQueryState("sort", getSortingStateParser<ApplicationRow>());

  const [positionFilter] = useQueryState("position");
  const [companyFilter] = useQueryState("company");

  const parsedFilters = useMemo((): FilterItemSchema[] => {
    const f: FilterItemSchema[] = [];
    if (positionFilter) {
      f.push({
        id: "position",
        value: positionFilter,
        variant: "text",
        operator: "iLike",
        filterId: "position",
      });
    }
    if (companyFilter) {
      f.push({
        id: "company",
        value: companyFilter,
        variant: "text",
        operator: "iLike",
        filterId: "company",
      });
    }
    return f;
  }, [positionFilter, companyFilter]);

  const {
    data: { data: applications, totalCount: trpcTotalCount } = {
      data: initialApplications,
      totalCount: initialTotalCount,
    },
    isFetching,
  } = api.jobTrackerAdmin.getApplications.useQuery(
    { page, perPage, sort: sort ?? [], filters: parsedFilters },
    {
      placeholderData: {
        data: initialApplications,
        pageCount: initialPageCount,
        totalCount: initialTotalCount,
      },
    },
  );

  const deleteApplication = api.jobTrackerAdmin.deleteApplication.useMutation();

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setDeletingId(id);
        try {
          await deleteApplication.mutateAsync({ id });
          toast.success(t("deleteApplicationSuccess"));
          await utils.jobTrackerAdmin.getApplications.invalidate();
          await utils.jobTrackerAdmin.getDashboardStats.invalidate();
        } catch {
          toast.error(t("deleteApplicationError"));
        } finally {
          setDeletingId(null);
        }
      });
    },
    [deleteApplication, t, utils],
  );

  const dateFnsLocale = getDateFnsLocale(locale);

  const columns = useMemo<ColumnDef<AppTableFeatures, ApplicationRow>[]>(
    () => [
      {
        id: "position",
        accessorKey: "position",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnPosition")} />
        ),
        meta: {
          label: t("columnPosition"),
          placeholder: t("filterPositionPlaceholder"),
          variant: "text",
        },
        enableColumnFilter: true,
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="space-y-1">
              <p className="text-foreground font-medium">{app.position}</p>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {app.company.name}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "company",
        accessorFn: (row) => row.company.name,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnCompany")} />
        ),
        meta: {
          label: t("columnCompany"),
          placeholder: t("filterCompanyPlaceholder"),
          variant: "text",
        },
        enableColumnFilter: true,
        enableSorting: false,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnStatus")} />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={statusVariants[status]}>
              {t(`status.${status}`)}
            </Badge>
          );
        },
      },
      {
        id: "appliedDate",
        accessorKey: "appliedDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnDate")} />
        ),
        cell: ({ row }) => (
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3" />
            {format(new Date(row.original.appliedDate), "MMM d, yyyy", {
              locale: dateFnsLocale,
            })}
          </div>
        ),
      },
      {
        id: "actions",
        size: 120,
        header: t("columnActions"),
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={{
                  pathname: "/admin/job-tracker/applications/[id]",
                  params: { id: app.id },
                }}
                className="bg-muted text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap"
              >
                <Eye className="h-3 w-3" /> {t("view")}
              </Link>
              <Link
                href={{
                  pathname: "/admin/job-tracker/applications/[id]/edit",
                  params: { id: app.id },
                }}
                className="bg-muted text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap"
              >
                <Pencil className="h-3 w-3" /> {t("edit")}
              </Link>
              <Button
                disabled={isPending || deletingId === app.id}
                variant="ghost"
                size="icon"
                type="button"
                aria-label={t("delete")}
                onClick={() => handleDelete(app.id)}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded"
              >
                {deletingId === app.id ? (
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
    [dateFnsLocale, deletingId, handleDelete, isPending, t],
  );

  const { table } = useDataTable({
    data: applications,
    columns,
    rowCount: trpcTotalCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    initialState: {
      sorting: [{ id: "appliedDate", desc: true }],
    },
    shallow: true,
  });

  return (
    <div className="relative flex h-full flex-col">
      <DataTableFetchingIndicator isFetching={isFetching} />
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <Link
            id="applications-add"
            href="/admin/job-tracker/applications/new"
            className={buttonVariants()}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("newApplication")}
          </Link>
        </DataTableToolbar>
      </DataTable>
    </div>
  );
};
