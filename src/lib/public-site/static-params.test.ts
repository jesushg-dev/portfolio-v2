import { publicProcessParams } from "./static-params";
import { getPrimaryPublicTenant } from "./tenant";
import { db } from "@/server/db";

jest.mock("./tenant", () => ({
  getPrimaryPublicTenant: jest.fn(),
}));

jest.mock("@/server/db", () => ({
  db: {
    processPage: {
      findMany: jest.fn(),
    },
  },
}));

describe("publicProcessParams", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns published process page slugs when tenant and pages exist", async () => {
    (getPrimaryPublicTenant as jest.Mock).mockResolvedValue({
      userId: "user-123",
      username: "jehg",
    });
    (db.processPage.findMany as jest.Mock).mockResolvedValue([
      { slug: "how-i-use-ai" },
      { slug: "qa-collaboration" },
      { slug: "custom-process" },
    ]);

    const result = await publicProcessParams();
    expect(result).toEqual([
      { slug: "how-i-use-ai" },
      { slug: "qa-collaboration" },
      { slug: "custom-process" },
    ]);
  });

  it("falls back to default process slugs when db returns no published pages", async () => {
    (getPrimaryPublicTenant as jest.Mock).mockResolvedValue({
      userId: "user-123",
      username: "jehg",
    });
    (db.processPage.findMany as jest.Mock).mockResolvedValue([]);

    const result = await publicProcessParams();
    expect(result).toEqual([
      { slug: "how-i-use-ai" },
      { slug: "qa-collaboration" },
    ]);
  });

  it("falls back to default process slugs when tenant is not found", async () => {
    (getPrimaryPublicTenant as jest.Mock).mockResolvedValue(null);

    const result = await publicProcessParams();
    expect(result).toEqual([
      { slug: "how-i-use-ai" },
      { slug: "qa-collaboration" },
    ]);
  });
});
