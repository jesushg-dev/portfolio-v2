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
import { getLocalizedFieldForLocale } from "@/lib/i18n/localized-display";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants, Button } from "@/components/ui/button";

type CertificationRow = RouterOutputs["certificationsAdmin"]["getMine"][number];

interface SkillRow {
  id: string;
  title: string;
}

interface CertificationsListProps {
  initialCertifications: CertificationRow[];
  languages: AppLanguage[];
  locale: Locale;
}

export const CertificationsList: FC<CertificationsListProps> = ({
  initialCertifications,
  languages,
  locale,
}) => {
  const t = useTranslations("admin.certifications");
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data: certifications = initialCertifications } =
    api.certificationsAdmin.getMine.useQuery(undefined, {
      initialData: initialCertifications,
    });

  const { data: rawSkills = [] } = api.skillsAdmin.getMine.useQuery();

  const deleteCertification = api.certificationsAdmin.deleteItem.useMutation();

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

  const columns = useMemo<ColumnDef<CertificationRow>[]>(
    () => [
      {
        id: "title",
        accessorFn: (row) =>
          getLocalizedFieldForLocale(
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
        cell: ({ row }) => (
          <p className="text-foreground font-medium">
            {getLocalizedFieldForLocale(
              row.original.translations,
              languages,
              locale,
              "title",
            ) || t("untitled")}
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
          <span className="text-muted-foreground text-xs">
            {row.original.issuedDate ?? "-"}
          </span>
        ),
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
                className="bg-muted text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg px-2.5 py-1 text-xs font-medium"
              >
                <Pencil className="mr-1 inline-block h-3 w-3" /> {t("edit")}
              </Link>

              <Button
                disabled={isPending || deletingId === cert.id}
                variant="ghost"
                size="icon"
                type="button"
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
    ],
    [deletingId, handleDelete, isPending, languages, locale, skillsById, t],
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
