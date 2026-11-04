import { render, screen } from "@testing-library/react";
import { ContactAlternativeLinks } from "./contact-alternative-links";

jest.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
jest.mock("@/i18n/routing", () => ({ Link: "a" }));

describe("contact alternatives", () => {
  it("shows no invented channels when the owner has none configured", () => {
    const { container } = render(<ContactAlternativeLinks />);
    expect(container).toBeEmptyDOMElement();
  });

  it("uses the current owner's LinkedIn URL without creating a schedule link", () => {
    render(
      <ContactAlternativeLinks linkedinUrl="https://linkedin.com/in/another-owner" />,
    );
    expect(
      screen.getByRole("link", { name: "channels.linkedin" }),
    ).toHaveAttribute("href", "https://linkedin.com/in/another-owner");
    expect(
      screen.queryByRole("link", { name: "scheduleCall" }),
    ).not.toBeInTheDocument();
  });

  it("only exposes scheduling when enabled for the owner", () => {
    render(<ContactAlternativeLinks schedulingEnabled />);
    expect(screen.getByRole("link", { name: "scheduleCall" })).toHaveAttribute(
      "href",
      "/schedule",
    );
    expect(
      screen.queryByRole("link", { name: "channels.linkedin" }),
    ).not.toBeInTheDocument();
  });
});
