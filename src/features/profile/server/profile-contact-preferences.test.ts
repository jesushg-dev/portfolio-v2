import { profileAdminRouter } from "./profile-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

function createDb() {
  return {
    appLanguage: {
      findMany: jest.fn().mockResolvedValue([{ id: "en", name: "English" }]),
    },
    portfolioHeader: {
      upsert: jest.fn().mockResolvedValue({ id: "header" }),
      findUnique: jest.fn().mockResolvedValue({
        translations: [
          { appLanguageId: "en", contactResponseTime: "Within two days" },
        ],
      }),
    },
    portfolioHeaderTranslation: { upsert: jest.fn() },
  };
}

it("reads and updates only the authenticated owner's localized contact note", async () => {
  const db = createDb();
  const caller = createRouterCaller(
    profileAdminRouter,
    createTrpcTestContext({ db }),
  );
  await expect(caller.getContactPreferences()).resolves.toEqual([
    { id: "en", name: "English", responseTime: "Within two days" },
  ]);
  expect(db.portfolioHeader.findUnique).toHaveBeenCalledWith({
    where: { userId: MOCK_OWNER_USER.id },
    include: { translations: true },
  });
  await caller.upsertContactPreferences({
    translations: { en: " Within one day " },
  });
  expect(db.portfolioHeaderTranslation.upsert).toHaveBeenCalledWith({
    where: {
      portfolioHeaderId_appLanguageId: {
        portfolioHeaderId: "header",
        appLanguageId: "en",
      },
    },
    create: {
      portfolioHeaderId: "header",
      appLanguageId: "en",
      contactResponseTime: "Within one day",
    },
    update: { contactResponseTime: "Within one day" },
  });
  await caller.upsertContactPreferences({ translations: { en: "" } });
  expect(db.portfolioHeaderTranslation.upsert.mock.calls).toMatchObject([
    [{ update: { contactResponseTime: "Within one day" } }],
    [{ update: { contactResponseTime: null } }],
  ]);
});

it("rejects unknown languages and anonymous writes before changing content", async () => {
  const db = createDb();
  const caller = createRouterCaller(
    profileAdminRouter,
    createTrpcTestContext({ db }),
  );
  await expect(
    caller.upsertContactPreferences({ translations: { foreign: "Soon" } }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(db.portfolioHeader.upsert).not.toHaveBeenCalled();
  const anonymous = createRouterCaller(
    profileAdminRouter,
    createTrpcTestContext({ db, user: null }),
  );
  await expect(
    anonymous.upsertContactPreferences({ translations: { en: "Soon" } }),
  ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
});
