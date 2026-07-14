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
  "/curriculum-vitae": {
    en: "/curriculum-vitae",
    es: "/curriculum-vitae",
    nl: "/curriculum-vitae",
  },
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
  "/projects/[slug]": {
    en: "/projects/[slug]",
    es: "/proyectos/[slug]",
    nl: "/projecten/[slug]",
  },
  "/timeline": {
    en: "/timeline",
    es: "/linea-de-tiempo",
    nl: "/tijdlijn",
  },
  "/privacy": {
    en: "/privacy",
    es: "/privacidad",
    nl: "/privacy",
  },
  "/login": {
    en: "/login",
    es: "/iniciar-sesion",
    nl: "/inloggen",
  },
  "/register": {
    en: "/register",
    es: "/registrarse",
    nl: "/registreren",
  },
  "/forgot-password": {
    en: "/forgot-password",
    es: "/olvidar-contrasena",
    nl: "/wachtwoord-vergeten",
  },
  "/reset-password": {
    en: "/reset-password",
    es: "/restablecer-contrasena",
    nl: "/wachtwoord-herstellen",
  },
  "/admin": {
    en: "/admin",
    es: "/panel",
    nl: "/beheer",
  },
  "/admin/profile": {
    en: "/admin/profile",
    es: "/panel/perfil",
    nl: "/beheer/profiel",
  },
  "/admin/profile/about-me": {
    en: "/admin/profile/about-me",
    es: "/panel/perfil/sobre-mi",
    nl: "/beheer/profiel/over-mij",
  },
  "/admin/profile/console": {
    en: "/admin/profile/console",
    es: "/panel/perfil/consola",
    nl: "/beheer/profiel/console",
  },
  "/admin/about": {
    en: "/admin/about",
    es: "/panel/sobre",
    nl: "/beheer/over",
  },
  "/admin/skills": {
    en: "/admin/skills",
    es: "/panel/habilidades",
    nl: "/beheer/vaardigheden",
  },
  "/admin/projects": {
    en: "/admin/projects",
    es: "/panel/proyectos",
    nl: "/beheer/projecten",
  },
  "/admin/services": {
    en: "/admin/services",
    es: "/panel/servicios",
    nl: "/beheer/diensten",
  },
  "/admin/certifications": {
    en: "/admin/certifications",
    es: "/panel/certificaciones",
    nl: "/beheer/certificeringen",
  },
  "/admin/spotify": {
    en: "/admin/spotify",
    es: "/panel/spotify",
    nl: "/beheer/spotify",
  },
  "/admin/settings": {
    en: "/admin/settings",
    es: "/panel/configuracion",
    nl: "/beheer/instellingen",
  },
  "/admin/cv": {
    en: "/admin/cv",
    es: "/panel/cv",
    nl: "/beheer/cv",
  },
  "/admin/timeline": {
    en: "/admin/timeline",
    es: "/panel/linea-de-tiempo",
    nl: "/beheer/tijdlijn",
  },
  "/admin/timeline/new": {
    en: "/admin/timeline/new",
    es: "/panel/linea-de-tiempo/nuevo",
    nl: "/beheer/tijdlijn/nieuw",
  },
  "/admin/timeline/[id]/edit": {
    en: "/admin/timeline/[id]/edit",
    es: "/panel/linea-de-tiempo/[id]/editar",
    nl: "/beheer/tijdlijn/[id]/bewerken",
  },
  "/admin/soft-skills": {
    en: "/admin/soft-skills",
    es: "/panel/habilidades-blandas",
    nl: "/beheer/softe-vaardigheden",
  },
  "/admin/soft-skills/new": {
    en: "/admin/soft-skills/new",
    es: "/panel/habilidades-blandas/nuevo",
    nl: "/beheer/softe-vaardigheden/nieuw",
  },
  "/admin/soft-skills/settings": {
    en: "/admin/soft-skills/settings",
    es: "/panel/habilidades-blandas/configuracion",
    nl: "/beheer/softe-vaardigheden/instellingen",
  },
  "/admin/soft-skills/[id]/edit": {
    en: "/admin/soft-skills/[id]/edit",
    es: "/panel/habilidades-blandas/[id]/editar",
    nl: "/beheer/softe-vaardigheden/[id]/bewerken",
  },
} satisfies Pathnames<typeof locales>;

export const defaultLocale: Locale = "en";
