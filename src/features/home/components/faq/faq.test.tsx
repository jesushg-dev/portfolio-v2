import { render, screen } from "@testing-library/react";
import HomeFaq from "./index";
import { api } from "@/trpc/server";

jest.mock("@/trpc/server", () => ({
  api: { portfolio: { getFaqItems: jest.fn() } },
}));
jest.mock("@/lib/public-site/locale", () => ({
  getPublicLocale: jest.fn().mockResolvedValue("en"),
}));
jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn().mockResolvedValue((key: string) => key),
}));

const getFaqItems = api.portfolio.getFaqItems as jest.Mock;

describe("HomeFaq", () => {
  it("hides the section when the tenant has no FAQ in the current language", async () => {
    getFaqItems.mockResolvedValue([]);
    const view = render(await HomeFaq({}));
    expect(view.container).toBeEmptyDOMElement();
    expect(getFaqItems).toHaveBeenCalledWith({ locale: "en" });
  });

  it("renders tenant content as escaped text", async () => {
    const answer = '<script>alert("injected")</script>';
    getFaqItems.mockResolvedValue([{ question: "Tenant question", answer }]);
    const view = render(await HomeFaq({}));
    expect(screen.getByText("Tenant question")).toBeInTheDocument();
    expect(screen.getByText(answer)).toBeInTheDocument();
    expect(view.container.querySelector("script")).toBeNull();
  });
});
