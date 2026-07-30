import { render, screen } from "@testing-library/react";
import React from "react";
import ContactMe from "./contact-me";

jest.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("ContactMe", () => {
  it("renders null when contacts array is empty", () => {
    const { container } = render(
      <ContactMe contacts={[]} locale="en" defaultLocale="en" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders contact links with correct href formatting", () => {
    const contacts = [
      {
        id: "c1",
        type: "EMAIL" as const,
        value: "test@example.com",
        label: { default: "Email Me" },
      },
      {
        id: "c2",
        type: "EMAIL" as const,
        value: "mailto:direct@example.com",
        label: null,
      },
      {
        id: "c3",
        type: "PHONE" as const,
        value: "+1 800 555 0199",
        label: null,
      },
      {
        id: "c4",
        type: "PHONE" as const,
        value: "tel:+18005550199",
        label: null,
      },
      {
        id: "c5",
        type: "CALENDLY" as const,
        value: "calendly.com/user",
        label: null,
      },
      {
        id: "c6",
        type: "CALENDLY" as const,
        value: "https://calendly.com/user",
        label: null,
      },
      {
        id: "c7",
        type: "LINKEDIN" as const,
        value: "https://linkedin.com/in/user",
        label: null,
      },
      {
        id: "c8",
        type: "OTHER" as const,
        value: "https://myblog.com",
        label: null,
      },
    ];

    render(
      <ContactMe
        contacts={
          contacts as unknown as Parameters<typeof ContactMe>[0]["contacts"]
        }
        locale="en"
        defaultLocale="en"
      />,
    );

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
