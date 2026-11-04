import { contactRouter } from "./contact";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

jest.mock("@/lib/email/resend", () => ({
  getPortfolioEmailClient: jest.fn(),
  getPortfolioContactTemplateId: jest.fn(),
  canDeliverPortfolioContactEmail: jest.fn(),
}));

jest.mock("@/lib/rate-limit/consume-fixed-window", () => ({
  consumeFixedWindowLimit: jest.fn(),
}));

jest.mock("@/lib/geo/geocode-place", () => ({
  locationQueryFromContacts: jest.fn(() => null),
  resolveOwnerMapLocation: jest.fn(() => Promise.resolve(null)),
}));

jest.mock("@/lib/turnstile/verify-turnstile", () => ({
  verifyTurnstileToken: jest.fn().mockResolvedValue({ success: true }),
}));

import {
  canDeliverPortfolioContactEmail,
  getPortfolioContactTemplateId,
  getPortfolioEmailClient,
} from "@/lib/email/resend";
import { consumeFixedWindowLimit } from "@/lib/rate-limit/consume-fixed-window";

describe("contactRouter.getPublic", () => {
  it("returns an empty payload without a tenant", async () => {
    const caller = createRouterCaller(
      contactRouter,
      createTrpcTestContext({ db: {}, tenant: null }),
    );
    await expect(caller.getPublic()).resolves.toMatchObject({
      contacts: [],
      recipientReady: false,
      emailFormEnabled: false,
    });
  });

  it("loads tenant contacts", async () => {
    (canDeliverPortfolioContactEmail as jest.Mock).mockResolvedValue(true);
    const db = {
      portfolioHeader: { findUnique: jest.fn().mockResolvedValue(null) },
      nowSettings: { findUnique: jest.fn().mockResolvedValue(null) },
      appLanguage: { findMany: jest.fn().mockResolvedValue([]) },
      cvContact: { findMany: jest.fn().mockResolvedValue([]) },
      profile: {
        findUnique: jest.fn().mockResolvedValue({
          username: "owner",
          isPrimary: true,
          customDomain: null,
          mapLocationLabel: null,
          mapLatitude: null,
          mapLongitude: null,
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          email: MOCK_OWNER_USER.email,
          name: "Owner",
        }),
      },
    };
    const caller = createRouterCaller(
      contactRouter,
      createTrpcTestContext({ db }),
    );
    const result = await caller.getPublic();
    expect(result.recipientReady).toBe(true);
    expect(result.emailFormEnabled).toBe(true);
    expect(result.responseTime).toBeNull();
    expect(result.timezone).toBeNull();
  });

  it("uses the requested contact language and the owner's configured timezone", async () => {
    (canDeliverPortfolioContactEmail as jest.Mock).mockResolvedValue(true);
    const db = {
      appLanguage: {
        findMany: jest.fn().mockResolvedValue([
          { id: "en", code: "en" },
          { id: "nl", code: "nl" },
        ]),
      },
      cvContact: { findMany: jest.fn().mockResolvedValue([]) },
      profile: { findUnique: jest.fn().mockResolvedValue(null) },
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ email: MOCK_OWNER_USER.email }),
      },
      portfolioHeader: {
        findUnique: jest.fn().mockResolvedValue({
          translations: [
            { appLanguageId: "en", contactResponseTime: "Within two days" },
            { appLanguageId: "nl", contactResponseTime: "Binnen twee dagen" },
          ],
        }),
      },
      nowSettings: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ timezone: "Europe/Amsterdam" }),
      },
    };
    const caller = createRouterCaller(
      contactRouter,
      createTrpcTestContext({ db }),
    );
    const result = await caller.getPublic({ locale: "nl" });
    expect(result.responseTime).toBe("Binnen twee dagen");
    expect(result.timezone).toBe("Europe/Amsterdam");
    expect(canDeliverPortfolioContactEmail).toHaveBeenLastCalledWith(
      MOCK_OWNER_USER.id,
      "en",
    );
    expect(db.nowSettings.findUnique).toHaveBeenCalledWith({
      where: { userId: MOCK_OWNER_USER.id },
      select: { timezone: true },
    });
    expect(db.portfolioHeader.findUnique).toHaveBeenCalledWith({
      where: { userId: MOCK_OWNER_USER.id },
      include: { translations: true },
    });
    db.portfolioHeader.findUnique.mockResolvedValue({ translations: [] });
    expect((await caller.getPublic({ locale: "nl" })).responseTime).toBeNull();
  });
});

describe("contactRouter.sendMessage", () => {
  const validInput = {
    name: "Visitor",
    email: "visitor@example.com",
    message: "Hello there, I would like to work together.",
    turnstileToken: "mock-valid-token",
  };

  it("rejects when there is no tenant", async () => {
    const caller = createRouterCaller(
      contactRouter,
      createTrpcTestContext({ db: {}, tenant: null }),
    );
    await expect(caller.sendMessage(validInput)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("rejects when email is not configured", async () => {
    (getPortfolioEmailClient as jest.Mock).mockResolvedValue({
      isConfigured: false,
    });
    const caller = createRouterCaller(
      contactRouter,
      createTrpcTestContext({ db: {} }),
    );
    await expect(caller.sendMessage(validInput)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
  });

  it("enforces the contact rate limit", async () => {
    (getPortfolioEmailClient as jest.Mock).mockResolvedValue({
      isConfigured: true,
      resend: { emails: { send: jest.fn() } },
      fromEmail: "me@example.com",
    });
    (consumeFixedWindowLimit as jest.Mock).mockResolvedValue(false);
    const caller = createRouterCaller(
      contactRouter,
      createTrpcTestContext({ db: {} }),
    );
    await expect(caller.sendMessage(validInput)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });

  it("sends the Resend template", async () => {
    const send = jest.fn().mockResolvedValue({ error: null });
    (getPortfolioEmailClient as jest.Mock).mockResolvedValue({
      isConfigured: true,
      resend: { emails: { send } },
      fromEmail: "me@example.com",
    });
    (consumeFixedWindowLimit as jest.Mock).mockResolvedValue(true);
    (getPortfolioContactTemplateId as jest.Mock).mockResolvedValue("tpl-1");
    const db = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          email: MOCK_OWNER_USER.email,
          name: "Owner",
        }),
      },
    };
    const caller = createRouterCaller(
      contactRouter,
      createTrpcTestContext({ db }),
    );
    await expect(caller.sendMessage(validInput)).resolves.toEqual({ ok: true });
    expect(send).toHaveBeenCalled();
  });
});
