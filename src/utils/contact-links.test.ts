import { buildContactLinks } from "./contact-links";

describe("buildContactLinks", () => {
  it("maps email, github, linkedin, and whatsapp contacts", () => {
    const links = buildContactLinks([
      { type: "EMAIL", value: "hello@example.com", label: null },
      { type: "GITHUB", value: "jess232017", label: null },
      {
        type: "LINKEDIN",
        value: "https://linkedin.com/in/jesushg-dev",
        label: null,
      },
      { type: "PHONE", value: "+50586793204", label: { en: "WhatsApp" } },
    ]);

    expect(links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: "mailto:hello@example.com",
          label: "email",
          icon: "email",
        }),
        expect.objectContaining({
          href: "https://github.com/jess232017",
          label: "github",
          icon: "github",
        }),
        expect.objectContaining({
          href: "https://linkedin.com/in/jesushg-dev",
          label: "linkedin",
          icon: "linkedin",
        }),
        expect.objectContaining({
          href: "https://wa.me/50586793204",
          label: "whatsapp",
          icon: "whatsapp",
        }),
      ]),
    );
  });

  it("handles PHONE without WhatsApp hint as a regular phone link", () => {
    const links = buildContactLinks([
      { type: "PHONE", value: "+1-800-555-0100", label: null },
    ]);
    expect(links[0]).toMatchObject({
      href: "tel:+18005550100",
      label: "phone",
      icon: "phone",
      accent: "#34A853",
    });
  });

  it("maps WEBSITE contacts for live portfolio channel links", () => {
    const links = buildContactLinks([
      { type: "WEBSITE", value: "mysite.com", label: null },
      { type: "EMAIL", value: "hello@example.com", label: null },
    ]);
    expect(links).toHaveLength(2);
    expect(links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: "https://mysite.com",
          label: "website",
          icon: "website",
        }),
        expect.objectContaining({ icon: "email" }),
      ]),
    );
  });

  it("excludes only the portfolio URL when excludePortfolioUrl is set", () => {
    const links = buildContactLinks(
      [
        { type: "WEBSITE", value: "https://jess.dev/", label: null },
        { type: "WEBSITE", value: "blog.example.com", label: null },
      ],
      { excludePortfolioUrl: "https://jess.dev" },
    );
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      href: "https://blog.example.com",
      icon: "website",
    });
  });

  it("maps LOCATION to a Google Maps search URL", () => {
    const links = buildContactLinks([
      { type: "LOCATION", value: "New York, NY", label: null },
    ]);
    expect(links[0]?.href).toContain("google.com/maps/search");
    expect(links[0]?.href).toContain(encodeURIComponent("New York, NY"));
    expect(links[0]?.icon).toBe("location");
  });

  it("ignores CALENDLY contacts in channel links", () => {
    const links = buildContactLinks([
      { type: "CALENDLY", value: "calendly.com/myuser", label: null },
      { type: "EMAIL", value: "hello@example.com", label: null },
    ]);
    expect(links).toHaveLength(1);
    expect(links[0]?.icon).toBe("email");
  });

  it("skips contacts with empty values", () => {
    const links = buildContactLinks([
      { type: "EMAIL", value: "   ", label: null },
      { type: "GITHUB", value: "", label: null },
    ]);
    expect(links).toHaveLength(0);
  });

  it("handles EMAIL that already has mailto: prefix", () => {
    const links = buildContactLinks([
      { type: "EMAIL", value: "mailto:info@example.com", label: null },
    ]);
    expect(links[0]?.href).toBe("mailto:info@example.com");
  });

  it("uses a string label correctly in WhatsApp detection", () => {
    // label is a plain string containing "whatsapp"
    const links = buildContactLinks([
      { type: "PHONE", value: "60123456789", label: "WhatsApp" },
    ]);
    expect(links[0]?.icon).toBe("whatsapp");
  });

  it("ignores unknown contact types without throwing", () => {
    const links = buildContactLinks([
      // @ts-expect-error testing unknown type
      { type: "UNKNOWN_TYPE", value: "something", label: null },
    ]);
    expect(links).toHaveLength(0);
  });

  it("handles label as primitive non-string or object with non-string values", () => {
    // label is a number -> labelText returns ""
    const links1 = buildContactLinks([
      { type: "PHONE", value: "12345", label: 123 },
    ]);
    expect(links1[0]?.icon).toBe("phone");

    // label is an object with numeric values -> labelText returns ""
    const links2 = buildContactLinks([
      { type: "PHONE", value: "12345", label: { num: 456 } },
    ]);
    expect(links2[0]?.icon).toBe("phone");
  });
});
