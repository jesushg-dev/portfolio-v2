import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LocaleSelector from "./locale-selector";

const mockReplace = jest.fn();
const mockRefresh = jest.fn();

jest.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  usePathname: () => "/projects/[slug]",
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ slug: "walmart-centroamerica", locale: "en" }),
}));

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "menu.language": "Language",
      "menu.locale-options.en": "English",
      "menu.locale-options.es": "Spanish",
      "menu.locale-options.nl": "Dutch",
    };
    return translations[key] ?? key;
  },
}));

describe("LocaleSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders trigger with current locale", () => {
    render(<LocaleSelector />);
    const trigger = screen.getByTestId("locale-selector");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("English");
  });

  it("calls router.replace with pathname and params when changing locale", async () => {
    const user = userEvent.setup();
    render(<LocaleSelector />);

    const trigger = screen.getByTestId("locale-selector");
    await user.click(trigger);

    const spanishOption = await screen.findByRole("option", {
      name: /Español/i,
    });
    await user.click(spanishOption);

    expect(mockReplace).toHaveBeenCalledWith(
      {
        pathname: "/projects/[slug]",
        params: { slug: "walmart-centroamerica", locale: "en" },
      },
      { locale: "es" },
    );
  });
});
