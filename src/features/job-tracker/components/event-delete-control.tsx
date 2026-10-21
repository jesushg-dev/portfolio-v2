"use client";

import { useCallback, useState, useTransition, type FC } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api } from "@/trpc/react";
import { useRouter } from "@/i18n/routing";

interface EventDeleteControlProps {
  applicationId: string;
  eventId: string;
  appearance?: "icon" | "button";
  /** After success: stay on the application (`refresh`) or leave the event prep page. */
  afterDelete?: "refresh" | "application";
}

export const EventDeleteControl: FC<EventDeleteControlProps> = ({
  applicationId,
  eventId,
  appearance = "icon",
  afterDelete = "refresh",
}) => {
  const t = useTranslations("admin.jobTracker");
  const router = useRouter();
  const utils = api.useUtils();
  const deleteEvent = api.jobTrackerAdmin.deleteEvent.useMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      try {
        await deleteEvent.mutateAsync({ id: eventId });
        toast.success(t("timeline.deleteSuccess"));
        await Promise.all([
          utils.jobTrackerAdmin.getApplicationById.invalidate({
            id: applicationId,
          }),
          utils.jobTrackerAdmin.getUpcomingEvents.invalidate(),
        ]);
        setConfirmOpen(false);
        if (afterDelete === "application") {
          router.push({
            pathname: "/admin/job-tracker/applications/[id]",
            params: { id: applicationId },
          });
        } else {
          router.refresh();
        }
      } catch {
        toast.error(t("timeline.deleteError"));
        setConfirmOpen(false);
      }
    });
  }, [afterDelete, applicationId, deleteEvent, eventId, router, t, utils]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={appearance === "icon" ? "icon-sm" : "sm"}
        disabled={isPending}
        onClick={() => setConfirmOpen(true)}
        aria-label={t("timeline.deleteAria")}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 shrink-0"
      >
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="size-3.5" aria-hidden />
        )}
        {appearance === "button" ? (
          <span className="ml-1.5">{t("timeline.delete")}</span>
        ) : null}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("timeline.deleteTitle")}
        description={t("timeline.deleteConfirm")}
        cancelLabel={t("detail.deleteCancel")}
        confirmLabel={t("detail.deleteConfirmAction")}
        confirmVariant="destructive"
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </>
  );
};
