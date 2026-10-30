import type { Locale } from "@/i18n/config";
import { getEmploymentTypeLabel } from "./employment-type";

export const RESUME_LABELS = {
  en: {
    summary: "About me",
    experience: "Professional experience",
    education: "Education",
    skills: "Technical skills",
    languages: "Languages",
    availability: "Availability",
    contact: "Contact",
    certifications: "Certifications",
    schedule: "Schedule a call",
    present: "Present",
    FRONTEND: "Frontend",
    BACKEND: "Backend",
    DATABASE: "Databases",
    TOOLS: "Tools",
    MOBILE: "Mobile",
    DESKTOP: "Desktop",
    DEVOPS: "Cloud & DevOps",
    CYBERSECURITY: "Cybersecurity",
    OTHER: "Other",
  },
  es: {
    summary: "Sobre mí",
    experience: "Experiencia laboral",
    education: "Educación",
    skills: "Habilidades técnicas",
    languages: "Idiomas",
    availability: "Disponibilidad",
    contact: "Contacto",
    certifications: "Certificaciones",
    schedule: "Agendar una llamada",
    present: "Actualidad",
    FRONTEND: "Frontend",
    BACKEND: "Backend",
    DATABASE: "Bases de datos",
    TOOLS: "Herramientas",
    MOBILE: "Móvil",
    DESKTOP: "Escritorio",
    DEVOPS: "Nube y DevOps",
    CYBERSECURITY: "Ciberseguridad",
    OTHER: "Otros",
  },
  nl: {
    summary: "Over mij",
    experience: "Werkervaring",
    education: "Opleiding",
    skills: "Technische vaardigheden",
    languages: "Talen",
    availability: "Beschikbaarheid",
    contact: "Contact",
    certifications: "Certificeringen",
    schedule: "Plan een gesprek",
    present: "Heden",
    FRONTEND: "Frontend",
    BACKEND: "Backend",
    DATABASE: "Databases",
    TOOLS: "Tools",
    MOBILE: "Mobiel",
    DESKTOP: "Desktop",
    DEVOPS: "Cloud & DevOps",
    CYBERSECURITY: "Cyberbeveiliging",
    OTHER: "Overige",
  },
} as const;

export function resumeDate(value: string | undefined, locale: Locale): string {
  if (!value) return "";
  if (/^\d{4}$/.test(value)) return value;
  const date = new Date(value.length === 7 ? `${value}-01T00:00:00Z` : value);
  if (Number.isNaN(date.getTime()))
    throw new Error(`Invalid resume date: ${value}`);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
export function resumeDates(
  item: { startDate?: string; endDate?: string; current?: boolean },
  locale: Locale,
): string {
  return [
    resumeDate(item.startDate, locale),
    item.current
      ? RESUME_LABELS[locale].present
      : resumeDate(item.endDate, locale),
  ]
    .filter(Boolean)
    .join(" – ");
}
export { getEmploymentTypeLabel };
