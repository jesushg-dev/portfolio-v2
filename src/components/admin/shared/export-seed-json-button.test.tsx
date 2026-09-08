import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ExportSeedJsonButton } from "./export-seed-json-button";
import { renderWithIntl } from "@/test-utils/render-with-intl";

const mockFetchSkills = jest.fn();
const mockFetchAllZip = jest.fn();

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      portfolioSeedExport: {
        skills: { fetch: mockFetchSkills },
        allZip: { fetch: mockFetchAllZip },
      },
    }),
  },
}));

describe("ExportSeedJsonButton", () => {
  // jsdom does not implement blob URLs; stub them and restore the descriptors.
  const originalCreateObjectURL = Object.getOwnPropertyDescriptor(
    URL,
    "createObjectURL",
  );
  const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(
    URL,
    "revokeObjectURL",
  );

  function restore(name: "createObjectURL" | "revokeObjectURL") {
    const descriptor =
      name === "createObjectURL"
        ? originalCreateObjectURL
        : originalRevokeObjectURL;
    if (descriptor) {
      Object.defineProperty(URL, name, descriptor);
    } else {
      Reflect.deleteProperty(URL, name);
    }
  }

  beforeEach(() => {
    mockFetchSkills.mockReset();
    mockFetchAllZip.mockReset();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: jest.fn(() => "blob:seed"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    restore("createObjectURL");
    restore("revokeObjectURL");
  });

  it("downloads the seed JSON returned by tRPC", async () => {
    mockFetchSkills.mockResolvedValue({
      fileName: "portfolio-skills.json",
      json: '[{"key":"Java"}]\n',
    });
    const click = jest.fn();
    HTMLAnchorElement.prototype.click = click;

    renderWithIntl(<ExportSeedJsonButton entity="skills" />);

    await userEvent.click(screen.getByRole("button", { name: /^export$/i }));

    await waitFor(() => {
      expect(mockFetchSkills).toHaveBeenCalled();
      expect(mockFetchAllZip).not.toHaveBeenCalled();
      expect(click).toHaveBeenCalled();
    });
  });

  it("downloads the seed ZIP returned by tRPC", async () => {
    mockFetchAllZip.mockResolvedValue({
      fileName: "portfolio-seed.json.zip",
      base64: "UEsDBAoAAAAAAIdO4FgAAAAAAAAAAAAAAAAJAAAAaGVsbG8udHh0",
    });
    const click = jest.fn();
    HTMLAnchorElement.prototype.click = click;

    renderWithIntl(<ExportSeedJsonButton entity="all" />);

    await userEvent.click(screen.getByRole("button", { name: /^export$/i }));

    await waitFor(() => {
      expect(mockFetchAllZip).toHaveBeenCalled();
      expect(mockFetchSkills).not.toHaveBeenCalled();
      expect(click).toHaveBeenCalled();
    });
  });
});
