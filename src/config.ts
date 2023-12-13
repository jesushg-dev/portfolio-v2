import {Pathnames} from 'next-intl/navigation';

export const locales = ['en', 'es', 'nl'] as const;

export const pathnames = {
  '/': '/',
  '/about': {
    en: '/about',
    es: '/acerca',
    nl: '/over',
  },
} satisfies Pathnames<typeof locales>;

// Use the default: `always`
export const localePrefix = undefined;

export type AppPathnames = keyof typeof pathnames;
