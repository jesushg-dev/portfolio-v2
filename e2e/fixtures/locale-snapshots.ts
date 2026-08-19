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
    aboutSnippet: "Senior Software Engineer with 6+ years",
    skillsTabBackend: "Backend",
  },
  es: {
    navAbout: "Sobre mí",
    aboutSnippet: "Senior Software Engineer con +6 años",
    skillsTabBackend: "Backend",
  },
  nl: {
    navAbout: "Over mij",
    aboutSnippet: "Senior Software Engineer met 6+ jaar",
    skillsTabBackend: "Backend",
  },
};

export const localeNativeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  nl: "Nederlands",
};
