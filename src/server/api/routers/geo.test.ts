import { geoRouter } from "./geo";
import {
  createRouterCaller,
  createTrpcTestContext,
} from "@/test-utils/trpc-caller";

describe("geoRouter.getVisitorLocation", () => {
  it("prefers Vercel geo headers", async () => {
    const caller = createRouterCaller(
      geoRouter,
      createTrpcTestContext({
        db: {},
        headers: new Headers({
          "x-vercel-ip-latitude": "52.3676",
          "x-vercel-ip-longitude": "4.9041",
          "x-vercel-ip-city": "Amsterdam",
          "x-vercel-ip-country": "NL",
        }),
      }),
    );

    await expect(caller.getVisitorLocation()).resolves.toEqual({
      lat: 52.3676,
      lon: 4.9041,
      city: "Amsterdam",
      country: "NL",
    });
  });

  it("returns the Amsterdam preview pin for private IPs outside production", async () => {
    const caller = createRouterCaller(
      geoRouter,
      createTrpcTestContext({
        db: {},
        headers: new Headers({ "x-forwarded-for": "127.0.0.1" }),
      }),
    );

    await expect(caller.getVisitorLocation()).resolves.toMatchObject({
      city: "Amsterdam",
      country: "Netherlands",
    });
  });

  it("queries ip-api for a public IPv4", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "success",
          lat: 12.1,
          lon: -86.2,
          city: "Managua",
          country: "Nicaragua",
        }),
    });
    global.fetch = fetchMock;

    const caller = createRouterCaller(
      geoRouter,
      createTrpcTestContext({
        db: {},
        headers: new Headers({ "x-real-ip": "190.1.2.3" }),
      }),
    );

    await expect(caller.getVisitorLocation()).resolves.toEqual({
      lat: 12.1,
      lon: -86.2,
      city: "Managua",
      country: "Nicaragua",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("190.1.2.3"),
      expect.any(Object),
    );
  });

  it("returns null when ip-api fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    });

    const caller = createRouterCaller(
      geoRouter,
      createTrpcTestContext({
        db: {},
        headers: new Headers({ "x-real-ip": "190.1.2.3" }),
      }),
    );

    await expect(caller.getVisitorLocation()).resolves.toBeNull();
  });
});
