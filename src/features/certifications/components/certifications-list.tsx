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

type CertificationRow =
  RouterOutputs["portfolioAdmin"]["getMyCertifications"][number];

interface SkillRow {
  id: string;
  title: string;
}

interface CertificationsListProps {
  initialCertifications: CertificationRow[];
}

export const CertificationsList: FC<CertificationsListProps> = ({
  initialCertifications,
}) => {
  const t = useTranslations("admin.certifications");
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const { data: certifications = initialCertifications } =
    api.portfolioAdmin.getMyCertifications.useQuery(undefined, {
      initialData: initialCertifications,
    });

  const { data: rawSkills = [] } = api.portfolioAdmin.getMySkills.useQuery();

  const deleteCertification =
    api.portfolioAdmin.deleteCertification.useMutation();

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setDeletingId(id);
        try {
          await deleteCertification.mutateAsync({ id });
          toast.success(t("deleteSuccess") || "Deleted successfully");
          await utils.portfolioAdmin.getMyCertifications.invalidate();
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

  const columns = useMemo<ColumnDef<CertificationRow>[]>(
    () => [
      {
        id: "title",
        accessorFn: (row) => row.CertificationTranslation?.[0]?.title ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnTitle")} />
        ),
        meta: {
          label: t("columnTitle"),
          placeholder: "Search title...",
          variant: "text",
        },
        enableColumnFilter: true,
        cell: ({ row }) => (
          <p className="font-medium text-gray-900">
            {row.original.CertificationTranslation?.[0]?.title ?? t("untitled")}
          </p>
        ),
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
      },
      {
        id: "issuedDate",
        accessorFn: (row) => row.issuedDate ?? 0,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnIssued")} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-gray-500">
            {row.original.issuedDate ?? "-"}
          </span>
        ),
      },
      {
        id: "skills",
        accessorFn: (row) =>
          row.CertificateSkill?.map(
            (cs) => skillsById.get(cs.skillId)?.title ?? "",
          )
            .filter(Boolean)
            .join(", ") ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnSkills")} />
        ),
        cell: ({ row }) => {
          const skillTitles =
            row.original.CertificateSkill?.map(
              (cs) => skillsById.get(cs.skillId)?.title ?? "",
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
          const cert = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/certifications/${cert.id}/edit`}
                className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                <Pencil className="mr-1 inline-block h-3 w-3" /> {t("edit")}
              </Link>
              {deletingId === cert.id ? (
                <span className="text-xs text-red-500">{t("deleting")}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDelete(cert.id)}
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
    data: certifications,
    columns,
    pageCount: 1,
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
    initialState: {
      sorting: [
        { id: "title" as Extract<keyof CertificationRow, string>, desc: false },
      ],
    },
    shallow: true,
  });

  return (
    <div className="relative flex h-full min-h-[500px] flex-col">
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <Link
            id="certifications-add"
            href="/admin/certifications/new"
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
