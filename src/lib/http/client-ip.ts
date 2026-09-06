import { createHash } from "node:crypto";

const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;

export function hashClientIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export function isValidIpv4(ip: string): boolean {
  if (!IPV4_RE.test(ip)) return false;
  return ip.split(".").every((octet) => {
    const value = Number(octet);
    return Number.isInteger(value) && value >= 0 && value <= 255;
  });
}

export function isPrivateOrLocalIpv4(ip: string): boolean {
  if (!isValidIpv4(ip)) return true;
  if (ip === "127.0.0.1" || ip === "0.0.0.0") return true;
  if (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("169.254.")
  ) {
    return true;
  }
  return /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);
}

export function getClientIpFromHeaders(headers: Headers): string {
  const vercel = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return headers.get("x-real-ip")?.trim() ?? "unknown";
}
