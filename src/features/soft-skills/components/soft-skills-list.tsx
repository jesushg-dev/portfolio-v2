"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Settings2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { Locale } from "@/i18n/config";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { useDataTable } from "@/hooks/use-data-table";
import { buttonVariants, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resolveSoftSkillIcon } from "@/features/soft-skills/lib/soft-skill-icons";
import type { RouterOutputs } from "@/trpc/react";

type SoftSkillRow = RouterOutputs["softSkillsAdmin"]["getMine"][number];

interface SoftSkillsListProps {
  initialItems: SoftSkillRow[];
  locale: Locale;
}

function extractLocalizedText(raw: unknown, locale: Locale): string {
  if (!raw || typeof raw !== "object") return "";
  const obj = raw as Record<string, unknown>;
  const defaultText = typeof obj.default === "string" ? obj.default : "";
  const translations = obj.translations as Record<string, string> | undefined;
  if (translations?.[locale]) {
    return translations[locale];
  }
  return defaultText;
}

export const SoftSkillsList: FC<SoftSkillsListProps> = ({
  initialItems,
  locale,
}) => {
  const t = useTranslations("admin.softSkills");

  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const { data: items = initialItems } = api.softSkillsAdmin.getMine.useQuery(
    undefined,
    { initialData: initialItems },
  );

  const deleteItem = api.softSkillsAdmin.deleteItem.useMutation();

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setDeletingId(id);
        try {
          await deleteItem.mutateAsync({ id });
          toast.success(t("deleteSuccess"));
          await utils.softSkillsAdmin.getMine.invalidate();
        } catch {
          toast.error(t("deleteError"));
        } finally {
          setDeletingId(null);
        }
      });
    },
    [deleteItem, t, utils],
  );

  const columns = useMemo<ColumnDef<SoftSkillRow>[]>(
    () => [
      {
        accessorKey: "icon",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnIcon")} />
        ),
        cell: ({ row }) => {
          const Icon = resolveSoftSkillIcon(row.original.icon);
          return (
            <div className="border-border bg-muted/40 flex h-10 w-10 items-center justify-center rounded-full border">
              <Icon className="text-primary h-5 w-5" />
            </div>
          );
        },
      },
      {
        accessorKey: "title",
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
          const titleText = extractLocalizedText(row.original.title, locale);
          const descriptionText = extractLocalizedText(
            row.original.description,
            locale,
          );

          return (
            <div className="space-y-0.5">
              <p className="text-foreground font-medium">
                {titleText || t("untitled")}
              </p>
              {descriptionText ? (
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {descriptionText}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "isVisible",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnVisible")} />
        ),
        cell: ({ row }) =>
          row.original.isVisible ? (
            <Badge variant="secondary">{t("visible")}</Badge>
          ) : (
            <Badge variant="outline">{t("hidden")}</Badge>
          ),
      },
      {
        accessorKey: "order",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t("columnOrder")} />
        ),
      },
      {
        id: "actions",
        header: t("columnActions"),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/soft-skills/${item.id}/edit`}
                className={buttonVariants({
                  variant: "ghost",
                  size: "icon-sm",
                })}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">{t("edit")}</span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={deletingId === item.id}
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="text-destructive h-4 w-4" />
                <span className="sr-only">{t("delete")}</span>
              </Button>
            </div>
          );
        },
      },
    ],
    [deletingId, handleDelete, locale, t],
  );

  const { table } = useDataTable({
    data: items,
    columns,
    pageCount: 1,
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
    shallow: true,
  });

  if (items.length === 0) {
    return (
      <div className="border-border bg-card flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center">
        <div className="space-y-1">
          <p className="text-foreground text-base font-medium">
            {t("emptyTitle")}
          </p>
          <p className="text-muted-foreground max-w-sm text-sm">
            {t("emptyDescription")}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/admin/soft-skills/settings"
            id="soft-skills-settings"
            className={buttonVariants({ variant: "outline" })}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            {t("sectionSettings")}
          </Link>
          <Link
            href="/admin/soft-skills/new"
            id="soft-skills-add"
            className={buttonVariants()}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addNew")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[500px] flex-col">
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/soft-skills/settings"
              id="soft-skills-settings"
              className={buttonVariants({ variant: "outline" })}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              {t("sectionSettings")}
            </Link>
            <Link
              href="/admin/soft-skills/new"
              id="soft-skills-add"
              className={buttonVariants()}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("addNew")}
            </Link>
          </div>
        </DataTableToolbar>
      </DataTable>
    </div>
  );
};
