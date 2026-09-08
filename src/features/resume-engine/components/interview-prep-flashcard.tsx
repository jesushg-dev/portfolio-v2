"use client";

import { useCallback, useState, type FC } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  HelpCircle,
  Lightbulb,
  Loader2,
  Mic,
  MicOff,
  RotateCw,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import type {
  InterviewPrepCategory,
  InterviewPrepStoredQuestion,
} from "@/features/resume-engine/lib/interview-prep-result";
import type { InterviewAnswerEvaluation } from "@/features/resume-engine/lib/ai/evaluate-interview-answer";

export type PracticeRating = "again" | "ok" | "solid";

interface InterviewPrepFlashcardProps {
  question: InterviewPrepStoredQuestion;
  rating?: PracticeRating;
  onRate: (rating: PracticeRating) => void;
  isFlipped: boolean;
  onFlipToggle: () => void;
  index: number;
  total: number;
  lang?: string;
}

export const InterviewPrepFlashcard: FC<InterviewPrepFlashcardProps> = ({
  question,
  rating,
  onRate,
  isFlipped,
  onFlipToggle,
  index,
  total,
  lang = "es-ES",
}) => {
  const t = useTranslations("admin.jobTracker.interviewPrep");
  const [showHints, setShowHints] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showTextarea, setShowTextarea] = useState(false);
  const [userAnswerDraft, setUserAnswerDraft] = useState("");
  const [evaluation, setEvaluation] =
    useState<InterviewAnswerEvaluation | null>(null);

  const evaluateMutation = api.interviewPrepAdmin.evaluateAnswer.useMutation();

  const {
    isListening,
    transcript,
    isSupported: isSpeechSupported,
    toggleListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang,
    onTranscriptChange: (text) => {
      setUserAnswerDraft(text);
    },
    onError: (code) => {
      if (code === "not-allowed") {
        toast.error(t("voiceErrorNotAllowed"));
      } else if (code === "audio-capture") {
        toast.error(t("voiceErrorAudioCapture"));
      } else if (code === "network") {
        toast.error(t("voiceErrorNetwork"));
      } else if (code === "unsupported") {
        toast.error(t("voiceUnsupported"));
      } else {
        toast.error(t("voiceErrorUnknown"));
      }
    },
  });

  const effectiveAnswer = userAnswerDraft || transcript;

  const handleEvaluate = useCallback(async () => {
    if (!effectiveAnswer.trim()) {
      toast.error(t("practiceYourAnswer"));
      return;
    }

    try {
      const response = await evaluateMutation.mutateAsync({
        questionId: question.id,
        question: question.question,
        whyTheyAsk: question.whyTheyAsk,
        modelAnswer: question.modelAnswer,
        userAnswer: effectiveAnswer.trim(),
        talkingPoints: question.talkingPoints,
      });

      setEvaluation(response.evaluation);
      toast.success(t("aiFeedback"));
      if (!isFlipped) {
        onFlipToggle();
      }
    } catch {
      toast.error(t("failed"));
    }
  }, [effectiveAnswer, evaluateMutation, isFlipped, onFlipToggle, question, t]);

  return (
    <div className="perspective-1000 w-full">
      <motion.div
        className="relative w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* FRONT SIDE: QUESTION & SPEECH */}
        <div
          className={cn(
            "border-border bg-card text-card-foreground flex min-h-[26rem] flex-col justify-between rounded-2xl border p-5 shadow-sm transition-shadow sm:min-h-[28rem] sm:p-7",
            isFlipped ? "pointer-events-none invisible" : "visible",
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Header row: Category & Counter */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <CategoryBadge category={question.category} t={t} />
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                <span>
                  {t("practiceProgress", {
                    current: index + 1,
                    total,
                  })}
                </span>
                {rating ? (
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      rating === "solid" && "bg-emerald-500",
                      rating === "ok" && "bg-amber-500",
                      rating === "again" && "bg-rose-500",
                    )}
                  />
                ) : null}
              </div>
            </div>

            {/* Question Text */}
            <h3 className="text-foreground mt-4 text-lg leading-snug font-semibold sm:text-xl">
              {question.question}
            </h3>

            {/* Horizontal Row: Why recruiters ask & Talking points hints */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {question.whyTheyAsk ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "text-muted-foreground hover:text-foreground h-9 min-h-11 px-2.5 text-xs",
                    showWhy && "bg-muted text-foreground",
                  )}
                  onClick={() => setShowWhy((prev) => !prev)}
                >
                  <HelpCircle className="mr-1.5 size-3.5" aria-hidden />
                  <span>{t("why")}</span>
                  {showWhy ? (
                    <ChevronUp className="ml-1 size-3.5" />
                  ) : (
                    <ChevronDown className="ml-1 size-3.5" />
                  )}
                </Button>
              ) : null}

              {question.talkingPoints.length > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "text-muted-foreground hover:text-foreground h-9 min-h-11 px-2.5 text-xs",
                    showHints &&
                      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                  )}
                  onClick={() => setShowHints((prev) => !prev)}
                >
                  <Lightbulb className="mr-1.5 size-3.5 text-amber-500" />
                  <span>
                    {showHints
                      ? t("practiceHideHints")
                      : t("practiceShowHints")}
                  </span>
                  {showHints ? (
                    <ChevronUp className="ml-1 size-3.5" />
                  ) : (
                    <ChevronDown className="ml-1 size-3.5" />
                  )}
                </Button>
              ) : null}
            </div>

            {/* Expandable Details for Why and Hints */}
            <AnimatePresence>
              {showWhy && question.whyTheyAsk ? (
                <motion.div
                  key="why"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border-border/70 bg-muted/40 text-muted-foreground mt-2 rounded-lg border p-3 text-xs leading-relaxed">
                    <p className="text-foreground mb-1 font-semibold">
                      {t("why")}:
                    </p>
                    <p>{question.whyTheyAsk}</p>
                  </div>
                </motion.div>
              ) : null}

              {showHints && question.talkingPoints.length > 0 ? (
                <motion.div
                  key="hints"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border-border/70 text-muted-foreground mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed">
                    <p className="mb-1 flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                      <Lightbulb className="size-3.5" />
                      {t("talkingPoints")}
                    </p>
                    <ul className="list-disc space-y-1 pl-4">
                      {question.talkingPoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Center/Bottom Area: Voice Practice & Answer Input */}
          <div className="mt-6 flex flex-col gap-3">
            {/* Live voice recording state banner */}
            {isListening ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
                </span>
                <span>{t("voiceListening")}</span>
              </motion.div>
            ) : null}

            {/* Live voice transcript display */}
            <AnimatePresence>
              {effectiveAnswer ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="border-border bg-muted/30 relative rounded-xl border p-3.5"
                >
                  <div className="flex items-center justify-between gap-2 pb-1.5">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
                      <Volume2 className="text-primary size-3.5" />
                      {t("practiceYourAnswer")}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="size-7"
                      onClick={() => {
                        resetTranscript();
                        setUserAnswerDraft("");
                      }}
                      aria-label={t("voiceClear")}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                  <p className="text-foreground text-xs leading-relaxed whitespace-pre-wrap sm:text-sm">
                    {effectiveAnswer}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Optional typed text area */}
            {showTextarea ? (
              <Textarea
                value={userAnswerDraft}
                onChange={(e) => setUserAnswerDraft(e.target.value)}
                placeholder={t("practiceYourAnswerPlaceholder")}
                className="min-h-24 text-xs sm:text-sm"
              />
            ) : null}

            {/* Action buttons: Voice Mic + Text + Evaluate + Flip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                {isSpeechSupported ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={isListening ? "destructive" : "outline"}
                    className={cn(
                      "min-h-11 gap-1.5 px-3.5 text-xs font-medium transition-all sm:h-9",
                      isListening && "animate-pulse ring-2 ring-rose-500/40",
                    )}
                    onClick={toggleListening}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="size-4" />
                        <span>{t("voiceStop")}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="text-primary size-4" />
                        <span>{t("voiceStart")}</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-11 gap-1.5 px-3.5 text-xs font-medium sm:h-9"
                    onClick={() => {
                      setShowTextarea(true);
                      toast.info(t("voiceUnsupported"));
                    }}
                  >
                    <Mic className="text-muted-foreground size-4" />
                    <span>{t("voiceStart")}</span>
                  </Button>
                )}

                {!showTextarea ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-11 text-xs sm:h-9"
                    onClick={() => setShowTextarea(true)}
                  >
                    {t("practiceYourAnswer")}
                  </Button>
                ) : null}

                {effectiveAnswer.trim().length >= 5 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="min-h-11 gap-1.5 text-xs font-medium sm:h-9"
                    disabled={evaluateMutation.isPending}
                    onClick={() => void handleEvaluate()}
                  >
                    {evaluateMutation.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5 text-amber-500" />
                    )}
                    {evaluateMutation.isPending
                      ? t("evaluatingAi")
                      : t("evaluateAi")}
                  </Button>
                ) : null}
              </div>

              {/* Main Flip Trigger Button */}
              <Button
                type="button"
                size="default"
                className="min-h-11 w-full gap-2 font-medium sm:w-auto"
                onClick={onFlipToggle}
              >
                <span>{t("flipToAnswer")}</span>
                <RotateCw className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* BACK SIDE: MODEL ANSWER & SELF RATING */}
        <div
          className={cn(
            "border-border bg-card text-card-foreground absolute inset-0 flex min-h-[26rem] flex-col justify-between overflow-y-auto rounded-2xl border p-5 shadow-sm sm:min-h-[28rem] sm:p-7",
            !isFlipped ? "pointer-events-none invisible" : "visible",
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div>
            {/* Header: Label & Flip back */}
            <div className="flex items-center justify-between gap-2 border-b pb-3">
              <span className="text-primary flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                <CornerDownRight className="size-4" />
                {t("modelAnswer")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-11 gap-1.5 text-xs sm:h-8"
                onClick={onFlipToggle}
              >
                <RotateCw className="size-3.5" />
                <span>{t("flipToQuestion")}</span>
              </Button>
            </div>

            {/* AI Evaluation Box (if available) */}
            {evaluation ? (
              <div className="border-border bg-primary/5 mt-4 rounded-xl border p-4 text-xs leading-relaxed sm:text-sm">
                <div className="flex items-center justify-between gap-2 pb-2">
                  <span className="text-foreground flex items-center gap-1.5 font-semibold">
                    <Bot className="text-primary size-4" />
                    {t("aiFeedback")}
                  </span>
                  <span className="bg-primary/15 text-primary rounded-full px-2.5 py-0.5 text-xs font-bold">
                    {t("aiScore", { score: evaluation.score })}
                  </span>
                </div>
                <p className="text-muted-foreground font-medium">
                  {evaluation.verdict}
                </p>

                {evaluation.strengths.length > 0 ? (
                  <div className="mt-2.5">
                    <p className="text-foreground text-[11px] font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                      {t("aiStrengths")}
                    </p>
                    <ul className="text-muted-foreground mt-1 list-disc space-y-0.5 pl-4 text-xs">
                      {evaluation.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {evaluation.improvements.length > 0 ? (
                  <div className="mt-2.5">
                    <p className="text-foreground text-[11px] font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">
                      {t("aiImprovements")}
                    </p>
                    <ul className="text-muted-foreground mt-1 list-disc space-y-0.5 pl-4 text-xs">
                      {evaluation.improvements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Model Answer Body */}
            <div className="mt-4 text-sm leading-relaxed whitespace-pre-wrap sm:text-base">
              {question.modelAnswer}
            </div>

            {/* Evidence & Avoid Sections */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {question.evidenceFromCv.length > 0 ? (
                <div className="border-border bg-muted/20 rounded-lg border p-3">
                  <p className="text-foreground mb-1.5 flex items-center gap-1 text-xs font-semibold">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    {t("evidence")}
                  </p>
                  <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-xs">
                    {question.evidenceFromCv.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {question.avoid.length > 0 ? (
                <div className="border-border bg-muted/20 rounded-lg border p-3">
                  <p className="text-foreground mb-1.5 flex items-center gap-1 text-xs font-semibold">
                    <AlertCircle className="size-3.5 text-rose-500" />
                    {t("avoid")}
                  </p>
                  <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-xs">
                    {question.avoid.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          {/* Self-Rating Row */}
          <div className="border-border mt-6 border-t pt-4">
            <p className="text-muted-foreground mb-2 text-center text-xs font-medium sm:text-left">
              {t("practiceRate")}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ButtonGroup
                aria-label={t("practiceRate")}
                className="w-full sm:w-auto"
              >
                {(
                  [
                    ["again", t("practiceRateAgain"), "text-rose-500"],
                    ["ok", t("practiceRateOk"), "text-amber-500"],
                    ["solid", t("practiceRateSolid"), "text-emerald-500"],
                  ] as const
                ).map(([value, label]) => {
                  const selected = rating === value;
                  return (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      className="min-h-11 flex-1 text-xs font-medium sm:h-9 sm:flex-initial"
                      onClick={() => onRate(value)}
                    >
                      {value === "solid" && selected ? (
                        <CheckCircle2 className="mr-1 size-3.5" />
                      ) : null}
                      {label}
                    </Button>
                  );
                })}
              </ButtonGroup>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-11 text-xs sm:h-9"
                onClick={onFlipToggle}
              >
                {t("flipToQuestion")}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
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
    <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase">
      {t(`category.${category}`)}
    </span>
  );
}
