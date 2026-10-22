"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormItem } from "@/components/shared/form-root";
import {
  CaseStudySectionSchema,
  type CaseStudyContentDTO,
  type CaseStudySectionDTO,
} from "../lib/case-study";

interface CaseStudyNarrativeEditorProps {
  value: CaseStudyContentDTO;
  onChange: (value: CaseStudyContentDTO) => void;
  onBlur: () => void;
}

export function CaseStudyNarrativeEditor({
  value,
  onChange,
  onBlur,
}: CaseStudyNarrativeEditorProps) {
  const t = useTranslations("admin.forms.project");
  const id = useId();

  function updateSection(index: number, patch: Partial<CaseStudySectionDTO>) {
    onChange({
      ...value,
      sections: value.sections.map((section, current) =>
        current === index ? { ...section, ...patch } : section,
      ),
    });
  }

  function addSection() {
    let index = value.sections.length + 1;
    while (value.sections.some((section) => section.key === `section-${index}`))
      index++;
    onChange({
      ...value,
      sections: [
        ...value.sections,
        CaseStudySectionSchema.parse({
          key: `section-${index}`,
          kind: "CARDS",
          title: t("newCaseStudySection"),
        }),
      ],
    });
  }

  return (
    <div className="space-y-4" onBlur={onBlur}>
      <p className="font-semibold">{t("caseStudyContent")}</p>
      <FormItem label={t("caseStudyContext")} inputId={`${id}-context`}>
        <Textarea
          id={`${id}-context`}
          rows={3}
          value={value.context}
          onChange={(event) =>
            onChange({ ...value, context: event.target.value })
          }
        />
      </FormItem>
      {value.sections.map((section, index) => (
        <div
          key={section.key}
          className="border-border space-y-3 rounded-xl border p-4"
        >
          <FormItem
            label={t("caseStudySectionTitle")}
            inputId={`${id}-${section.key}-title`}
          >
            <Input
              id={`${id}-${section.key}-title`}
              value={section.title}
              onChange={(event) =>
                updateSection(index, { title: event.target.value })
              }
            />
          </FormItem>
          <FormItem
            label={t("caseStudySectionLead")}
            inputId={`${id}-${section.key}-lead`}
          >
            <Textarea
              id={`${id}-${section.key}-lead`}
              rows={4}
              value={section.lead}
              onChange={(event) =>
                updateSection(index, { lead: event.target.value })
              }
            />
          </FormItem>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange({
                ...value,
                sections: value.sections.filter(
                  (_, current) => current !== index,
                ),
              })
            }
          >
            {t("removeCaseStudySection")}
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addSection}>
        {t("addCaseStudySection")}
      </Button>
    </div>
  );
}
