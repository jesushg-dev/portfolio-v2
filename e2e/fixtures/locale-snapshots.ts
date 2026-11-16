import type { Locale } from "../../src/i18n/config";

export const localeSnapshots: Record<
  Locale,
  {
    navAbout: string;
    servicesSnippet: string;
  }
> = {
  en: {
    navAbout: "About me",
    servicesSnippet: "Engineering expertise",
  },
  es: {
    navAbout: "Sobre mí",
    servicesSnippet: "Experiencia en ingeniería",
  },
  nl: {
    navAbout: "Over mij",
    servicesSnippet: "Technische expertise",
  },
};

export const localeNativeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  nl: "Nederlands",
};
