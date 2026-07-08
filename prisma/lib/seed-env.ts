import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

export function requireOwnerCredentials(): {
  email: string;
  password: string;
} {
  const email = process.env.OWNER_USER_EMAIL;
  const password = process.env.OWNER_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      [
        "Owner credentials are missing.",
        "Add OWNER_USER_EMAIL and OWNER_USER_PASSWORD to .env.local (not committed).",
        "The same values are used by prisma db seed and Playwright e2e login.",
      ].join(" "),
    );
  }

  return { email, password };
}
