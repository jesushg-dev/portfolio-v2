"use client";

import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, type PanInfo } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Shuffle,
  Sparkles,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  InterviewPrepFlashcard,
  type PracticeRating,
} from "@/features/resume-engine/components/interview-prep-flashcard";
import { InterviewPrepManualQuestionDialog } from "@/features/resume-engine/components/interview-prep-manual-question-dialog";
import type {
  InterviewPrepEventType,
  InterviewPrepStoredQuestion,
} from "@/features/resume-engine/lib/interview-prep-result";
import { prioritizeHireQuestions } from "@/features/resume-engine/lib/interview-prep-result";

interface InterviewPrepPracticeProps {
  applicationId: string;
  eventId: string;
  questions: InterviewPrepStoredQuestion[];
  eventType: InterviewPrepEventType;
  suggestedTools?: string[];
  onOpenGenerator?: () => void;
  onRegenerate?: () => void;
  onGenerateMore?: () => void;
  onGenerateForTool?: (tool: string) => void;
  isGeneratingMore?: boolean;
}

function ratingsKey(eventId: string) {
  return `interview-prep-ratings:${eventId}`;
}

function loadRatings(eventId: string): Record<string, PracticeRating> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ratingsKey(eventId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PracticeRating>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export const InterviewPrepPractice: FC<InterviewPrepPracticeProps> = ({
  applicationId,
  eventId,
  questions,
  eventType,
  suggestedTools = [],
  onOpenGenerator,
  onRegenerate,
  onGenerateMore,
  onGenerateForTool,
  isGeneratingMore,
}) => {
  const t = useTranslations("admin.jobTracker.interviewPrep");
  const locale = useLocale();
  const [orderRest, setOrderRest] = useState<string[]>(() =>
    questions
      .filter((question) => question.category !== "hire")
      .map((question) => question.id),
  );
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ratingsEventId, setRatingsEventId] = useState(eventId);
  const [ratings, setRatings] = useState<Record<string, PracticeRating>>(() =>
    loadRatings(eventId),
  );

  if (ratingsEventId !== eventId) {
    setRatingsEventId(eventId);
    setRatings(loadRatings(eventId));
  }

  const hireIds = questions
    .filter((question) => question.category === "hire")
    .map((question) => question.id);
  const restIds = questions
    .filter((question) => question.category !== "hire")
    .map((question) => question.id);
  const order = [
    ...hireIds,
    ...orderRest.filter((id) => restIds.includes(id)),
    ...restIds.filter((id) => !orderRest.includes(id)),
  ];

  const questionById = useMemo(
    () => new Map(questions.map((question) => [question.id, question])),
    [questions],
  );
  const ordered = order
    .map((id) => questionById.get(id))
    .filter((question): question is InterviewPrepStoredQuestion =>
      Boolean(question),
    );

  const safeIndex =
    ordered.length === 0 ? 0 : Math.min(index, ordered.length - 1);
  const current = ordered[safeIndex] ?? null;

  const ratedCount = ordered.filter((question) => ratings[question.id]).length;
  const solidCount = ordered.filter(
    (question) => ratings[question.id] === "solid",
  ).length;

  const persistRating = useCallback(
    (questionId: string, rating: PracticeRating) => {
      setRatings((previous) => {
        const next = { ...previous, [questionId]: rating };
        try {
          window.localStorage.setItem(
            ratingsKey(eventId),
            JSON.stringify(next),
          );
        } catch {
          /* ignore quota */
        }
        return next;
      });
    },
    [eventId],
  );

  const goTo = useCallback(
    (nextIndex: number) => {
      if (ordered.length === 0) return;
      setIsFlipped(false);
      setIndex(Math.max(0, Math.min(nextIndex, ordered.length - 1)));
    },
    [ordered.length],
  );

  const handleNext = useCallback(() => {
    if (safeIndex < ordered.length - 1) {
      goTo(safeIndex + 1);
    }
  }, [goTo, safeIndex, ordered.length]);

  const handlePrev = useCallback(() => {
    if (safeIndex > 0) {
      goTo(safeIndex - 1);
    }
  }, [goTo, safeIndex]);

  const handleFlipToggle = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleShuffle = useCallback(() => {
    const nextRest = questions
      .filter((question) => question.category !== "hire")
      .map((question) => question.id);
    for (let i = nextRest.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [nextRest[i], nextRest[j]] = [nextRest[j], nextRest[i]];
    }
    setOrderRest(nextRest);
    setIndex(0);
    setIsFlipped(false);
  }, [questions]);

  const handleCopyAll = useCallback(async () => {
    const text = prioritizeHireQuestions(questions)
      .map(
        (question, i) =>
          `${i + 1}. ${question.question}\n\n${question.modelAnswer}`,
      )
      .join("\n\n---\n\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }, [questions, t]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept when user is typing in a textarea or input
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "textarea" || activeTag === "input") return;

      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        handleFlipToggle();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrev();
      } else if (event.key === "1" && current) {
        persistRating(current.id, "again");
      } else if (event.key === "2" && current) {
        persistRating(current.id, "ok");
      } else if (event.key === "3" && current) {
        persistRating(current.id, "solid");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [current, handleFlipToggle, handleNext, handlePrev, persistRating]);

  // Swipe drag handler for mobile touch screens
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold) {
      handlePrev();
    }
  };

  const speechLang =
    locale === "es" ? "es-ES" : locale === "nl" ? "nl-NL" : "en-US";
  const lastCreated = questions[questions.length - 1]?.createdAt;

  if (!current) return null;

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Top Header & Actions */}
      <div className="border-border bg-card text-card-foreground flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 shadow-xs">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {t("alreadyDoneForType", {
              type: t(`eventType.${eventType}`),
              count: questions.length,
            })}
          </p>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span>
              {t("practiceRated", { rated: ratedCount, total: ordered.length })}
            </span>
            {solidCount > 0 ? (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                · {solidCount} {t("practiceRateSolid").toLowerCase()}
              </span>
            ) : null}
            {lastCreated
              ? ` · ${t("generatedOn", {
                  date: new Intl.DateTimeFormat(undefined, {
                    month: "short",
                    day: "numeric",
                  }).format(new Date(lastCreated)),
                })}`
              : ""}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <InterviewPrepManualQuestionDialog
            applicationId={applicationId}
            eventId={eventId}
          />
          {onOpenGenerator ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 text-xs font-medium sm:h-9"
              onClick={onOpenGenerator}
            >
              <Sparkles className="mr-1.5 size-3.5 text-amber-500" />
              {t("openGenerator")}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 text-xs font-medium sm:h-9"
            onClick={handleShuffle}
          >
            <Shuffle className="mr-1.5 size-3.5" aria-hidden />
            {t("practiceShuffle")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 text-xs font-medium sm:h-9"
            onClick={() => void handleCopyAll()}
          >
            <Copy className="mr-1.5 size-3.5" aria-hidden />
            {t("copyAll")}
          </Button>
          {onGenerateMore ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 text-xs font-medium sm:h-9"
              disabled={isGeneratingMore}
              onClick={onGenerateMore}
            >
              {isGeneratingMore ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Plus className="mr-1.5 size-3.5" aria-hidden />
              )}
              {t("generateMore")}
            </Button>
          ) : null}
          {onRegenerate ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 text-xs font-medium sm:h-9"
              onClick={onRegenerate}
            >
              <RefreshCw className="mr-1.5 size-3.5" aria-hidden />
              {t("regenerate")}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Tool Deep Dive Panel */}
      {onGenerateForTool && suggestedTools.length > 0 ? (
        <div className="border-border bg-card text-card-foreground rounded-xl border p-3.5 sm:p-4">
          <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
            <Wrench className="text-primary size-3.5" aria-hidden />
            <span>{t("toolDeepDive")}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {t("focusToolsHint")}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {suggestedTools.map((tool) => (
              <Button
                key={tool}
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 text-xs sm:h-7"
                disabled={isGeneratingMore}
                onClick={() => onGenerateForTool(tool)}
              >
                {isGeneratingMore ? (
                  <Loader2 className="mr-1 size-3 animate-spin" />
                ) : (
                  <Plus className="mr-1 size-3" aria-hidden />
                )}
                {t("generateForTool", { tool })}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Main Flashcard Drill Section */}
      {current ? (
        <div className="flex flex-col gap-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="text-primary size-3.5" />
                {t("practiceDrill")}
              </span>
              <span className="text-muted-foreground">
                {t("practiceProgress", {
                  current: safeIndex + 1,
                  total: ordered.length,
                })}
              </span>
            </div>
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{
                  width: `${((safeIndex + 1) / ordered.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Swipeable Flashcard Container */}
          <motion.div
            key={current.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="cursor-grab touch-pan-y active:cursor-grabbing"
          >
            <InterviewPrepFlashcard
              question={current}
              rating={ratings[current.id]}
              onRate={(rating) => persistRating(current.id, rating)}
              isFlipped={isFlipped}
              onFlipToggle={handleFlipToggle}
              index={safeIndex}
              total={ordered.length}
              lang={speechLang}
            />
          </motion.div>

          {/* Navigation Bar (Inline below flashcard for all screen sizes) */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safeIndex === 0}
              onClick={handlePrev}
            >
              <ChevronLeft className="mr-1 size-4" aria-hidden />
              <span>{t("practicePrev")}</span>
            </Button>

            <span className="text-muted-foreground text-center text-xs">
              {t("tapToFlip")}
            </span>

            <Button
              type="button"
              size="sm"
              disabled={safeIndex >= ordered.length - 1}
              onClick={handleNext}
            >
              <span>{t("practiceNext")}</span>
              <ChevronRight className="ml-1 size-4" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
