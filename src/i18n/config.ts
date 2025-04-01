import type { Pathnames } from "next-intl/routing";

export const locales = ["en", "es", "nl"] as const;

export const localsDisplay: Record<Locale, string> = {
  en: "English",
  es: "Español",
  nl: "Nederlands",
} as const;

export type Locale = (typeof locales)[number];

export const pathnames = {
  "/": "/",
  "/about": {
    en: "/about",
    es: "/acerca",
    nl: "/over",
  },
  "/curriculum-vitae": "/curriculum-vitae",
  "/eleven-portfolio": {
    en: "/eleven-portfolio",
    es: "/eleven-portafolio",
    nl: "/eleven-portefeuille",
  },
  "/certificates": {
    en: "/certificates",
    es: "/certificados",
    nl: "/certificaten",
  },
  "/certificates/frontend": {
    en: "/certificates/frontend",
    es: "/certificados/frontend",
    nl: "/certificaten/frontend",
  },
  "/certificates/backend": {
    en: "/certificates/backend",
    es: "/certificados/backend",
    nl: "/certificaten/backend",
  },
  "/certificates/cybersecurity": {
    en: "/certificates/cybersecurity",
    es: "/certificados/ciberseguridad",
    nl: "/certificaten/cyberveiligheid",
  },
  "/certificates/softskills": {
    en: "/certificates/softskills",
    es: "/certificados/habilidades",
    nl: "/certificaten/vaardigheden",
  },
} satisfies Pathnames<typeof locales>;

export const defaultLocale: Locale = "en";
