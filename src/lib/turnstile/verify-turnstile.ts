import { env } from "@/env";

export interface VerifyTurnstileParams {
  token: string;
  expectedAction: string;
  clientIp?: string;
}

export interface VerifyTurnstileResult {
  success: boolean;
  reason?: string;
}

function isAllowedHostname(
  hostname: string,
  allowedHostnames: Set<string>,
): boolean {
  const lower = hostname.trim().toLowerCase();
  if (allowedHostnames.has(lower)) {
    return true;
  }
  const bare = lower.replace(/^www\./, "");
  if (allowedHostnames.has(bare)) {
    return true;
  }
  if (allowedHostnames.has(`www.${bare}`)) {
    return true;
  }
  return false;
}

export async function verifyTurnstileToken({
  token,
  expectedAction,
}: VerifyTurnstileParams): Promise<VerifyTurnstileResult> {
  // Allow passing in unit test environment when explicitly configured for testing
  if (process.env.NODE_ENV === "test" && !process.env.TURNSTILE_SECRET) {
    return { success: true };
  }

  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    console.error(
      "[Turnstile] Verification failed: TURNSTILE_SECRET is not configured in environment variables.",
    );
    return { success: false, reason: "missing_secret" };
  }

  const hostnamesConfig =
    process.env.TURNSTILE_HOSTNAMES ??
    env.TURNSTILE_HOSTNAMES ??
    (process.env.NODE_ENV === "production"
      ? "jesushg.com,www.jesushg.com"
      : "jesushg.com,www.jesushg.com,localhost,127.0.0.1,lvh.me");

  const expectedHostnames = new Set(
    hostnamesConfig
      .split(",")
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean),
  );

  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 2048 ||
    expectedHostnames.size === 0
  ) {
    console.error(
      "[Turnstile] Verification failed: invalid token length or empty expected hostnames.",
    );
    return { success: false, reason: "invalid_token_or_hostnames" };
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: AbortSignal.timeout(10_000),
        body,
      },
    );

    if (!response.ok) {
      console.error(
        `[Turnstile] Siteverify HTTP error: ${response.status} ${response.statusText}`,
      );
      return { success: false, reason: `http_${response.status}` };
    }

    const result = (await response.json()) as {
      success: boolean;
      action?: string;
      hostname?: string;
      "error-codes"?: string[];
    };

    if (!result.success) {
      const errorCodes = result["error-codes"]?.join(", ") ?? "unknown";
      console.error(
        `[Turnstile] Cloudflare rejected token. Error codes: [${errorCodes}]`,
      );
      return { success: false, reason: "verification_rejected" };
    }

    if (result.action && expectedAction && result.action !== expectedAction) {
      console.error(
        `[Turnstile] Action mismatch: expected "${expectedAction}", received "${result.action}"`,
      );
      return { success: false, reason: "verification_rejected" };
    }

    if (
      !result.hostname ||
      !isAllowedHostname(result.hostname, expectedHostnames)
    ) {
      console.error(
        `[Turnstile] Hostname mismatch: received "${result.hostname}", allowed: [${Array.from(expectedHostnames).join(", ")}]`,
      );
      return { success: false, reason: "verification_rejected" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Turnstile] Verification network/system error:", error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : "network_failure",
    };
  }
}
