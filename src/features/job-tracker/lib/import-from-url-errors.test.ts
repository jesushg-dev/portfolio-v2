import {
  IMPORT_FROM_URL_ERROR_CODES,
  ImportFromUrlError,
  isImportFromUrlErrorCode,
} from "./import-from-url-errors";

describe("ImportFromUrlError", () => {
  it("stores the code as the message", () => {
    const error = new ImportFromUrlError("IMPORT_LOGIN_WALL");
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("IMPORT_LOGIN_WALL");
    expect(error.message).toBe("IMPORT_LOGIN_WALL");
    expect(error.name).toBe("ImportFromUrlError");
  });
});

describe("isImportFromUrlErrorCode", () => {
  it("accepts known codes", () => {
    for (const code of IMPORT_FROM_URL_ERROR_CODES) {
      expect(isImportFromUrlErrorCode(code)).toBe(true);
    }
  });

  it("rejects unknown strings", () => {
    expect(isImportFromUrlErrorCode("IMPORT_TIMEOUT")).toBe(false);
  });
});
