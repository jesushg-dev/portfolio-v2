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

export async function verifyTurnstileToken({
  token,
  expectedAction,
  clientIp,
}: VerifyTurnstileParams): Promise<VerifyTurnstileResult> {
  // Allow passing in unit test environment when explicitly configured for testing
  if (process.env.NODE_ENV === "test" && !process.env.TURNSTILE_SECRET) {
    return { success: true };
  }

  const secret = process.env.TURNSTILE_SECRET ?? env.TURNSTILE_SECRET;
  if (!secret) {
    return { success: false, reason: "missing_secret" };
  }

  const hostnamesConfig =
    process.env.TURNSTILE_HOSTNAMES ??
    env.TURNSTILE_HOSTNAMES ??
    (process.env.NODE_ENV === "production"
      ? "jesushg.com"
      : "jesushg.com,localhost,127.0.0.1,lvh.me");

  const expectedHostnames = new Set(
    hostnamesConfig
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );

  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 2048 ||
    expectedHostnames.size === 0
  ) {
    return { success: false, reason: "invalid_token_or_hostnames" };
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });

    if (clientIp && clientIp !== "unknown") {
      body.set("remoteip", clientIp);
    }

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
      return { success: false, reason: `http_${response.status}` };
    }

    const result = (await response.json()) as {
      success: boolean;
      action?: string;
      hostname?: string;
      "error-codes"?: string[];
    };

    if (
      !result.success ||
      result.action !== expectedAction ||
      !result.hostname ||
      !expectedHostnames.has(result.hostname)
    ) {
      return { success: false, reason: "verification_rejected" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : "network_failure",
    };
  }
}
