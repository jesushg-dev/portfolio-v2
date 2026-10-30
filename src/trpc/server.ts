import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { cache } from "react";

import { createPublicCaller, type PublicRouter } from "@/server/api/public";
import { db } from "@/server/db";
import { resolvePublicTenant } from "@/lib/public-site/tenant";
import { createQueryClient } from "./query-client";

/** Public RSC reads never depend on a visitor's session or request headers. */
const createContext = cache(async () => {
  return {
    db,
    tenant: await resolvePublicTenant(),
    session: null,
    user: null,
    headers: new Headers({ "x-trpc-source": "rsc" }),
  };
});

const getQueryClient = cache(createQueryClient);
const caller = createPublicCaller(createContext);

export const { trpc: api } = createHydrationHelpers<PublicRouter>(
  caller,
  getQueryClient,
);
