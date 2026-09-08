import { cvPublicRouter } from "./cv-public.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  mockOwnerTenant,
} from "@/test-utils/trpc-caller";

jest.mock("@/lib/email/resend", () => ({
  getPortfolioEmailClient: jest.fn(),
  getPortfolioCvTemplateId: jest.fn(),
  getPortfolioContactTemplateId: jest.fn(),
  canDeliverPortfolioCvEmail: jest.fn(),
}));

jest.mock("@/features/cv/lib/load-cv-structured-draft", () => ({
  loadCvStructuredDraft: jest.fn(),
}));

jest.mock("@/features/cv/lib/resolve-cv-pdf-asset", () => ({
  resolveCvPdfAsset: jest.fn(),
}));

jest.mock("@/features/cv/lib/rate-limit-cv-email", () => ({
  assertCvEmailRateLimit: jest.fn(),
  getClientIpFromHeaders: jest.fn(() => "1.1.1.1"),
  hashClientIp: jest.fn(() => "hash"),
  logCvEmailRequest: jest.fn(),
}));

import { canDeliverPortfolioCvEmail } from "@/lib/email/resend";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";
import {
  getPortfolioCvTemplateId,
  getPortfolioEmailClient,
} from "@/lib/email/resend";
import { resolveCvPdfAsset } from "@/features/cv/lib/resolve-cv-pdf-asset";
import { assertCvEmailRateLimit } from "@/features/cv/lib/rate-limit-cv-email";

describe("cvPublicRouter.getPdfDeliveryStatus", () => {
  it("returns false flags when the CV is unpublished", async () => {
    const caller = createRouterCaller(
      cvPublicRouter,
      createTrpcTestContext({
        db: {},
        tenant: { ...mockOwnerTenant, isPrimary: false, isPublished: false },
      }),
    );
    await expect(caller.getPdfDeliveryStatus()).resolves.toEqual({
      canSendByEmail: false,
      hasCvData: false,
    });
  });

  it("reports whether a draft and email delivery exist", async () => {
    (loadCvStructuredDraft as jest.Mock).mockResolvedValue({ header: {} });
    (canDeliverPortfolioCvEmail as jest.Mock).mockResolvedValue(true);
    const caller = createRouterCaller(
      cvPublicRouter,
      createTrpcTestContext({ db: {} }),
    );
    await expect(caller.getPdfDeliveryStatus()).resolves.toEqual({
      canSendByEmail: true,
      hasCvData: true,
    });
  });
});

describe("cvPublicRouter.sendPdfByEmail", () => {
  const input = {
    email: "hire@example.com",
    locale: "en" as const,
  };

  it("rejects unpublished CVs", async () => {
    const caller = createRouterCaller(
      cvPublicRouter,
      createTrpcTestContext({
        db: {},
        tenant: { ...mockOwnerTenant, isPrimary: false, isPublished: false },
      }),
    );
    await expect(caller.sendPdfByEmail(input)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("rejects when email is not configured", async () => {
    (getPortfolioEmailClient as jest.Mock).mockResolvedValue({
      isConfigured: false,
    });
    const caller = createRouterCaller(
      cvPublicRouter,
      createTrpcTestContext({ db: {} }),
    );
    await expect(caller.sendPdfByEmail(input)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
  });

  it("sends the PDF when delivery is ready", async () => {
    const send = jest.fn().mockResolvedValue({ error: null });
    (getPortfolioEmailClient as jest.Mock).mockResolvedValue({
      isConfigured: true,
      resend: { emails: { send } },
      fromEmail: "me@example.com",
    });
    (getPortfolioCvTemplateId as jest.Mock).mockResolvedValue("cv-tpl");
    (loadCvStructuredDraft as jest.Mock).mockResolvedValue({
      header: { fullName: "Ada Lovelace" },
    });
    (assertCvEmailRateLimit as jest.Mock).mockResolvedValue(undefined);
    (resolveCvPdfAsset as jest.Mock).mockResolvedValue({
      buffer: Buffer.from("pdf"),
    });
    const db = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const caller = createRouterCaller(
      cvPublicRouter,
      createTrpcTestContext({ db }),
    );
    await expect(caller.sendPdfByEmail(input)).resolves.toEqual({ ok: true });
    expect(send).toHaveBeenCalled();
  });
});
