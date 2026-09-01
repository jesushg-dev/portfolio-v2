"use client";

import { useMemo, useState, type FC } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import type { InterviewPrepStoredQuestion } from "@/features/resume-engine/lib/interview-prep-result";

interface InterviewPrepTechnicalQuestionnaireProps {
  questions: InterviewPrepStoredQuestion[];
}

export const InterviewPrepTechnicalQuestionnaire: FC<
  InterviewPrepTechnicalQuestionnaireProps
> = ({ questions }) => {
  const t = useTranslations("admin.jobTracker.interviewPrep");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const items = useMemo(
    () =>
      questions.map((question) => ({
        name: question.id,
        required: question.talkingPoints.length > 0,
        choices: question.talkingPoints.map((_, index) => ({
          value: String(index),
        })),
      })),
    [questions],
  );

  if (questions.length === 0) return null;

  return (
    <Questionnaire
      items={items}
      shortcuts="letters"
      className="border-border rounded-xl border p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <QuestionnaireProgress />
      {questions.map((question) => (
        <QuestionnaireItem
          key={question.id}
          name={question.id}
          required={question.talkingPoints.length > 0}
          multiple={question.talkingPoints.length > 1}
        >
          <QuestionnaireTitle>{question.question}</QuestionnaireTitle>
          <QuestionnaireDescription>
            {question.whyTheyAsk}
          </QuestionnaireDescription>
          {question.talkingPoints.length > 0 ? (
            <QuestionnaireChoices>
              <p className="text-muted-foreground col-span-full text-xs font-medium">
                {t("practiceTalkingPoints")}
              </p>
              {question.talkingPoints.map((point, index) => (
                <QuestionnaireChoice key={point} value={String(index)}>
                  <span className="font-medium">{point}</span>
                </QuestionnaireChoice>
              ))}
            </QuestionnaireChoices>
          ) : null}
          <QuestionnaireError />
          <div>
            <Button
              type="button"
              size="sm"
              variant={revealed[question.id] ? "outline" : "default"}
              onClick={() =>
                setRevealed((current) => ({
                  ...current,
                  [question.id]: !current[question.id],
                }))
              }
            >
              {revealed[question.id] ? (
                <EyeOff className="mr-1.5 size-3.5" aria-hidden />
              ) : (
                <Eye className="mr-1.5 size-3.5" aria-hidden />
              )}
              {revealed[question.id]
                ? t("practiceHideAnswer")
                : t("practiceReveal")}
            </Button>
            {revealed[question.id] ? (
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed whitespace-pre-wrap">
                {question.modelAnswer}
              </p>
            ) : null}
          </div>
        </QuestionnaireItem>
      ))}
      <QuestionnaireActions className="flex w-full items-center justify-between gap-2">
        <QuestionnairePrevious size="sm">
          {t("practicePrev")}
        </QuestionnairePrevious>
        <ButtonGroup aria-label={t("practiceActions")}>
          <QuestionnaireSkip size="sm">{t("practiceSkip")}</QuestionnaireSkip>
          <QuestionnaireNext size="sm">{t("practiceNext")}</QuestionnaireNext>
          <QuestionnaireSubmit size="sm">
            {t("practiceDone")}
          </QuestionnaireSubmit>
        </ButtonGroup>
      </QuestionnaireActions>
    </Questionnaire>
  );
};
