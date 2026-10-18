import { z } from "zod";
import type { CvEmploymentType } from "@prisma/client";
import type { Locale } from "@/i18n/config";

export const CV_EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "FREELANCE",
  "INTERNSHIP",
] as const;

export const CvEmploymentTypeSchema = z.enum(CV_EMPLOYMENT_TYPES);

export const EMPLOYMENT_TYPE_LABELS: Record<
  Locale,
  Record<CvEmploymentType, string>
> = {
  es: {
    FULL_TIME: "Tiempo completo",
    PART_TIME: "Medio tiempo",
    CONTRACT: "Contrato",
    FREELANCE: "Freelance",
    INTERNSHIP: "Prácticas",
  },
  en: {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    CONTRACT: "Contract",
    FREELANCE: "Freelance",
    INTERNSHIP: "Internship",
  },
  nl: {
    FULL_TIME: "Voltijd",
    PART_TIME: "Deeltijd",
    CONTRACT: "Contract",
    FREELANCE: "Freelance",
    INTERNSHIP: "Stage",
  },
};

export function normalizeEmploymentType(
  raw: string | null | undefined,
): CvEmploymentType {
  if (!raw) return "FULL_TIME";
  const normalized = raw
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, "_");
  if (normalized in EMPLOYMENT_TYPE_LABELS.en) {
    return normalized as CvEmploymentType;
  }
  return "FULL_TIME";
}

export function getEmploymentTypeLabel(
  type: string | null | undefined,
  locale: Locale,
): string {
  const normalized = normalizeEmploymentType(type);
  return (
    EMPLOYMENT_TYPE_LABELS[locale]?.[normalized] ??
    EMPLOYMENT_TYPE_LABELS.en[normalized] ??
    "Full-time"
  );
}
