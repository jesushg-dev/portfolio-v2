import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Loads key/value pairs from .env-style files into `process.env`
 * without overwriting variables already set in the shell.
 */
function loadEnvFile(filename: string): void {
  const filePath = resolve(process.cwd(), filename);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

function resolveVercelBypassHeaders(): Record<string, string> | undefined {
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!bypassSecret) return undefined;

  return {
    "x-vercel-protection-bypass": bypassSecret,
    "x-vercel-set-bypass-cookie": "true",
  };
}

export const e2eEnv = {
  baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
  ownerEmail: process.env.OWNER_USER_EMAIL,
  ownerPassword: process.env.OWNER_USER_PASSWORD,
  vercelBypassHeaders: resolveVercelBypassHeaders(),
} as const;

export function requireE2eCredentials(): {
  email: string;
  password: string;
} {
  const { ownerEmail, ownerPassword } = e2eEnv;

  if (!ownerEmail || !ownerPassword) {
    throw new Error(
      [
        "Owner credentials are missing.",
        "Add OWNER_USER_EMAIL and OWNER_USER_PASSWORD to .env.local (not committed).",
        "Run pnpm db:seed first so the same user exists in the database.",
        "See e2e/env.example for the expected variables.",
      ].join(" "),
    );
  }

  return { email: ownerEmail, password: ownerPassword };
}
