import {
  getCalendlyUrl,
  hasCalendlyContact,
  isSchedulePath,
} from "./calendly-url";

describe("getCalendlyUrl", () => {
  it("returns null when no CALENDLY contact exists", () => {
    expect(
      getCalendlyUrl([
        { type: "EMAIL", value: "hello@example.com", label: null },
      ]),
    ).toBeNull();
  });

  it("returns null when CALENDLY value is empty", () => {
    expect(
      getCalendlyUrl([{ type: "CALENDLY", value: "   ", label: null }]),
    ).toBeNull();
  });

  it("prefixes https:// when value has no protocol", () => {
    expect(
      getCalendlyUrl([
        { type: "CALENDLY", value: "calendly.com/myuser", label: null },
      ]),
    ).toBe("https://calendly.com/myuser");
  });

  it("passes through https:// URLs unchanged", () => {
    expect(
      getCalendlyUrl([
        { type: "CALENDLY", value: "https://calendly.com/myuser", label: null },
      ]),
    ).toBe("https://calendly.com/myuser");
  });

  it("passes through http:// URLs unchanged", () => {
    expect(
      getCalendlyUrl([
        { type: "CALENDLY", value: "http://calendly.com/myuser", label: null },
      ]),
    ).toBe("http://calendly.com/myuser");
  });
});

describe("hasCalendlyContact", () => {
  it("returns true when a valid CALENDLY contact exists", () => {
    expect(
      hasCalendlyContact([
        { type: "CALENDLY", value: "calendly.com/myuser", label: null },
      ]),
    ).toBe(true);
  });

  it("returns false when no valid CALENDLY contact exists", () => {
    expect(
      hasCalendlyContact([
        { type: "EMAIL", value: "hello@example.com", label: null },
      ]),
    ).toBe(false);
  });
});

describe("isSchedulePath", () => {
  it("matches localized schedule routes", () => {
    expect(isSchedulePath("/schedule")).toBe(true);
    expect(isSchedulePath("/agendar")).toBe(true);
    expect(isSchedulePath("/plannen")).toBe(true);
    expect(isSchedulePath("/")).toBe(false);
  });
});
