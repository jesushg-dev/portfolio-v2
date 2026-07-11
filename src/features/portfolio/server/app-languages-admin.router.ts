import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const appLanguagesAdminRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.appLanguage.findMany({ orderBy: { code: "asc" } });
  }),
});
