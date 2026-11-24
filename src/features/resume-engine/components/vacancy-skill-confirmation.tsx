"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  knownTechnologySpellings,
  literalVacancyTerm,
  technologyNameKey,
  vacancySkillSuggestions,
  type TechnologyEquivalence,
} from "../lib/extract-job-tools";

export interface SavedTechnologyEquivalence extends TechnologyEquivalence {
  id: string;
}

type ResumeStudioTranslate = ReturnType<
  typeof useTranslations<"admin.resumeStudio">
>;

interface VacancySkillConfirmationProps {
  vacancy: string;
  declared: string[];
  confirmed: string[];
  equivalences?: TechnologyEquivalence[];
  savedEquivalences?: SavedTechnologyEquivalence[];
  suggestions: string[];
  isRemovingEquivalence?: boolean;
  onChange: (names: string[]) => void;
  onRemoveSavedEquivalence?: (id: string) => void;
}

export function VacancySkillConfirmation({
  vacancy,
  declared,
  confirmed,
  equivalences = [],
  savedEquivalences = [],
  suggestions,
  isRemovingEquivalence = false,
  onChange,
  onRemoveSavedEquivalence,
}: VacancySkillConfirmationProps) {
  const t = useTranslations("admin.resumeStudio");
  const id = useId();
  const [custom, setCustom] = useState("");
  const allEquivalences = [...savedEquivalences, ...equivalences];
  const candidates = [
    ...new Set([
      ...vacancySkillSuggestions(
        vacancy,
        declared,
        suggestions,
        allEquivalences,
      ),
      ...confirmed,
    ]),
  ];
  const customMatch =
    !knownTechnologySpellings(declared, [custom], allEquivalences).has(
      technologyNameKey(custom),
    ) && literalVacancyTerm(vacancy, custom);
  if (vacancy.length < 20) {
    return savedEquivalences.length > 0 ? (
      <SavedEquivalencesDetails
        t={t}
        items={savedEquivalences}
        disabled={isRemovingEquivalence}
        onRemove={onRemoveSavedEquivalence}
      />
    ) : null;
  }
  return (
    <fieldset className="flex flex-col gap-2 rounded-md border p-3">
      <legend className="px-1 text-sm font-medium">
        {t("vacancySkillsTitle")}
      </legend>
      <p className="text-muted-foreground text-sm">{t("vacancySkillsHint")}</p>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {candidates.map((name) => (
          <label key={name} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={confirmed.includes(name)}
              disabled={!confirmed.includes(name) && confirmed.length >= 32}
              onCheckedChange={(checked) =>
                onChange(
                  checked
                    ? [...confirmed, name]
                    : confirmed.filter((item) => item !== name),
                )
              }
            />
            {name}
          </label>
        ))}
      </div>
      <label htmlFor={id} className="text-sm">
        {t("vacancySkillsCustom")}
      </label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={custom}
          maxLength={80}
          onChange={(event) => setCustom(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={
            !customMatch ||
            confirmed.includes(customMatch) ||
            confirmed.length >= 32
          }
          onClick={() => {
            if (customMatch) onChange([...confirmed, customMatch]);
            setCustom("");
          }}
        >
          {t("vacancySkillsConfirm")}
        </Button>
      </div>
      {savedEquivalences.length > 0 ? (
        <SavedEquivalencesDetails
          t={t}
          items={savedEquivalences}
          disabled={isRemovingEquivalence}
          onRemove={onRemoveSavedEquivalence}
        />
      ) : null}
    </fieldset>
  );
}

function SavedEquivalencesDetails({
  t,
  items,
  disabled,
  onRemove,
}: {
  t: ResumeStudioTranslate;
  items: SavedTechnologyEquivalence[];
  disabled: boolean;
  onRemove?: (id: string) => void;
}) {
  return (
    <details className="mt-1">
      <summary className="text-muted-foreground cursor-pointer text-sm">
        {t("savedEquivalencesSummary", { count: items.length })}
      </summary>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="border-border bg-muted/40 text-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm"
          >
            <span>
              {item.original} → {item.proposed}
            </span>
            {onRemove ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onRemove(item.id)}
                aria-label={t("removeSavedEquivalence", {
                  original: item.original,
                  proposed: item.proposed,
                })}
                className="text-muted-foreground hover:text-destructive inline-flex size-5 items-center justify-center rounded-full disabled:opacity-50"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}
