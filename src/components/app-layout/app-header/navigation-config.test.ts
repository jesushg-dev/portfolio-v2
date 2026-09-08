import { processPagesToNavItems } from "./navigation-config";
import type { ProcessNavPage } from "@/lib/process-pages/process-nav-page";

describe("processPagesToNavItems", () => {
  it("maps published nav pages to process items using menuTitle and slug fallback", () => {
    const pages: ProcessNavPage[] = [
      {
        id: "1",
        slug: "how-i-use-ai",
        navIcon: "Bot",
        menuTitle: "How I use AI",
        navDescription: "AI tool integration and engineering workflow.",
      },
      {
        id: "2",
        slug: "qa-collaboration",
        navIcon: "HeartHandshake",
        menuTitle: "   ",
        navDescription: "  ",
      },
    ];

    const items = processPagesToNavItems(pages);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      kind: "process",
      slug: "how-i-use-ai",
      label: "How I use AI",
      description: "AI tool integration and engineering workflow.",
    });
    expect(items[1]?.label).toBe("qa-collaboration");
    expect(items[1]?.description).toBe("");
  });
});
