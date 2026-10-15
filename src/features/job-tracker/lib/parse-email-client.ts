export interface ParsedEmailClient {
  clientName: string;
  isProxy: boolean;
}

export function parseEmailClient(
  userAgent: string | null | undefined,
): ParsedEmailClient {
  if (!userAgent || typeof userAgent !== "string") {
    return { clientName: "Email client", isProxy: false };
  }

  const ua = userAgent.toLowerCase();

  if (ua.includes("googleimageproxy")) {
    return { clientName: "Gmail (Google Proxy)", isProxy: true };
  }

  if (ua.includes("yahoomailproxy") || ua.includes("yahoo! slurp")) {
    return { clientName: "Yahoo Mail", isProxy: true };
  }

  if (ua.includes("thunderbird")) {
    return { clientName: "Mozilla Thunderbird", isProxy: false };
  }

  if (
    ua.includes("outlook") ||
    ua.includes("microsoft office") ||
    ua.includes("ms-office")
  ) {
    return { clientName: "Microsoft Outlook", isProxy: false };
  }

  if (
    ua.includes("applewebkit") &&
    (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod"))
  ) {
    return { clientName: "Apple Mail (iOS)", isProxy: false };
  }

  if (
    ua.includes("macintosh") &&
    ua.includes("applewebkit") &&
    !ua.includes("chrome")
  ) {
    return { clientName: "Apple Mail (macOS)", isProxy: false };
  }

  if (ua.includes("android")) {
    return { clientName: "Android Mail", isProxy: false };
  }

  if (ua.includes("edg/")) {
    return { clientName: "Microsoft Edge", isProxy: false };
  }

  if (ua.includes("chrome/") && !ua.includes("chromium")) {
    return { clientName: "Chrome Webmail", isProxy: false };
  }

  if (ua.includes("firefox/")) {
    return { clientName: "Firefox Webmail", isProxy: false };
  }

  if (ua.includes("safari/") && !ua.includes("chrome/")) {
    return { clientName: "Safari Webmail", isProxy: false };
  }

  return { clientName: "Webmail / Client", isProxy: false };
}
