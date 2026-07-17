import {
  decodeNewCompanyName,
  encodeNewCompanyName,
  isNewCompanyValue,
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
});
