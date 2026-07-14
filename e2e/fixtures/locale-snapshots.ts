import type { Locale } from "../../src/i18n/config";

export const localeSnapshots: Record<
  Locale,
  {
    navHome: string;
    aboutSnippet: string;
    skillsTabBackend: string;
  }
> = {
  en: {
    navHome: "Home",
    aboutSnippet: "Fullstack Lead",
    skillsTabBackend: "Backend",
  },
  es: {
    navHome: "Inicio",
    aboutSnippet: "Líder Fullstack",
    skillsTabBackend: "Backend",
  },
  nl: {
    navHome: "Start",
    aboutSnippet: "Fullstack Lead",
    skillsTabBackend: "Backend",
  },
};

export const localeNativeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  nl: "Nederlands",
};
