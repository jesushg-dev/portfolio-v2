import "server-only";

import { cache } from "react";

import { createPublicCaller } from "@/server/api/public";
import { db } from "@/server/db";
import { resolvePublicTenant } from "@/lib/public-site/tenant";

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

export const api = createPublicCaller(createContext);
