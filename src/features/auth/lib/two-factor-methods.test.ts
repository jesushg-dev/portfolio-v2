import {
  parseTwoFactorMethods,
  serializeTwoFactorMethods,
} from "./two-factor-methods";

describe("parseTwoFactorMethods", () => {
  it("offers every method when the param is missing", () => {
    expect(parseTwoFactorMethods(null)).toEqual(["totp", "otp", "backup"]);
    expect(parseTwoFactorMethods("")).toEqual(["totp", "otp", "backup"]);
  });

  it("keeps only known methods, normalises order and always adds backup codes", () => {
    expect(parseTwoFactorMethods("otp")).toEqual(["otp", "backup"]);
    expect(parseTwoFactorMethods("otp, totp")).toEqual([
      "totp",
      "otp",
      "backup",
    ]);
    expect(parseTwoFactorMethods("TOTP,sms")).toEqual(["totp", "backup"]);
  });

  it("falls back to every method when nothing usable was provided", () => {
    expect(parseTwoFactorMethods("sms,push")).toEqual([
      "totp",
      "otp",
      "backup",
    ]);
  });
});

describe("serializeTwoFactorMethods", () => {
  it("joins known methods and drops unknown ones", () => {
    expect(serializeTwoFactorMethods(["totp", "otp"])).toBe("totp,otp");
    expect(serializeTwoFactorMethods(["otp", "sms"])).toBe("otp");
  });

  it("returns undefined when there is nothing to send", () => {
    expect(serializeTwoFactorMethods(undefined)).toBeUndefined();
    expect(serializeTwoFactorMethods([])).toBeUndefined();
    expect(serializeTwoFactorMethods(["sms"])).toBeUndefined();
  });
});
