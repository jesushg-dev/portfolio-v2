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

export const e2eEnv = {
  baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
  userEmail: process.env.E2E_USER_EMAIL,
  userPassword: process.env.E2E_USER_PASSWORD,
} as const;

export function requireE2eCredentials(): {
  email: string;
  password: string;
} {
  const { userEmail, userPassword } = e2eEnv;

  if (!userEmail || !userPassword) {
    throw new Error(
      [
        "E2E credentials are missing.",
        "Add E2E_USER_EMAIL and E2E_USER_PASSWORD to .env.local (not committed).",
        "See e2e/env.example for the expected variables.",
      ].join(" "),
    );
  }

  return { email: userEmail, password: userPassword };
}
