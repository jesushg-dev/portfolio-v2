"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  knownTechnologySpellings,
  literalVacancyTerm,
  technologyNameKey,
  vacancySkillSuggestions,
} from "../lib/extract-job-tools";

interface VacancySkillConfirmationProps {
  vacancy: string;
  declared: string[];
  confirmed: string[];
  suggestions: string[];
  onChange: (names: string[]) => void;
}

export function VacancySkillConfirmation({
  vacancy,
  declared,
  confirmed,
  suggestions,
  onChange,
}: VacancySkillConfirmationProps) {
  const t = useTranslations("admin.resumeStudio");
  const id = useId();
  const [custom, setCustom] = useState("");
  const candidates = [
    ...new Set([
      ...vacancySkillSuggestions(vacancy, declared, suggestions),
      ...confirmed,
    ]),
  ];
  const customMatch =
    !knownTechnologySpellings(declared, [custom]).has(
      technologyNameKey(custom),
    ) && literalVacancyTerm(vacancy, custom);
  if (vacancy.length < 20) return null;
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
    </fieldset>
  );
}
