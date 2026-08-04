"use client";

import { useCallback, useState, useTransition, type FC } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import type { NowFocusEditorDTO } from "@/features/now/lib/now-editor-dto";
import { api } from "@/trpc/react";

interface NowFocusesListProps {
  initialFocuses: NowFocusEditorDTO[];
}

export const NowFocusesList: FC<NowFocusesListProps> = ({ initialFocuses }) => {
  const t = useTranslations("admin.now");
  const utils = api.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data: focuses = initialFocuses } = api.nowAdmin.getFocuses.useQuery(
    undefined,
    { placeholderData: initialFocuses },
  );

  const deleteFocus = api.nowAdmin.deleteFocus.useMutation();

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        setDeletingId(id);
        try {
          await deleteFocus.mutateAsync({ id });
          await utils.nowAdmin.getFocuses.invalidate();
          toast.success(t("focusDeleted"));
        } catch {
          toast.error(t("focusDeleteFailed"));
        } finally {
          setDeletingId(null);
        }
      });
    },
    [deleteFocus, utils, t],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("focusesTitle")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("sections.focusesHint")}
          </p>
        </div>
        <Link
          href="/admin/now/focuses/new"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="mr-1 size-4" />
          {t("addFocus")}
        </Link>
      </div>
      <ul className="divide-border divide-y rounded-lg border">
        {focuses.map((focus) => {
          const first = Object.values(focus.translations)[0];
          const isDeleting = deletingId === focus.id && isPending;
          return (
            <li
              key={focus.id}
              className="flex items-start justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-muted-foreground font-mono text-xs">
                  #{focus.order}
                </p>
                <p className="font-semibold">{first?.label}</p>
                <p className="text-muted-foreground text-sm">{first?.body}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/admin/now/focuses/${focus.id}/edit`}
                  className={buttonVariants({ variant: "ghost", size: "icon" })}
                >
                  <Pencil className="size-4" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isDeleting}
                  onClick={() => handleDelete(focus.id)}
                >
                  {isDeleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
