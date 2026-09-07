"use client";

import { useCallback, useMemo, useState, type FC } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  Shuffle,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Textarea } from "@/components/ui/textarea";
import { InterviewPrepTechnicalQuestionnaire } from "@/features/resume-engine/components/interview-prep-technical-questionnaire";
import type {
  InterviewPrepCategory,
  InterviewPrepEventType,
  InterviewPrepStoredQuestion,
} from "@/features/resume-engine/lib/interview-prep-result";
import { prioritizeHireQuestions } from "@/features/resume-engine/lib/interview-prep-result";

type PracticeRating = "again" | "ok" | "solid";

interface InterviewPrepPracticeProps {
  eventId: string;
  questions: InterviewPrepStoredQuestion[];
  eventType: InterviewPrepEventType;
  suggestedTools?: string[];
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
  eventId,
  questions,
  eventType,
  suggestedTools = [],
  onRegenerate,
  onGenerateMore,
  onGenerateForTool,
  isGeneratingMore,
}) => {
  const t = useTranslations("admin.jobTracker.interviewPrep");
  const [orderRest, setOrderRest] = useState<string[]>(() =>
    questions
      .filter((question) => question.category !== "hire")
      .map((question) => question.id),
  );
  const [index, setIndex] = useState(0);
  const [answerUi, setAnswerUi] = useState({
    questionId: "",
    draft: "",
    showHints: false,
    showAnswer: false,
  });
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
  const drillOrdered = ordered.filter(
    (question) => question.category !== "technical",
  );
  const technicalQuestions = questions.filter(
    (question) => question.category === "technical",
  );
  const safeIndex =
    drillOrdered.length === 0 ? 0 : Math.min(index, drillOrdered.length - 1);
  const current = drillOrdered[safeIndex] ?? null;
  const currentId = current?.id ?? "";
  if (answerUi.questionId !== currentId) {
    setAnswerUi({
      questionId: currentId,
      draft: "",
      showHints: false,
      showAnswer: false,
    });
  }
  const { draft, showHints, showAnswer } = answerUi;
  const ratedCount = ordered.filter((question) => ratings[question.id]).length;

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

  const goTo = (nextIndex: number) => {
    if (drillOrdered.length === 0) return;
    setIndex(Math.max(0, Math.min(nextIndex, drillOrdered.length - 1)));
  };

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

  const lastCreated = questions[questions.length - 1]?.createdAt;

  if (!current && technicalQuestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4">
        <div className="min-w-0 text-[13px]">
          <p className="font-medium">
            {t("alreadyDoneForType", {
              type: t(`eventType.${eventType}`),
              count: questions.length,
            })}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {t("practiceRated", { rated: ratedCount, total: ordered.length })}
            {lastCreated
              ? ` · ${t("generatedOn", {
                  date: new Intl.DateTimeFormat(undefined, {
                    month: "short",
                    day: "numeric",
                  }).format(new Date(lastCreated)),
                })}`
              : ""}
          </p>
        </div>
        <ButtonGroup aria-label={t("practiceActions")}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleShuffle}
          >
            <Shuffle className="mr-1.5 size-3.5" aria-hidden />
            {t("practiceShuffle")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
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
              onClick={onRegenerate}
            >
              <RefreshCw className="mr-1.5 size-3.5" aria-hidden />
              {t("regenerate")}
            </Button>
          ) : null}
        </ButtonGroup>
      </div>

      {onGenerateForTool && suggestedTools.length > 0 ? (
        <div className="border-border bg-card text-card-foreground rounded-lg border p-3.5 sm:p-4">
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
                className="h-7 text-xs"
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

      {technicalQuestions.length > 0 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {t("practiceTechnical")}
          </p>
          <InterviewPrepTechnicalQuestionnaire questions={technicalQuestions} />
        </div>
      ) : null}

      {current ? (
        <div className="border-border rounded-xl border p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {t("practiceDrill")} ·{" "}
              {t("practiceProgress", {
                current: safeIndex + 1,
                total: drillOrdered.length,
              })}
            </p>
            <CategoryBadge category={current.category} t={t} />
          </div>

          <p className="text-[15px] leading-snug font-medium sm:text-base">
            {current.question}
          </p>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            {current.whyTheyAsk}
          </p>

          {current.talkingPoints.length > 0 ? (
            <div className="mt-4">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() =>
                  setAnswerUi((currentUi) => ({
                    ...currentUi,
                    showHints: !currentUi.showHints,
                  }))
                }
              >
                <Lightbulb className="mr-1.5 size-3.5" aria-hidden />
                {showHints ? t("practiceHideHints") : t("practiceShowHints")}
              </Button>
              {showHints ? (
                <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm">
                  {current.talkingPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <label className="mt-4 block">
            <span className="text-xs font-medium">
              {t("practiceYourAnswer")}
            </span>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {t("practiceSpeakHint")}
            </p>
            <Textarea
              value={draft}
              onChange={(event) =>
                setAnswerUi((currentUi) => ({
                  ...currentUi,
                  draft: event.target.value,
                }))
              }
              placeholder={t("practiceYourAnswerPlaceholder")}
              className="mt-1.5 min-h-28"
            />
          </label>

          <div className="mt-3">
            <Button
              type="button"
              variant={showAnswer ? "outline" : "default"}
              size="sm"
              onClick={() =>
                setAnswerUi((currentUi) => ({
                  ...currentUi,
                  showAnswer: !currentUi.showAnswer,
                }))
              }
            >
              {showAnswer ? (
                <EyeOff className="mr-1.5 size-3.5" aria-hidden />
              ) : (
                <Eye className="mr-1.5 size-3.5" aria-hidden />
              )}
              {showAnswer ? t("practiceHideAnswer") : t("practiceReveal")}
            </Button>
          </div>

          {showAnswer ? (
            <div className="border-border mt-4 space-y-3 border-t pt-4 text-sm">
              <div>
                <p className="mb-1 text-xs font-medium">{t("modelAnswer")}</p>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {current.modelAnswer}
                </p>
              </div>
              {current.evidenceFromCv.length > 0 ? (
                <BulletSection
                  label={t("evidence")}
                  items={current.evidenceFromCv}
                />
              ) : null}
              {current.avoid.length > 0 ? (
                <BulletSection label={t("avoid")} items={current.avoid} />
              ) : null}

              <div>
                <p className="mb-2 text-xs font-medium">{t("practiceRate")}</p>
                <ButtonGroup aria-label={t("practiceRate")}>
                  {(
                    [
                      ["again", t("practiceRateAgain")],
                      ["ok", t("practiceRateOk")],
                      ["solid", t("practiceRateSolid")],
                    ] as const
                  ).map(([value, label]) => {
                    const selected = ratings[current.id] === value;
                    return (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant={selected ? "default" : "outline"}
                        onClick={() => persistRating(current.id, value)}
                      >
                        {value === "solid" && selected ? (
                          <CheckCircle2
                            className="mr-1.5 size-3.5"
                            aria-hidden
                          />
                        ) : null}
                        {label}
                      </Button>
                    );
                  })}
                </ButtonGroup>
              </div>
            </div>
          ) : null}

          <ButtonGroup aria-label={t("practiceActions")} className="mt-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safeIndex === 0}
              onClick={() => goTo(safeIndex - 1)}
            >
              <ChevronLeft className="mr-1 size-4" aria-hidden />
              {t("practicePrev")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={safeIndex >= drillOrdered.length - 1}
              onClick={() => goTo(safeIndex + 1)}
            >
              {t("practiceNext")}
              <ChevronRight className="ml-1 size-4" aria-hidden />
            </Button>
          </ButtonGroup>
        </div>
      ) : null}
    </div>
  );
};

function CategoryBadge({
  category,
  t,
}: {
  category: InterviewPrepCategory;
  t: ReturnType<typeof useTranslations<"admin.jobTracker.interviewPrep">>;
}) {
  return (
    <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
      {t(`category.${category}`)}
    </span>
  );
}

function BulletSection({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium">{label}</p>
      <ul className="text-muted-foreground list-disc space-y-0.5 pl-4 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
