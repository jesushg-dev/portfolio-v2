import { renderToStaticMarkup } from "react-dom/server";

import Footer from "./index";

jest.mock("@/trpc/server", () => ({
  api: {
    contact: {
      getPublic: jest
        .fn()
        .mockResolvedValue({ contacts: [], portfolioUrl: null }),
    },
  },
}));

jest.mock("./footer-spotify-section", () => ({
  __esModule: true,
  default: () => null,
}));

const siteBrand = {
  mode: "text",
  text: "JH",
  label: "Jesús Hernández",
} as const;

it("renders important portfolio links in server HTML without interaction", async () => {
  const footer = await Footer({ siteBrand });
  const html = renderToStaticMarkup(footer);

  for (const pathname of [
    "/projects",
    "/curriculum-vitae",
    "/certificates",
    "/timeline",
  ]) {
    expect(html).toContain(`href="${pathname}"`);
  }
});

it("keeps a private CV out of the server-rendered navigation", async () => {
  const footer = await Footer({ siteBrand, cvPublic: false });
  const html = renderToStaticMarkup(footer);

  expect(html).not.toContain('href="/curriculum-vitae"');
  expect(html).toContain('href="/projects"');
});
