# Feature-Based Architecture Guide

This skill documents the **Feature-Based Architecture** guidelines for Portfolio v2.

---

## Core Philosophy

Feature-Based Architecture groups all code belonging to a single business domain (UI components, server queries, tRPC routers, DTOs, schemas, mappers) into a single cohesive directory inside `src/features/{domain}/`.

This replaces flat, multi-layered folders (`src/components/`, `src/server/routers/`, `src/types/`) with domain-bounded modules that are easier to navigate, refactor, and test.

---

## Standard Feature Directory Layout

```
src/features/{domain}/
├── components/                  # Domain React components (Client & Server)
│   ├── {domain}-page.tsx        # Main feature container / page view
│   ├── {domain}-form.tsx        # Editor / Admin form component
│   └── {domain}-card.tsx        # Presentation card / item view
├── server/                      # Server-side data fetching & API procedures
│   ├── {domain}-queries.ts       # Server Component data loaders (Auth + DB + DTO mapping)
│   └── {domain}-admin.router.ts  # tRPC admin procedure router
├── lib/                         # Data transfer objects & schemas
│   └── {domain}-editor-dto.ts    # Zod schemas, EditorDTO types, and mapper functions
└── types/                       # Domain-specific TypeScript types (optional)
```

---

## Registered Feature Modules

| Domain Name       | Path                            | Description                                      |
| :---------------- | :------------------------------ | :----------------------------------------------- |
| `projects`        | `src/features/projects/`        | Showcase projects, tech stacks, repository links |
| `services`        | `src/features/services/`        | Services offered, tech capabilities              |
| `certifications`  | `src/features/certifications/`  | Professional certifications & badges             |
| `skills`          | `src/features/skills/`          | Hard skills catalog & categories                 |
| `soft-skills`     | `src/features/soft-skills/`     | Interpersonal & soft skills                      |
| `timeline`        | `src/features/timeline/`        | Career & education timeline items                |
| `portfolio`       | `src/features/portfolio/`       | Portfolio configuration & app languages          |
| `spotify-connect` | `src/features/spotify-connect/` | Spotify integration connection status & OAuth    |
| `integrations`    | `src/features/integrations/`    | Integrations management dashboard                |

---

## Rules of Engagement

### 1. tRPC Router Placement

- **Location**: `src/features/{domain}/server/{domain}-admin.router.ts`.
- **Registration**: Import and mount in `src/server/api/root.ts`:
  ```typescript
  export const appRouter = createTRPCRouter({
    projectsAdmin: projectsAdminRouter,
    servicesAdmin: servicesAdminRouter,
    // ...
  });
  ```

### 2. DTO and Mapper Location

- All DTO definitions (`*EditorDTO`, `*CreateFormDTO`) and Prisma-to-DTO mapping functions live in `src/features/{domain}/lib/{domain}-editor-dto.ts`.
- Single shape contract: The DTO output by `server/{domain}-queries.ts` must match the exact shape expected by `components/{domain}-form.tsx` without double-mapping.

### 3. Layer Separation

- **`src/components/ui/`**: Base primitives (Shadcn components like `Button`, `Input`, `Dialog`).
- **`src/components/shared/`**: Reusable widgets consumed across multiple features (e.g. `spotify-widget`, `ios-device`, `form-root`).
- **`src/features/{domain}/components/`**: Domain components tied strictly to that feature.

### 4. Cross-Feature Import Boundaries

- **Forbidden**: Importing private internal helper functions from `features/A/` inside `features/B/`.
- **Allowed**: Shared logic used across 2+ features must be extracted to `src/lib/` or `src/components/shared/`.
