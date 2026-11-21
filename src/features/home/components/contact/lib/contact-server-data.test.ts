import {
  escapeVcard,
  buildVCard,
  filterContactChannels,
} from "./contact-server-data";
import type { ContactLink } from "@/utils/contact-links";

describe("contact-server-data", () => {
  describe("escapeVcard", () => {
    it("escapes backslashes, newlines, commas, and semicolons", () => {
      const input = "Doe, John; Lead \\ Senior\nEngineer";
      expect(escapeVcard(input)).toBe(
        "Doe\\, John\\; Lead \\\\ Senior\\nEngineer",
      );
    });
  });

  describe("buildVCard", () => {
    const mockLinks: ContactLink[] = [
      {
        key: "email-0",
        href: "mailto:john@example.com",
        label: "email",
        icon: "email",
        accent: "#EA4335",
      },
      {
        key: "phone-1",
        href: "tel:+1234567890",
        label: "phone",
        icon: "phone",
        accent: "#34A853",
      },
      {
        key: "linkedin-2",
        href: "https://linkedin.com/in/johndoe",
        label: "linkedin",
        icon: "linkedin",
        accent: "#0077B5",
      },
      {
        key: "github-3",
        href: "https://github.com/johndoe",
        label: "github",
        icon: "github",
        accent: "#333333",
      },
    ];

    it("generates a valid RFC-compliant vCard string", () => {
      const vcard = buildVCard({
        name: "John Doe",
        title: "Senior Software Engineer",
        links: mockLinks,
      });

      expect(vcard).toContain("BEGIN:VCARD");
      expect(vcard).toContain("VERSION:3.0");
      expect(vcard).toContain("FN:John Doe");
      expect(vcard).toContain("N:;John Doe;;;");
      expect(vcard).toContain("TITLE:Senior Software Engineer");
      expect(vcard).toContain("EMAIL:john@example.com");
      expect(vcard).toContain("TEL:+1234567890");
      expect(vcard).toContain("URL:https://linkedin.com/in/johndoe");
      expect(vcard).not.toContain("https://github.com/johndoe");
      expect(vcard).toContain("END:VCARD");
    });
  });

  describe("filterContactChannels", () => {
    it("filters to primary contact channels and respects the limit", () => {
      const mockLinks: ContactLink[] = [
        {
          key: "email-0",
          href: "mailto:a@b.com",
          label: "email",
          icon: "email",
          accent: "#EA4335",
        },
        {
          key: "github-1",
          href: "https://github.com",
          label: "github",
          icon: "github",
          accent: "#333",
        },
        {
          key: "phone-2",
          href: "tel:+1",
          label: "phone",
          icon: "phone",
          accent: "#34A853",
        },
        {
          key: "whatsapp-3",
          href: "https://wa.me/1",
          label: "whatsapp",
          icon: "whatsapp",
          accent: "#25D366",
        },
        {
          key: "linkedin-4",
          href: "https://linkedin.com",
          label: "linkedin",
          icon: "linkedin",
          accent: "#0077B5",
        },
      ];

      const channels = filterContactChannels(mockLinks, 3);
      expect(channels).toHaveLength(3);
      expect(channels.map((c) => c.icon)).toEqual([
        "email",
        "phone",
        "whatsapp",
      ]);
    });
  });
});
