import type { Pathnames } from "next-intl/routing";

export const locales = ["en", "es", "nl"] as const;

export const localsDisplay: Record<Locale, string> = {
  en: "English",
  es: "Español",
  nl: "Nederlands",
} as const;

export const appLocales = [
  { value: "es", label: "Español", img: "spanish_flag_k7ij7d.webp" },
  { value: "en", label: "English", img: "english_flag_xeqq0r.webp" },
  { value: "nl", label: "Nederlands", img: "dutch_flag_lv5lyh.webp" },
] satisfies { value: Locale; label: string; img: string }[];

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
  "/skills/[slug]": {
    en: "/skills/[slug]",
    es: "/habilidades/[slug]",
    nl: "/vaardigheden/[slug]",
  },
  "/timeline": {
    en: "/timeline",
    es: "/linea-de-tiempo",
    nl: "/tijdlijn",
  },
  "/admin": {
    en: "/admin",
    es: "/panel",
    nl: "/admin",
  },
  "/admin/profile": {
    en: "/admin/profile",
    es: "/panel/perfil",
    nl: "/admin/profile",
  },
  "/admin/profile/about-me": {
    en: "/admin/profile/about-me",
    es: "/panel/perfil/sobre-mi",
    nl: "/admin/profile/over-mij",
  },
  "/admin/profile/console": {
    en: "/admin/profile/console",
    es: "/panel/perfil/consola",
    nl: "/admin/profile/console",
  },
  "/admin/about": {
    en: "/admin/about",
    es: "/panel/sobre",
    nl: "/admin/about",
  },
  "/admin/skills": {
    en: "/admin/skills",
    es: "/panel/habilidades",
    nl: "/admin/skills",
  },
  "/admin/projects": {
    en: "/admin/projects",
    es: "/panel/proyectos",
    nl: "/admin/projects",
  },
  "/admin/services": {
    en: "/admin/services",
    es: "/panel/servicios",
    nl: "/admin/services",
  },
  "/admin/certifications": {
    en: "/admin/certifications",
    es: "/panel/certificaciones",
    nl: "/admin/certifications",
  },
  "/admin/settings": {
    en: "/admin/settings",
    es: "/panel/configuracion",
    nl: "/admin/settings",
  },
  "/admin/cv": {
    en: "/admin/cv",
    es: "/panel/cv",
    nl: "/admin/cv",
  },
  "/admin/timeline": {
    en: "/admin/timeline",
    es: "/panel/timeline",
    nl: "/admin/timeline",
  },
  "/admin/timeline/new": {
    en: "/admin/timeline/new",
    es: "/panel/timeline/nuevo",
    nl: "/admin/timeline/new",
  },
  "/admin/timeline/[id]/edit": {
    en: "/admin/timeline/[id]/edit",
    es: "/panel/timeline/[id]/editar",
    nl: "/admin/timeline/[id]/edit",
  },
} satisfies Pathnames<typeof locales>;

export const defaultLocale: Locale = "en";
