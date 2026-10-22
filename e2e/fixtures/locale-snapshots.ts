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
    aboutSnippet:
      "Computer Engineer and Senior Fullstack Developer with 6+ years",
    skillsTabBackend: "Backend",
  },
  es: {
    navAbout: "Sobre mí",
    aboutSnippet:
      "Ingeniero en Computación y Senior Fullstack Developer con 6+ años",
    skillsTabBackend: "Backend",
  },
  nl: {
    navAbout: "Over mij",
    aboutSnippet: "Computer Engineer en Senior Fullstack Developer met 6+ jaar",
    skillsTabBackend: "Backend",
  },
};

export const localeNativeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  nl: "Nederlands",
};
