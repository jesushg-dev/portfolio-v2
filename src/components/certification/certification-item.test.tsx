import { screen } from "@testing-library/react";

import CertificateItem from "./certification-item";
import type { CertificateType } from "@/utils/interfaces/types";
import { renderWithIntl } from "@/test-utils/render-with-intl";

const baseCertificate = {
  id: "cert-1",
  title: "React Advanced",
  company: "Test Academy",
  image: null,
  url: "https://example.com/cert",
  issuedDate: new Date("2024-06-01").getTime(),
  idCredential: "ABC-123",
  type: ["FRONTEND"],
  userId: "user-1",
  appLanguageId: "lang-en",
  certificationId: "cert-base-1",
  createdAt: new Date(),
} satisfies CertificateType;

describe("CertificateItem", () => {
  it("renders title, company and credential id", () => {
    renderWithIntl(<CertificateItem {...baseCertificate} />);
    expect(screen.getByText("React Advanced")).toBeInTheDocument();
    expect(screen.getByText("Test Academy")).toBeInTheDocument();
    expect(screen.getByText("ABC-123")).toBeInTheDocument();
  });

  it("renders external link to certificate", () => {
    renderWithIntl(<CertificateItem {...baseCertificate} />);
    const links = screen.getAllByRole("link");
    expect(
      links.some(
        (link) => link.getAttribute("href") === "https://example.com/cert",
      ),
    ).toBe(true);
  });

  it("uses placeholder image when image is null", () => {
    renderWithIntl(<CertificateItem {...baseCertificate} />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain("placeholder");
  });
});
