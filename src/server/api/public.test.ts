import { publicRouter, publicRouters } from "./public";
import { portfolioRouter } from "./routers/portfolio";
import { contactRouter } from "./routers/contact";
import { terminalRouter } from "@/features/terminal/server/terminal.router";
import { processPagesRouter } from "@/features/process-pages/server/process-pages.router";
import {
  createRouterCaller,
  createTrpcTestContext,
} from "@/test-utils/trpc-caller";

jest.mock("@/server/api/root", () => {
  throw new Error("The public router must not load the complete admin API");
});

it("composes only the RSC router families using their existing instances", () => {
  expect(publicRouters).toEqual({
    portfolio: portfolioRouter,
    contact: contactRouter,
    terminal: terminalRouter,
    processPages: processPagesRouter,
  });
  expect(Object.keys(publicRouter._def.record).sort()).toEqual(
    ["portfolio", "contact", "terminal", "processPages"].sort(),
  );
});

it("keeps public procedure names and unauthenticated calls working", async () => {
  const caller = createRouterCaller(
    publicRouter,
    createTrpcTestContext({ db: {}, tenant: null, user: null }),
  );
  await expect(caller.portfolio.getSkills({ locale: "en" })).resolves.toEqual(
    [],
  );
});
