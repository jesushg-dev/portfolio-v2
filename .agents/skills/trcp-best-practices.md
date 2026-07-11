---
description: This rule provides comprehensive guidance on tRPC best practices
globs: **/*.{ts,tsx}
---

# tRPC Best Practices: A Comprehensive Guide

This document outlines best practices for developing robust, maintainable, and efficient applications using tRPC (TypeScript Remote Procedure Call).

## 1. Code Organization and Structure

### 1.1 Directory Structure Best Practices

- **Feature-Based Organization:** Organize your code around features or modules, rather than technical layers (e.g., `components`, `utils`, `services`). This promotes modularity and maintainability. For example:

  src/
  ├── features/
  │ ├── user/
  │ │ ├── components/
  │ │ │ ├── UserProfile.tsx
  │ │ │ └── UserSettings.tsx
  │ │ ├── api/
  │ │ │ ├── userRouter.ts // tRPC router for user-related procedures
  │ │ │ └── userSchema.ts // Zod schemas for input validation
  │ │ ├── hooks/
  │ │ │ └── useUser.ts // Custom hooks for data fetching and state management
  │ │ └── types/
  │ │ │ └── user.ts // TypeScript types related to users
  │ ├── product/
  │ │ └── ...
  ├── utils/
  │ ├── api.ts // tRPC client initialization
  │ └── db.ts // Database connection/abstraction
  ├── app/
  │ ├── api/
  │ │ └── root.ts // Root tRPC router combining all feature routers
  │ └── context.ts // tRPC context creation
  └── index.ts // Server entry point

- **Separation of Concerns:** Separate concerns into different directories and modules. For instance, keep your tRPC router definitions separate from your business logic and data access layers.
- **Grouping Similar Functionality:** Keep related files together within a feature directory. This makes it easier to understand and maintain the code.

### 1.2 File Naming Conventions

- **Descriptive Names:** Use descriptive names for files and directories that clearly indicate their purpose.
- **Consistent Case:** Maintain a consistent casing convention (e.g., camelCase for variables, PascalCase for components). Use `kebab-case` for file names e.g. `user-profile.tsx` or `user.router.ts`
- **Suffixes:** Use suffixes to indicate the type of file (e.g., `.router.ts` for tRPC routers, `.schema.ts` for Zod schemas, `.component.tsx` for React components).

### 1.3 Module Organization

- **Small Modules:** Keep modules small and focused. A module should have a single responsibility. Aim for modules that are easy to understand and test.
- **Explicit Exports:** Use explicit exports to control what is exposed from a module. This helps to prevent accidental exposure of internal implementation details.
- **Circular Dependencies:** Avoid circular dependencies between modules. Circular dependencies can lead to unexpected behavior and make it difficult to reason about the code.

### 1.4 Component Architecture

- **Presentational and Container Components:** Separate presentational (dumb) components from container (smart) components. Presentational components focus on rendering UI, while container components handle data fetching and state management. Use the term `view` instead of `component` in the file suffix can make a separation between React components and presentational components, e.g. `user-profile.view.tsx`
- **Reusable Components:** Design components to be reusable across different parts of the application. This reduces code duplication and improves maintainability.
- **Component Composition:** Favor component composition over inheritance. Composition allows you to create more flexible and reusable components.

### 1.5 Code Splitting Strategies

- **Route-Based Splitting:** Split your code based on routes. This allows you to load only the code that is needed for a specific route. This can be easily achieved with React's `lazy` and `Suspense` APIs.
- **Component-Based Splitting:** Split your code based on components. This allows you to load only the code that is needed for a specific component.
- **Dynamic Imports:** Use dynamic imports to load code on demand. This can be useful for loading large libraries or components that are not needed immediately.

## 2. Common Patterns and Anti-patterns

### 2.1 Design Patterns Specific to tRPC

- **Router Composition:** Compose tRPC routers to create a hierarchical API structure. This allows you to organize your API into logical groups.

  typescript
  // src/app/api/routers/userRouter.ts
  import { publicProcedure, router } from "../trpc";
  import { z } from "zod";

  export const userRouter = router({
  getById: publicProcedure
  .input(z.string())
  .query(async ({ input }) => {
  // ... fetch user by ID
  }),
  create: publicProcedure
  .input(z.object({ name: z.string() }))
  .mutation(async ({ input }) => {
  // ... create a new user
  }),
  });

  // src/app/api/root.ts
  import { userRouter } from "./routers/userRouter";
  import { productRouter } from "./routers/productRouter";

  export const appRouter = router({
  user: userRouter,
  product: productRouter,
  });

  export type AppRouter = typeof appRouter;

- **Middleware Chaining:** Use middleware to handle cross-cutting concerns such as authentication, authorization, and logging. Middleware can be chained to create a pipeline of operations.

  typescript
  // src/app/api/trpc.ts
  import { initTRPC, TRPCError } from "@trpc/server";
  import { Context } from "./context";

  const t = initTRPC.context<Context>().create();
  const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
  throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
  ctx: {
  user: ctx.user,
  },
  });
  });

  export const router = t.router;
  export const publicProcedure = t.procedure;
  export const protectedProcedure = t.procedure.use(isAuthed);

- **Input Validation with Zod:** Use Zod for input validation to ensure that data received from the client is valid. This helps to prevent errors and security vulnerabilities.

  typescript
  import { z } from "zod";
  import { publicProcedure } from "../trpc";

  export const createUserProcedure = publicProcedure
  .input(z.object({ name: z.string().min(3), email: z.string().email() }))
  .mutation(async ({ input }) => {
  // ... create a new user
  });

### 2.2 Recommended Approaches for Common Tasks

- **Authentication:** Use tRPC middleware to authenticate users. Verify user credentials and set the user object in the context.
- **Authorization:** Use tRPC middleware to authorize users. Check if the user has the required permissions to access a resource.
- **Error Handling:** Use tRPC's built-in error handling mechanisms to handle errors gracefully. Throw `TRPCError` exceptions with appropriate error codes and messages.
- **Data Fetching:** Use a data fetching library (e.g., Prisma, Drizzle ORM, Supabase) to interact with your database. Abstract data access logic into separate modules or services.

### 2.3 Anti-patterns and Code Smells to Avoid

- **Over-fetching:** Avoid fetching more data than you need. Use projections or GraphQL-style queries to fetch only the required fields.
- **Under-fetching:** Avoid making multiple API calls to fetch related data. Batch requests or use a data loader pattern to fetch related data in a single call.
- **Tight Coupling:** Avoid tight coupling between tRPC routers and your business logic. Abstract business logic into separate modules or services.
- **Ignoring Errors:** Never ignore errors. Always handle errors gracefully and provide meaningful feedback to the client.
- **Direct Database Access in Routers:** Avoid accessing the database directly within tRPC router procedures. Instead, abstract data access into separate services or repositories.
- **Complex Business Logic in Routers:** Keep tRPC router procedures focused on routing and input validation. Move complex business logic to separate functions or modules.

### 2.4 State Management Best Practices

- **Centralized State Management:** Use a centralized state management library (e.g., Zustand, Redux, Jotai) to manage application state. This makes it easier to share state between components and to reason about the application's state.
- **Immutable State:** Use immutable state to prevent unexpected side effects. This makes it easier to reason about the application's state and to debug issues.
- **Controlled Components:** Use controlled components to manage form state. This gives you more control over the form and makes it easier to validate input.
- **Server State Management:** Use a library like TanStack Query or SWR to manage server state (data fetched from the API). These libraries provide caching, optimistic updates, and other features that make it easier to manage server state.

### 2.5 Error Handling Patterns

- **Centralized Error Handling:** Use a centralized error handling mechanism to handle errors consistently across the application.
- **Error Boundaries:** Use error boundaries to prevent errors from crashing the application. Error boundaries can catch errors that occur during rendering and display a fallback UI.
- **Logging:** Log errors to a central logging service. This makes it easier to track down and fix issues.
- **User-Friendly Error Messages:** Display user-friendly error messages to the user. Avoid displaying technical details or stack traces.
- **Retry Mechanism:** Implement a retry mechanism for transient errors. This can improve the resilience of the application.
