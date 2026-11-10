import type { Locale } from "../../src/i18n/config";

export const localeSnapshots: Record<
  Locale,
  {
    navAbout: string;
    servicesSnippet: string;
    skillsTabBackend: string;
  }
> = {
  en: {
    navAbout: "About me",
    servicesSnippet: "Engineering expertise",
    skillsTabBackend: "Backend",
  },
  es: {
    navAbout: "Sobre mí",
    servicesSnippet: "Experiencia en ingeniería",
    skillsTabBackend: "Backend",
  },
  nl: {
    navAbout: "Over mij",
    servicesSnippet: "Technische expertise",
    skillsTabBackend: "Backend",
  },
};

export const localeNativeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  nl: "Nederlands",
};
