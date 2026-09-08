"use client";

import { useCallback, useState, useTransition, type FC } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import type { InterviewPrepCategory } from "@/features/resume-engine/lib/interview-prep-result";

interface InterviewPrepManualQuestionDialogProps {
  applicationId: string;
  eventId: string;
  onQuestionCreated?: () => void;
}

const CATEGORIES: InterviewPrepCategory[] = [
  "role",
  "behavioral",
  "technical",
  "hire",
  "intro",
  "gap",
  "closing",
  "screening",
];

export const InterviewPrepManualQuestionDialog: FC<
  InterviewPrepManualQuestionDialogProps
> = ({ applicationId, eventId, onQuestionCreated }) => {
  const t = useTranslations("admin.jobTracker.interviewPrep");
  const [open, setOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [category, setCategory] = useState<InterviewPrepCategory>("role");
  const [modelAnswer, setModelAnswer] = useState("");
  const [whyTheyAsk, setWhyTheyAsk] = useState("");
  const [talkingPointsRaw, setTalkingPointsRaw] = useState("");
  const [isPending, startTransition] = useTransition();

  const createMutation =
    api.interviewPrepAdmin.createManualQuestion.useMutation();
  const utils = api.useUtils();

  const handleSubmit = useCallback(() => {
    if (!questionText.trim()) {
      toast.error(t("questionLabel"));
      return;
    }
    if (!modelAnswer.trim()) {
      toast.error(t("modelAnswerLabel"));
      return;
    }

    const talkingPoints = talkingPointsRaw
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    startTransition(async () => {
      try {
        await createMutation.mutateAsync({
          applicationId,
          eventId,
          question: questionText.trim(),
          category,
          modelAnswer: modelAnswer.trim(),
          whyTheyAsk: whyTheyAsk.trim(),
          talkingPoints,
        });

        await utils.interviewPrepAdmin.getInterviewPrepPageData.invalidate({
          applicationId,
          eventId,
        });

        toast.success(t("questionSaved"));
        setQuestionText("");
        setModelAnswer("");
        setWhyTheyAsk("");
        setTalkingPointsRaw("");
        setOpen(false);
        onQuestionCreated?.();
      } catch (err) {
        const msg = err instanceof Error ? err.message : t("failed");
        toast.error(t("failed"), { description: msg });
      }
    });
  }, [
    applicationId,
    category,
    createMutation,
    eventId,
    modelAnswer,
    onQuestionCreated,
    questionText,
    t,
    talkingPointsRaw,
    utils.interviewPrepAdmin.getInterviewPrepPageData,
    whyTheyAsk,
  ]);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-11 flex-1 text-xs font-medium sm:h-9 sm:flex-initial"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1.5 size-3.5" aria-hidden />
        {t("addManualQuestion")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("addManualQuestionTitle")}</DialogTitle>
            <DialogDescription>{t("addManualQuestionDesc")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3.5 py-2">
            {/* Question Text */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="manual-q-text"
                className="text-foreground text-xs font-semibold"
              >
                {t("questionLabel")}
              </label>
              <Input
                id="manual-q-text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="e.g. Tell me about a time you resolved a critical production incident."
                className="text-xs sm:text-sm"
              />
            </div>

            {/* Category Select */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="manual-q-cat"
                className="text-foreground text-xs font-semibold"
              >
                {t("categoryLabel")}
              </label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val!)}
              >
                <SelectTrigger id="manual-q-cat" className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {t(`category.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Why they ask */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="manual-q-why"
                className="text-foreground text-xs font-semibold"
              >
                {t("whyTheyAskLabel")}
              </label>
              <Input
                id="manual-q-why"
                value={whyTheyAsk}
                onChange={(e) => setWhyTheyAsk(e.target.value)}
                placeholder="e.g. Evaluates crisis management and communication under pressure."
                className="text-xs"
              />
            </div>

            {/* Model Answer */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="manual-q-answer"
                className="text-foreground text-xs font-semibold"
              >
                {t("modelAnswerLabel")}
              </label>
              <Textarea
                id="manual-q-answer"
                value={modelAnswer}
                onChange={(e) => setModelAnswer(e.target.value)}
                placeholder="STAR method structure: Situation, Task, Action, Result..."
                className="min-h-24 text-xs sm:text-sm"
              />
            </div>

            {/* Talking Points */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="manual-q-points"
                className="text-foreground text-xs font-semibold"
              >
                {t("talkingPointsLabel")}
              </label>
              <Textarea
                id="manual-q-points"
                value={talkingPointsRaw}
                onChange={(e) => setTalkingPointsRaw(e.target.value)}
                placeholder="Situation: Outage in EU region&#10;Action: Coordinated failover&#10;Result: 99.99% uptime maintained"
                className="min-h-20 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="min-h-11 sm:h-9"
            >
              {t("practiceSkip")}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                isPending || !questionText.trim() || !modelAnswer.trim()
              }
              className="min-h-11 sm:h-9"
            >
              {isPending ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : null}
              {t("saveQuestion")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
