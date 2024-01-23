import { initTRPC } from "@trpc/server";

import type { Context } from "./context";

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({});

// Base router and procedure helpers
// router
export const { router } = t;

// procedure
export const { procedure } = t;
