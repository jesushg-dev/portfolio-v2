import { portfolioRouter } from "@/server/api/routers/portfolio";
import { contactRouter } from "@/server/api/routers/contact";
import { terminalRouter } from "@/features/terminal/server/terminal.router";
import { processPagesRouter } from "@/features/process-pages/server/process-pages.router";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/** Shared router instances used by public RSCs and the complete HTTP API. */
export const publicRouters = {
  portfolio: portfolioRouter,
  contact: contactRouter,
  terminal: terminalRouter,
  processPages: processPagesRouter,
};

export const publicRouter = createTRPCRouter(publicRouters);
export type PublicRouter = typeof publicRouter;
export const createPublicCaller = createCallerFactory(publicRouter);
