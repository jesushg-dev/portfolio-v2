"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { useRouter } from "@/i18n/routing";

type Outcome = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

interface Props {
  applicationId: string;
  eventId: string | null;
  onClose: () => void;
}

export function ApplicationEventResultDialog({
  applicationId,
  eventId,
  onClose,
}: Props) {
  const t = useTranslations("admin.jobTracker");
  const router = useRouter();
  const utils = api.useUtils();
  const mutation = api.jobTrackerAdmin.updateEvent.useMutation();
  const updateStatus =
    api.jobTrackerAdmin.updateApplicationStatus.useMutation();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [notes, setNotes] = useState("");

  const complete = async () => {
    if (!eventId || !outcome) return;
    try {
      await mutation.mutateAsync({
        id: eventId,
        completed: true,
        completedAt: new Date(),
        outcome,
        notes,
      });
      await Promise.all([
        utils.jobTrackerAdmin.getApplicationById.invalidate({
          id: applicationId,
        }),
        utils.jobTrackerAdmin.getUpcomingEvents.invalidate(),
      ]);
      router.refresh();
      toast.success(t("timeline.completeSuccess"));
      if (outcome === "NEGATIVE") {
        toast.info(t("processPath.negativeHint"), {
          action: {
            label: t("nextStep.reject"),
            onClick: () => {
              void updateStatus
                .mutateAsync({ id: applicationId, status: "REJECTED" })
                .then(() => router.refresh())
                .catch(() => toast.error(t("detail.statusUpdateError")));
            },
          },
        });
      }
      setOutcome(null);
      setNotes("");
      onClose();
    } catch {
      toast.error(t("timeline.completeError"));
    }
  };

  return (
    <Dialog
      open={eventId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("processPath.resultTitle")}</DialogTitle>
          <DialogDescription>
            {t("processPath.resultDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {(["POSITIVE", "NEUTRAL", "NEGATIVE"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={outcome === value ? "default" : "outline"}
              onClick={() => setOutcome(value)}
            >
              {t(`timeline.outcome.${value}`)}
            </Button>
          ))}
        </div>
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={t("timeline.notesPlaceholder")}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("timeline.cancel")}
          </Button>
          <Button
            disabled={!outcome || mutation.isPending}
            onClick={() => void complete()}
          >
            {t("timeline.markCompleted")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
