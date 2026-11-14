import { render, screen, fireEvent, act } from "@testing-library/react";
import { ContactDirectCard } from "./contact-direct-card";
import type { PublicContact } from "@/utils/contact-links";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("ContactDirectCard", () => {
  const mockContacts: PublicContact[] = [
    {
      type: "EMAIL",
      value: "jesus.hernandez@jesushg.com",
      label: "jesus.hernandez@jesushg.com",
    },
    {
      type: "PHONE",
      value: "tel:505,86793204",
      label: "+505 8679 3204",
    },
    {
      type: "LINKEDIN",
      value: "https://www.linkedin.com/in/jesushg-dev",
      label: "linkedin/jesushg-dev",
    },
  ];

  it("renders email, phone, and linkedin channels correctly", () => {
    render(
      <ContactDirectCard contacts={mockContacts} schedulingEnabled={false} />,
    );

    expect(screen.getByText("jesus.hernandez@jesushg.com")).toBeInTheDocument();
    expect(screen.getByText("+505 8679 3204")).toBeInTheDocument();
    expect(screen.getByText("linkedin/jesushg-dev")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "direct.write" })).toHaveAttribute(
      "href",
      "mailto:jesus.hernandez@jesushg.com",
    );
  });

  it("copies email to clipboard on copy click", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });

    render(
      <ContactDirectCard contacts={mockContacts} schedulingEnabled={false} />,
    );

    const copyButton = screen.getByRole("button", {
      name: "direct.copyEmailAria",
    });
    await act(async () => {
      fireEvent.click(copyButton);
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith("jesus.hernandez@jesushg.com");
  });

  it("shows scheduling link when schedulingEnabled is true", () => {
    render(
      <ContactDirectCard contacts={mockContacts} schedulingEnabled={true} />,
    );

    expect(screen.getByText("direct.scheduleCall")).toBeInTheDocument();
  });
});
