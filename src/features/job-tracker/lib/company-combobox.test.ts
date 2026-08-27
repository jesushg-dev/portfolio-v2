import {
  decodeNewCompanyName,
  encodeNewCompanyName,
  isNewCompanyValue,
  matchCompanyByName,
  resolveCompanyLabel,
} from "./company-combobox";

describe("company-combobox helpers", () => {
  const companies = [
    { id: "c1", name: "Acme Corp" },
    { id: "c2", name: "Tekton Labs" },
  ];

  it("encodes and decodes new company names", () => {
    const encoded = encodeNewCompanyName("New Startup");
    expect(isNewCompanyValue(encoded)).toBe(true);
    expect(decodeNewCompanyName(encoded)).toBe("New Startup");
  });

  it("resolves existing company labels", () => {
    expect(resolveCompanyLabel("c1", companies)).toBe("Acme Corp");
  });

  it("resolves pending new company labels", () => {
    const encoded = encodeNewCompanyName("Future Inc");
    expect(resolveCompanyLabel(encoded, companies)).toBe("Future Inc");
  });

  it("returns null for decodeNewCompanyName when value has no prefix", () => {
    expect(decodeNewCompanyName("some-company-id")).toBeNull();
  });

  it("returns null for decodeNewCompanyName when name after prefix is whitespace-only", () => {
    // encode whitespace to produce a valid prefix but empty trimmed name
    const encoded = encodeNewCompanyName("   ");
    // name.trim() is "" → length is 0 → returns null
    expect(decodeNewCompanyName(encoded)).toBeNull();
  });

  it("returns false for isNewCompanyValue when value has no prefix", () => {
    expect(isNewCompanyValue("c1")).toBe(false);
  });

  it("returns null for resolveCompanyLabel when value is empty", () => {
    expect(resolveCompanyLabel("", companies)).toBeNull();
  });

  it("returns null for resolveCompanyLabel when company id is not found", () => {
    expect(resolveCompanyLabel("unknown-id", companies)).toBeNull();
  });

  it("matches an existing company by name case-insensitively", () => {
    expect(matchCompanyByName("acme corp", companies)).toBe("c1");
  });

  it("encodes a pending company when the name is new", () => {
    expect(matchCompanyByName("JuegaOk", companies)).toBe(
      encodeNewCompanyName("JuegaOk"),
    );
  });

  it("returns null for an empty imported company name", () => {
    expect(matchCompanyByName("   ", companies)).toBeNull();
  });
});
