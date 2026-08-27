export const IMPORT_FROM_URL_ERROR_CODES = [
  "IMPORT_INVALID_URL",
  "IMPORT_UNSUPPORTED_HOST",
  "IMPORT_LOGIN_WALL",
  "IMPORT_EMPTY_CONTENT",
  "IMPORT_FETCH_FAILED",
] as const;

export type ImportFromUrlErrorCode =
  (typeof IMPORT_FROM_URL_ERROR_CODES)[number];

export class ImportFromUrlError extends Error {
  readonly code: ImportFromUrlErrorCode;

  constructor(code: ImportFromUrlErrorCode) {
    super(code);
    this.name = "ImportFromUrlError";
    this.code = code;
  }
}

export function isImportFromUrlErrorCode(
  value: string,
): value is ImportFromUrlErrorCode {
  return (IMPORT_FROM_URL_ERROR_CODES as readonly string[]).includes(value);
}
