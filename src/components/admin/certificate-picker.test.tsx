import { screen, fireEvent } from "@testing-library/react";
import { CertificatePicker, type CertificateItem } from "./certificate-picker";
import { renderWithIntl } from "@/test-utils/render-with-intl";

const mockCertifications: CertificateItem[] = [
  {
    id: "cert-1",
    company: "Google",
    translations: {
      en: { title: "Google Cloud Architect" },
    },
  },
  {
    id: "cert-2",
    company: "Microsoft",
    translations: {
      en: { title: "Azure Developer Associate" },
    },
  },
];

let mockQueryData = { data: mockCertifications, pageCount: 1, totalCount: 2 };
let mockIsLoading = false;

jest.mock("@/trpc/react", () => ({
  api: {
    certificationsAdmin: {
      getMine: {
        useQuery: () => ({
          data: mockQueryData,
          isLoading: mockIsLoading,
        }),
      },
    },
  },
}));

describe("CertificatePicker", () => {
  beforeEach(() => {
    mockQueryData = { data: mockCertifications, pageCount: 1, totalCount: 2 };
    mockIsLoading = false;
  });

  it("renders list of certificates and handles search filtering", () => {
    const onChange = jest.fn();
    renderWithIntl(
      <CertificatePicker selectedCertificateIds={[]} onChange={onChange} />,
    );

    expect(screen.getByText("Google Cloud Architect")).toBeInTheDocument();
    expect(screen.getByText("Azure Developer Associate")).toBeInTheDocument();

    const searchInput = screen.getByRole("searchbox");
    fireEvent.change(searchInput, { target: { value: "Azure" } });

    expect(
      screen.queryByText("Google Cloud Architect"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Azure Developer Associate")).toBeInTheDocument();
  });

  it("toggles certificate selection on click", () => {
    const onChange = jest.fn();
    renderWithIntl(
      <CertificatePicker
        selectedCertificateIds={["cert-1"]}
        onChange={onChange}
      />,
    );

    const cert2Button = screen.getByRole("button", {
      name: /Azure Developer Associate/i,
    });
    fireEvent.click(cert2Button);

    expect(onChange).toHaveBeenCalledWith(["cert-1", "cert-2"]);

    const cert1Button = screen.getByRole("button", {
      name: /Google Cloud Architect/i,
    });
    fireEvent.click(cert1Button);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("clears all selected certificates when clear all is clicked", () => {
    const onChange = jest.fn();
    renderWithIntl(
      <CertificatePicker
        selectedCertificateIds={["cert-1", "cert-2"]}
        onChange={onChange}
      />,
    );

    const clearButton = screen.getByRole("button", { name: /clear all/i });
    fireEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("renders compact mode with chips", () => {
    const onChange = jest.fn();
    renderWithIntl(
      <CertificatePicker
        selectedCertificateIds={["cert-1"]}
        onChange={onChange}
        compact
      />,
    );

    expect(screen.getByText("Google Cloud Architect")).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();

    const removeBtn = screen.getByRole("button", { name: /click to remove/i });
    fireEvent.click(removeBtn);

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
