# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

Entries below **3.0.0** are historical. Current `package.json` is **3.0.0** on
**Next.js 16.3**, **React 19**, **TypeScript 6**, **Tailwind CSS 4**, **pnpm 10**.
See [README](./README.md) and [docs/README.md](./docs/README.md).

## Unreleased

### Docs

- Replaced the stale README (Next.js 13 / Mongoose) with the current stack, pnpm
  install steps, env table, and a documentation index.
- Added architecture, security, analytics, admin CMS, Job Tracker, Resume Engine,
  public pages, i18n, seed/export, email-template, and media guides.
- Email templates and compiled HTML use jesushg.com (not jehg.dev).

### Security

- Bind analytics collect and tenant resolution to Host; HMAC-proof PDF tenant
  header; stop logging reset tokens in production; rate-limit collect and contact;
  ignore PDF `baseUrl` from clients; HTTPS-only `next/image` catch-all.

## 3.0.0 (2025-04-01)

### Features

- Upgraded to Next.js 15
- Added support for React 18
- Added support for TypeScript 5.0
- Added support for Tailwind CSS 4.0
- Added support for new i18n features in Next.js 15

## 2.7.3 (2023-02-06)

- Disable particles.js in the home page due performance issues
- Add animation to title section in the home page
- Remove `react-marquee` dependency and use motion/react to create the marquee effect

## 2.7.2 (2024-02-06)

- Add internationalization support for certifications and courses
- Fix a bug with libraries

## 2.7.1 (2023-12-25)

- Add beta window simulation for showing the website in windows 11 style

## 2.6.1 (2023-12-25)

- Remove dependency: `react-grid-layout` and using `@dnd-kit` as a replacement
- Add stable window managment for win emulation

## 2.5.5 (2023-12-22)

- Update Dependencies to latest version to fix security issues and improve performance
- Remove TypeWriter component from the project
- Improve i18n configuration
- Update Particles.js to latest version
- Fix theme preview in the theme selector component and add Christmas theme
- Improve skills section with new design and new data structure
- Add new theme: `Christmas`

## 2.5.2 (2023-08-14)

- Added Spotify widget to the project to show the current song that I'm listening to.
- Addes Highligth.js to the project to show code snippets in a better way.

## 2.5.1 (2023-08-04)

- Reduced size of flags thumbnails on the language selector
- Added new section for certifications and courses

## 2.4.2 (2023-07-16)

- Improved Curriculum Vitae section with new design and new data structure

## 2.4.1 (2023-07-12)

### Features

- Improved metadata for SEO and social media

## 2.4 (2023-06-06)

### Features

- Added single section for curriculum vitae

## 2.3.1 (2023-06-06)

### Features

- Added orange theme (Light / Dark) to the project
- Added carousel for SoftSkill
- Improved Tooltip in SoftSkill and Select Component

## 2.3 (2023-06-02)

### Features

- Migrated from pages to app router in Next.js 13. This change was made to improve performance and simplify the routing logic.
- Added support for dutch language

### Bug Fixes

- Fixed a bug where locale was not set by default
- Fixed popover doen't show correctly
- Fixed a bug where the user was not able to change the language

### Other Changes

- Used tRPC React Query Client to fetch data meanwhile server isn't ready.
- Updated the documentation to reflect the changes in this release.
- Updated the README file to include instructions on how to install and use the project.
