import { TRPCError } from "@trpc/server";

import { assertOwner, optionalUrl, StackTypeSchema } from "./portfolio-schemas";

describe("StackTypeSchema", () => {
  it("accepts known stack types", () => {
    expect(StackTypeSchema.parse("FRONTEND")).toBe("FRONTEND");
    expect(StackTypeSchema.parse("CYBERSECURITY")).toBe("CYBERSECURITY");
  });

  it("rejects unknown values", () => {
    expect(() => StackTypeSchema.parse("HARDWARE")).toThrow();
  });
});

describe("optionalUrl", () => {
  it("keeps a valid URL", () => {
    expect(optionalUrl.parse("https://example.com")).toBe(
      "https://example.com",
    );
  });

  it("turns an empty string into undefined", () => {
    expect(optionalUrl.parse("")).toBeUndefined();
  });

  it("allows omitting the value", () => {
    expect(optionalUrl.parse(undefined)).toBeUndefined();
  });
});

describe("assertOwner", () => {
  it("returns the entity when the user owns it", async () => {
    const entity = { id: "1", userId: "user-1" };
    await expect(assertOwner(entity, "user-1")).resolves.toBe(entity);
  });

  it("throws NOT_FOUND when the entity is missing", async () => {
    await expect(assertOwner(null, "user-1")).rejects.toBeInstanceOf(TRPCError);
    await expect(assertOwner(null, "user-1")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("throws NOT_FOUND when the userId does not match", async () => {
    await expect(
      assertOwner({ userId: "other" }, "user-1"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
