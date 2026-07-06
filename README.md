# My Portfolio

This project is a portfolio of my experiences, skills, and projects. It is built with Next.js 13 and next-intl.

## Table of Contents

- [Features](#features)
- [How to Use](#how-to-use)
- [Installation](#installation)
- [Multi-tenancy & Subdomains](#multi-tenancy--subdomains)
- [Skills Used](#skills-used)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- Showcase my skills and experience in React, Next.js, and TypeScript by highlighting specific projects and technologies.
- Utilize next-intl for internationalization support.
- Ensure responsiveness and compatibility with all devices.

## How to Use

To use this project, clone the repository and follow these steps:

### Installation

1. Install project dependencies:

### Running the Project

2. Start the development server:
3. The project will be available at [http://localhost:3000](http://localhost:3000).

## Multi-tenancy & Subdomains

This project is a multi-tenant SaaS where each user gets their own portfolio + CV at `{username}.jesushg.com`. Tenant resolution lives in `src/proxy.ts` and runs before `next-intl` middleware. The apex domain (`jesushg.com`) is reserved for the primary owner (the `Profile` row marked `isPrimary: true`); reserved subdomains (`www`, `dashboard`, `app`, `admin`, `api`, `auth`) bypass tenant resolution.

### Local development with subdomains

Browsers do not resolve random `*.localhost` hosts on every OS, and editing `/etc/hosts` per tenant is painful. Use [`lvh.me`](https://lvh.me) instead — it's a public DNS entry whose wildcard `*.lvh.me` always resolves to `127.0.0.1`. No setup needed.

Examples while running `pnpm dev`:

- `http://lvh.me:3000` → apex (primary owner CV).
- `http://jesus.lvh.me:3000` → owner CV via the `jesus` subdomain (same data as apex).
- `http://alice.lvh.me:3000` → tenant `alice` (404 if `Profile.username = "alice"` does not exist or is unpublished).
- `http://dashboard.lvh.me:3000/dashboard` → reserved subdomain serving the admin panel.

The middleware also accepts `*.localhost` (Chrome/Edge resolve it; Safari does not), but `lvh.me` is the recommended option.

Make sure your `.env` includes:

```
PRIMARY_DOMAIN=jesushg.com
NEXT_PUBLIC_PRIMARY_DOMAIN=jesushg.com
NEXT_PUBLIC_DEV_DOMAIN=lvh.me
BETTER_AUTH_URL=http://lvh.me:3000
```

Better Auth is configured with `crossSubDomainCookies` so that a session set on `lvh.me` is visible from any `*.lvh.me` subdomain. The same applies to `jesushg.com` in production.

### Production: wildcard DNS + TLS

To support `{username}.jesushg.com` in production:

1. **DNS**: at your DNS provider (Cloudflare, Route53, Namecheap, …) add a wildcard `CNAME` (or `A`/`ALIAS`) record:

   ```
   *.jesushg.com    CNAME    cname.vercel-dns.com.
   ```

   (or whatever your hosting provider documents; for Vercel it's `cname.vercel-dns.com`).

2. **Vercel**: in the project settings → _Domains_, add both `jesushg.com` and `*.jesushg.com`. Vercel will auto-provision Let's Encrypt wildcard certificates — this is supported only on the Pro plan and above.

3. **Better Auth**: set `BETTER_AUTH_URL=https://jesushg.com` and make sure the value of `PRIMARY_DOMAIN` matches. The `trustedOrigins` config in `src/lib/auth.ts` already includes `https://*.jesushg.com`.

4. **Custom domains per tenant** (`Profile.customDomain`) are stored in the schema but their request handling is out of scope for the initial release; reserve them for a follow-up.

### Reserved subdomains

`www`, `dashboard`, `app`, `admin`, `api`, and `auth` are treated as _non-tenant_ subdomains (see `RESERVED_SUBDOMAINS` in `src/proxy.ts` and `src/lib/tenant/resolve.ts`). They never resolve to a `Profile`, even if a user registers a matching `username`. Sign-up validation in `cv.upsertProfile` rejects these names.

### Seeding the primary owner

After running `prisma db push`, run:

```
pnpm prisma db seed
```

`prisma/seed.ts` calls `seedOwner` (`prisma/seed-owner.ts`) which:

1. Creates/updates the primary `User` + `Profile` (`username = "jesus"`, `isPrimary = true`).
2. Reassigns existing `Project`/`Skill`/`Service`/`Certification` rows without a `userId` to that owner.
3. Migrates the legacy CV content from `prisma/data/legacy-cv/{en,es,nl}.json` into the new `Cv*` tables, populating `LocalizedText` JSON fields with all three translations.

The seed is idempotent: re-running it `upsert`s the user/profile/header/about-me and `deleteMany`+`create`s the list-style sections (contacts, education, languages, technical skills, experiences, soft skills, additional info, personal references).

## Skills Used

The following skills and libraries were utilized in creating this project:

- React: A JavaScript library for building user interfaces.
- Next.js: A framework for server-rendered React applications.
- TypeScript: A statically typed superset of JavaScript that compiles to plain JavaScript.
- next-intl: A localization and internationalization library for Next.js.

Additional libraries used for specific functionality include:

- MongoDB with Mongoose: A NoSQL database and object modeling tool for Node.js.
- Prisma: A modern database toolkit for TypeScript and Node.js.
- trpc: A TypeScript-first framework for building scalable and type-safe APIs.
- motion/react: A library for creating fluid and interactive animations in React applications.

## Contributing

Contributions are welcome! If you want to contribute to this project, please follow these guidelines:

- Open an issue to discuss proposed changes or new features.
- Fork the repository and create a new branch for your contribution.
- Make your changes and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

If you have any questions or comments, please feel free to contact me at [email protected]
