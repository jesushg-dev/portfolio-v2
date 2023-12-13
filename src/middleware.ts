import createMiddleware from 'next-intl/middleware';
import {pathnames, locales, localePrefix} from './config';

export default createMiddleware({
  defaultLocale: 'en',
  locales,
  pathnames,
  localePrefix
});

export const config = {
  // Match only internationalized pathnames
//  matcher: ['/', '/(de|en)/:path*']
  // Skip all paths that should not be internationalized
  
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
