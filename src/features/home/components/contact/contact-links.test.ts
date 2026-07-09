import { buildContactLinks } from "./contact-links";

describe("buildContactLinks", () => {
  it("maps CV contacts into actionable links", () => {
    const links = buildContactLinks([
      { type: "EMAIL", value: "hello@example.com", label: null },
      { type: "GITHUB", value: "jess232017", label: null },
      {
        type: "LINKEDIN",
        value: "https://linkedin.com/in/jesus-hernandez23",
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
          href: "https://linkedin.com/in/jesus-hernandez23",
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
});
