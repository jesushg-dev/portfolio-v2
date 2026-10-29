"use client";
import type { AppLanguage } from "@prisma/client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { GripVertical, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  LanguageStatusBadge,
  computeTranslationStatus,
} from "@/components/shared/data-table/language-status-badge";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/trpc/react";
import type { NowFocusEditorDTO } from "../../lib/now-editor-dto";
interface Props {
  initialFocuses: NowFocusEditorDTO[];
  languages?: AppLanguage[];
}
export function NowFocusesList({ initialFocuses, languages = [] }: Props) {
  const t = useTranslations("admin.now");
  const common = useTranslations("admin.common");
  const locale = useLocale();
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data: focuses = initialFocuses } = api.nowAdmin.getFocuses.useQuery(
    undefined,
    { placeholderData: initialFocuses },
  );
  const remove = api.nowAdmin.deleteFocus.useMutation();
  const reorder = api.nowAdmin.reorderFocuses.useMutation();
  const busy = remove.isPending || reorder.isPending;
  const onReorder = async (next: NowFocusEditorDTO[]) => {
    if (busy) return;
    const previous = utils.nowAdmin.getFocuses.getData() ?? focuses;
    utils.nowAdmin.getFocuses.setData(
      undefined,
      next.map((focus, order) => ({ ...focus, order })),
    );
    try {
      await reorder.mutateAsync({ ids: next.map((focus) => focus.id) });
    } catch {
      utils.nowAdmin.getFocuses.setData(undefined, previous);
      toast.error(t("focusReorderFailed"));
    } finally {
      await utils.nowAdmin.getFocuses.invalidate();
    }
  };
  const onDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await remove.mutateAsync({ id });
      await utils.nowAdmin.getFocuses.invalidate();
      toast.success(t("focusDeleted"));
    } catch {
      toast.error(t("focusDeleteFailed"));
    } finally {
      setDeletingId(null);
    }
  };
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("focusesTitle")}</h2>
          <p className="text-muted-foreground text-sm">{t("focusOrderHint")}</p>
        </div>
        <Link
          href="/admin/now/focuses/new"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus aria-hidden />
          {t("addFocus")}
        </Link>
      </div>
      {!focuses.length ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
          {common("noItems")}
        </p>
      ) : (
        <Sortable
          value={focuses}
          getItemValue={(focus) => focus.id}
          onValueChange={(next) => {
            void onReorder(next);
          }}
        >
          <SortableContent asChild>
            <ol className="space-y-3">
              {focuses.map((focus, index) => {
                const language =
                  languages.find((language) => language.code === locale) ??
                  languages.find((language) => language.code === "en");
                const copy = language
                  ? focus.translations[language.id]
                  : Object.values(focus.translations)[0];
                return (
                  <SortableItem
                    key={focus.id}
                    value={focus.id}
                    disabled={busy}
                    asChild
                  >
                    <li className="border-border bg-muted/20 flex min-w-0 items-start gap-3 rounded-xl border p-3 sm:p-4">
                      <SortableItemHandle asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={busy}
                          aria-label={t("moveFocus", {
                            name: copy?.label || String(index + 1),
                          })}
                        >
                          <GripVertical aria-hidden />
                        </Button>
                      </SortableItemHandle>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-muted-foreground text-xs tabular-nums">
                            {index + 1}
                          </span>
                          <LanguageStatusBadge
                            languages={languages.map((language) => ({
                              code: language.code,
                              name: language.name,
                              status: computeTranslationStatus(
                                focus.translations[language.id],
                                ["label", "body"],
                              ),
                            }))}
                          />
                        </div>
                        <p className="font-semibold wrap-break-word">
                          {copy?.label}
                        </p>
                        <p className="text-muted-foreground text-sm wrap-break-word">
                          {copy?.body}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Link
                          href={"/admin/now/focuses/" + focus.id + "/edit"}
                          aria-label={common("edit")}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "icon",
                          })}
                        >
                          <Pencil aria-hidden />
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={busy}
                          aria-label={common("delete")}
                          onClick={() => {
                            void onDelete(focus.id);
                          }}
                        >
                          {deletingId === focus.id ? (
                            <Loader2 className="animate-spin" aria-hidden />
                          ) : (
                            <Trash2 aria-hidden />
                          )}
                        </Button>
                      </div>
                    </li>
                  </SortableItem>
                );
              })}
            </ol>
          </SortableContent>
        </Sortable>
      )}
    </div>
  );
}
