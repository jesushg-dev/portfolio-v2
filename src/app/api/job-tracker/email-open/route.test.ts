jest.mock("@/server/db", () => ({
  db: {
    applicationEmail: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    applicationEmailOpen: {
      create: jest.fn(),
    },
  },
}));

import { hashEmailOpenTrackingToken } from "@/features/job-tracker/lib/email-open-tracking";
import { db } from "@/server/db";
import { GET } from "./route";

const nativeResponse = Reflect.get(globalThis, "Response") as
  typeof Response | undefined;

class TestResponse {
  readonly status: number;
  readonly headers: { get(name: string): string | null };

  constructor(
    _body: unknown,
    init?: { status?: number; headers?: Record<string, string> },
  ) {
    this.status = init?.status ?? 200;
    const headers = new Map(
      Object.entries(init?.headers ?? {}).map(([key, value]) => [
        key.toLowerCase(),
        value,
      ]),
    );
    this.headers = {
      get: (name) => headers.get(name.toLowerCase()) ?? null,
    };
  }
}

function createRequest(
  url: string,
  requestHeaders: Record<string, string> = {},
): Request {
  const headers = new Map(
    Object.entries(requestHeaders).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ]),
  );
  return {
    url,
    headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
  } as Request;
}

describe("email open tracking pixel", () => {
  const findFirst = jest.spyOn(db.applicationEmail, "findFirst");
  const update = jest.spyOn(db.applicationEmail, "update");
  const createOpen = jest.spyOn(db.applicationEmailOpen, "create");

  beforeAll(() => {
    globalThis.Response = TestResponse as unknown as typeof Response;
  });

  afterAll(() => {
    if (nativeResponse) {
      globalThis.Response = nativeResponse;
    } else {
      Reflect.deleteProperty(globalThis, "Response");
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records one approximate load and logs the open event", async () => {
    const token = "b".repeat(64);
    findFirst.mockResolvedValue({ id: "mail-1", firstOpenedAt: null } as never);
    update.mockResolvedValue({ id: "mail-1" } as never);
    createOpen.mockResolvedValue({ id: "open-1" } as never);

    const response = await GET(
      createRequest(
        `https://portfolio.example/api/job-tracker/email-open?token=${token}`,
        {
          "User-Agent": "GoogleImageProxy",
          "X-Forwarded-For": "203.0.113.195",
        },
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/gif");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        trackingTokenHash: hashEmailOpenTrackingToken(token),
        trackingEnabled: true,
      },
      select: { id: true, firstOpenedAt: true },
    });
    expect(createOpen).toHaveBeenCalledWith({
      data: {
        emailId: "mail-1",
        openedAt: expect.any(Date) as Date,
        userAgent: "GoogleImageProxy",
        ipAddress: "203.0.113.195",
      },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: "mail-1" },
      data: {
        openCount: { increment: 1 },
        lastOpenedAt: expect.any(Date) as Date,
        firstOpenedAt: expect.any(Date) as Date,
      },
    });
  });

  it("does not record invalid tokens or requests that opt out", async () => {
    const invalidTokenResponse = await GET(
      createRequest(
        "https://portfolio.example/api/job-tracker/email-open?token=invalid",
      ),
    );
    const dntResponse = await GET(
      createRequest(
        `https://portfolio.example/api/job-tracker/email-open?token=${"c".repeat(64)}`,
        { DNT: "1" },
      ),
    );

    expect(invalidTokenResponse.status).toBe(200);
    expect(dntResponse.status).toBe(200);
    expect(findFirst).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(createOpen).not.toHaveBeenCalled();
  });
});
