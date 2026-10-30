import { renderToStaticMarkup } from "react-dom/server";
import LcpImagePreload from "./lcp-image-preload";

jest.unmock("next/image");

it("emits one responsive photo preload restricted to desktop", () => {
  const html = renderToStaticMarkup(
    <LcpImagePreload href="https://res.cloudinary.com/demo/image/upload/portrait.jpg" />,
  );
  const document = new DOMParser().parseFromString(html, "text/html");
  const preloads = document.querySelectorAll('link[rel="preload"][as="image"]');
  expect(preloads).toHaveLength(1);
  expect(preloads[0].getAttribute("media")).toBe("(min-width: 64rem)");
  expect(preloads[0].getAttribute("imagesrcset")).toContain("384w");
});
