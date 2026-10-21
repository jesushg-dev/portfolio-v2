import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

import { env } from "@/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const source = env.INTEGRATION_ENCRYPTION_KEY ?? env.BETTER_AUTH_SECRET;

  return createHash("sha256").update(source).digest();
}

/** Encrypts a string value for at-rest DB storage (AES-256-GCM). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

/** Decrypts a string produced by `encryptSecret`. */
export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted payload format");
  }

  const iv = Buffer.from(ivB64, "base64url");
  const authTag = Buffer.from(tagB64, "base64url");
  const encrypted = Buffer.from(dataB64, "base64url");

  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}

/** Encrypts a JSON-serializable object for at-rest storage. */
export function encryptJsonSecret<T extends object>(data: T): string {
  return encryptSecret(JSON.stringify(data));
}

/** Decrypts a JSON payload stored by `encryptJsonSecret`. */
export function decryptJsonSecret<T extends object>(payload: string): T | null {
  try {
    const raw = decryptSecret(payload);
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("Failed to decrypt tenant integration credentials:", error);
    return null;
  }
}
