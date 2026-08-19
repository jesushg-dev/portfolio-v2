import type { Locale } from "../../src/i18n/config";

export const localeSnapshots: Record<
  Locale,
  {
    navAbout: string;
    aboutSnippet: string;
    skillsTabBackend: string;
  }
> = {
  en: {
    navAbout: "About me",
    aboutSnippet: "Fullstack Lead",
    skillsTabBackend: "Backend",
  },
  es: {
    navAbout: "Sobre mí",
    aboutSnippet: "Líder Fullstack",
    skillsTabBackend: "Backend",
  },
  nl: {
    navAbout: "Over mij",
    aboutSnippet: "Fullstack Lead",
    skillsTabBackend: "Backend",
  },
};

export const localeNativeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  nl: "Nederlands",
};
