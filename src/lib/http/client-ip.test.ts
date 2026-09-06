import {
  getClientIpFromHeaders,
  hashClientIp,
  isPrivateOrLocalIpv4,
  isValidIpv4,
} from "./client-ip";

describe("hashClientIp", () => {
  it("returns a 32-character hex string", () => {
    const hash = hashClientIp("127.0.0.1");
    expect(hash).toHaveLength(32);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});

describe("isValidIpv4", () => {
  it("accepts dotted quads and rejects injection payloads", () => {
    expect(isValidIpv4("8.8.8.8")).toBe(true);
    expect(isValidIpv4("255.255.255.255")).toBe(true);
    expect(isValidIpv4("8.8.8.256")).toBe(false);
    expect(isValidIpv4("8.8.8.8/../../evil")).toBe(false);
    expect(isValidIpv4("169.254.169.254@evil.com")).toBe(false);
  });
});

describe("isPrivateOrLocalIpv4", () => {
  it("blocks loopback, RFC1918, and link-local ranges", () => {
    expect(isPrivateOrLocalIpv4("127.0.0.1")).toBe(true);
    expect(isPrivateOrLocalIpv4("10.0.0.1")).toBe(true);
    expect(isPrivateOrLocalIpv4("192.168.1.1")).toBe(true);
    expect(isPrivateOrLocalIpv4("172.16.0.1")).toBe(true);
    expect(isPrivateOrLocalIpv4("172.31.255.1")).toBe(true);
    expect(isPrivateOrLocalIpv4("169.254.169.254")).toBe(true);
    expect(isPrivateOrLocalIpv4("8.8.8.8")).toBe(false);
    expect(isPrivateOrLocalIpv4("172.32.0.1")).toBe(false);
  });
});

describe("getClientIpFromHeaders", () => {
  it("prefers x-vercel-forwarded-for, then x-forwarded-for, then x-real-ip", () => {
    expect(
      getClientIpFromHeaders(
        new Headers({
          "x-vercel-forwarded-for": "203.0.113.4",
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        }),
      ),
    ).toBe("203.0.113.4");

    expect(
      getClientIpFromHeaders(
        new Headers({ "x-forwarded-for": "192.168.1.1, 10.0.0.1" }),
      ),
    ).toBe("192.168.1.1");

    expect(
      getClientIpFromHeaders(new Headers({ "x-real-ip": "10.0.0.2" })),
    ).toBe("10.0.0.2");

    expect(getClientIpFromHeaders(new Headers())).toBe("unknown");
  });
});
