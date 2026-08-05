import { screen } from "@testing-library/react";
import React from "react";
import ContactMe from "./contact-me";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import {
  mockAppLanguages,
  mockCvPreviewData,
} from "@/test-utils/fixtures/cv-data";
import { mapCvDataToLocalized } from "./types";

jest.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

interface RawContactTranslation {
  appLanguageId?: string;
  label?: string;
}

interface RawContactItem {
  id?: string;
  type?: "EMAIL" | "PHONE" | "CALENDLY" | "LINKEDIN" | "OTHER";
  value?: string;
  order?: number;
  translations?: RawContactTranslation[];
}

function getLocalizedContacts(list: RawContactItem[]) {
  const mockData = {
    ...mockCvPreviewData,
    contacts: list.map((contact) => ({
      ...contact,
      id: contact.id ?? "1",
      type: contact.type ?? "OTHER",
      value: contact.value ?? "",
      order: contact.order ?? 0,
      translations: (contact.translations ?? []).map((t) => ({
        appLanguageId: t.appLanguageId ?? "lang-en",
        label: t.label ?? "",
      })),
    })),
  };
  return mapCvDataToLocalized(mockData, mockAppLanguages, "en").contacts;
}

describe("ContactMe", () => {
  it("renders null when contacts array is empty", () => {
    const { container } = renderWithIntl(<ContactMe contacts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders contact links with correct href formatting", () => {
    const contacts = [
      {
        id: "c1",
        type: "EMAIL" as const,
        value: "test@example.com",
        translations: [{ appLanguageId: "lang-en", label: "Email Me" }],
      },
      {
        id: "c2",
        type: "EMAIL" as const,
        value: "mailto:direct@example.com",
        translations: [],
      },
      {
        id: "c3",
        type: "PHONE" as const,
        value: "+1 800 555 0199",
        translations: [],
      },
      {
        id: "c4",
        type: "PHONE" as const,
        value: "tel:+18005550199",
        translations: [],
      },
      {
        id: "c5",
        type: "CALENDLY" as const,
        value: "calendly.com/user",
        translations: [],
      },
      {
        id: "c6",
        type: "CALENDLY" as const,
        value: "https://calendly.com/user",
        translations: [],
      },
      {
        id: "c7",
        type: "LINKEDIN" as const,
        value: "https://linkedin.com/in/user",
        translations: [],
      },
      {
        id: "c8",
        type: "OTHER" as const,
        value: "https://myblog.com",
        translations: [],
      },
    ];

    renderWithIntl(<ContactMe contacts={getLocalizedContacts(contacts)} />);

    expect(screen.getByRole("link", { name: /Email Me/ })).toHaveAttribute(
      "href",
      "mailto:test@example.com",
    );
    expect(
      screen.getByRole("link", { name: /direct@example.com/ }),
    ).toHaveAttribute("href", "mailto:direct@example.com");
    expect(screen.getByRole("link", { name: /\+18005550199/ })).toHaveAttribute(
      "href",
      "tel:+18005550199",
    );
    const calendlyLinks = screen.getAllByRole("link", {
      name: /calendly.com\/user/i,
    });
    expect(calendlyLinks).toHaveLength(2);
    for (const link of calendlyLinks) {
      expect(link).toHaveAttribute("href", "/schedule");
    }
    expect(calendlyLinks[0]).not.toHaveAttribute("target");
  });
});
