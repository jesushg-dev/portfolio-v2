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
  "/schedule": {
    en: "/schedule",
    es: "/agendar",
    nl: "/plannen",
  },
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
  "/process/[slug]": {
    en: "/process/[slug]",
    es: "/proceso/[slug]",
    nl: "/proces/[slug]",
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
  "/theme-customizer": {
    en: "/theme-customizer",
    es: "/personalizar-tema",
    nl: "/thematool",
  },
  "/uses": {
    en: "/uses",
    es: "/uses",
    nl: "/uses",
  },
  "/now": {
    en: "/now",
    es: "/now",
    nl: "/now",
  },
  "/colophon": {
    en: "/colophon",
    es: "/colofon",
    nl: "/colofon",
  },
  "/stats": {
    en: "/stats",
    es: "/estadisticas",
    nl: "/statistieken",
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
  "/two-factor": {
    en: "/two-factor",
    es: "/verificacion-en-dos-pasos",
    nl: "/tweestapsverificatie",
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
  "/admin/uses": {
    en: "/admin/uses",
    es: "/panel/uses",
    nl: "/beheer/uses",
  },
  "/admin/uses/new": {
    en: "/admin/uses/new",
    es: "/panel/uses/nuevo",
    nl: "/beheer/uses/nieuw",
  },
  "/admin/uses/[id]/edit": {
    en: "/admin/uses/[id]/edit",
    es: "/panel/uses/[id]/editar",
    nl: "/beheer/uses/[id]/bewerken",
  },
  "/admin/now": {
    en: "/admin/now",
    es: "/panel/now",
    nl: "/beheer/now",
  },
  "/admin/now/focuses/new": {
    en: "/admin/now/focuses/new",
    es: "/panel/now/focuses/nuevo",
    nl: "/beheer/now/focuses/nieuw",
  },
  "/admin/now/focuses/[id]/edit": {
    en: "/admin/now/focuses/[id]/edit",
    es: "/panel/now/focuses/[id]/editar",
    nl: "/beheer/now/focuses/[id]/bewerken",
  },
  "/admin/process-pages": {
    en: "/admin/process-pages",
    es: "/panel/paginas-de-proceso",
    nl: "/beheer/procespaginas",
  },
  "/admin/process-pages/new": {
    en: "/admin/process-pages/new",
    es: "/panel/paginas-de-proceso/nuevo",
    nl: "/beheer/procespaginas/nieuw",
  },
  "/admin/process-pages/[id]/edit": {
    en: "/admin/process-pages/[id]/edit",
    es: "/panel/paginas-de-proceso/[id]/editar",
    nl: "/beheer/procespaginas/[id]/bewerken",
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
  "/admin/job-tracker": {
    en: "/admin/job-tracker",
    es: "/panel/seguimiento-laboral",
    nl: "/beheer/vacature-tracker",
  },
  "/admin/job-tracker/applications/new": {
    en: "/admin/job-tracker/applications/new",
    es: "/panel/seguimiento-laboral/postulaciones/nuevo",
    nl: "/beheer/vacature-tracker/sollicitaties/nieuw",
  },
  "/admin/job-tracker/applications/[id]": {
    en: "/admin/job-tracker/applications/[id]",
    es: "/panel/seguimiento-laboral/postulaciones/[id]",
    nl: "/beheer/vacature-tracker/sollicitaties/[id]",
  },
  "/admin/job-tracker/applications/[id]/edit": {
    en: "/admin/job-tracker/applications/[id]/edit",
    es: "/panel/seguimiento-laboral/postulaciones/[id]/editar",
    nl: "/beheer/vacature-tracker/sollicitaties/[id]/bewerken",
  },
  "/admin/job-tracker/applications/[id]/events/[eventId]": {
    en: "/admin/job-tracker/applications/[id]/events/[eventId]",
    es: "/panel/seguimiento-laboral/postulaciones/[id]/eventos/[eventId]",
    nl: "/beheer/vacature-tracker/sollicitaties/[id]/evenementen/[eventId]",
  },
  "/admin/job-tracker/companies/new": {
    en: "/admin/job-tracker/companies/new",
    es: "/panel/seguimiento-laboral/empresas/nuevo",
    nl: "/beheer/vacature-tracker/bedrijven/nieuw",
  },
  "/admin/job-tracker/companies/[id]/edit": {
    en: "/admin/job-tracker/companies/[id]/edit",
    es: "/panel/seguimiento-laboral/empresas/[id]/editar",
    nl: "/beheer/vacature-tracker/bedrijven/[id]/bewerken",
  },
  "/admin/job-tracker/events/new": {
    en: "/admin/job-tracker/events/new",
    es: "/panel/seguimiento-laboral/eventos/nuevo",
    nl: "/beheer/vacature-tracker/evenementen/nieuw",
  },
  "/admin/credentials": {
    en: "/admin/credentials",
    es: "/panel/credenciales",
    nl: "/beheer/inloggegevens",
  },
  "/admin/credentials/[provider]": {
    en: "/admin/credentials/[provider]",
    es: "/panel/credenciales/[provider]",
    nl: "/beheer/inloggegevens/[provider]",
  },
} satisfies Pathnames<typeof locales>;

export const defaultLocale: Locale = "en";
