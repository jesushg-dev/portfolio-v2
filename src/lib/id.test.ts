import { generateId } from "./id";

describe("generateId", () => {
  it("generates a 12-character random string with default options", () => {
    const id = generateId();
    expect(id).toHaveLength(12);
    expect(typeof id).toBe("string");
  });

  it("accepts object options as first argument", () => {
    const id = generateId({ length: 8, alphabet: "ABC" });
    expect(id).toHaveLength(8);
    expect(id).toMatch(/^[ABC]+$/);
  });

  it("accepts string as first argument without second options argument", () => {
    const id = generateId("prefix");
    expect(id).toHaveLength(12);
  });

  it("handles object options with missing alphabet or length", () => {
    const idNoAlphabet = generateId({ length: 15 });
    expect(idNoAlphabet).toHaveLength(15);

    const idNoLength = generateId({ alphabet: "XYZ" });
    expect(idNoLength).toHaveLength(12);
    expect(idNoLength).toMatch(/^[XYZ]+$/);
  });
});
