import {
  navGroupsForPublicSite,
  processPagesToNavItems,
} from "./navigation-config";
import type { ProcessNavPage } from "@/lib/process-pages/process-nav-page";

describe("navigation-config", () => {
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

  describe("navGroupsForPublicSite", () => {
    it("orders about group items to match the homepage order of appearance", () => {
      const groups = navGroupsForPublicSite(true, []);
      const aboutGroup = groups.find((g) => g.id === "about");
      expect(aboutGroup).toBeDefined();

      const itemIds = aboutGroup?.items.map((i) => i.id);
      expect(itemIds).toEqual([
        "about",
        "services",
        "soft-skills",
        "testimonials",
        "skills",
        "experience",
      ]);
    });

    it("places comingSoon items at the end of the process items list", () => {
      const groups = navGroupsForPublicSite(true, []);
      const processGroup = groups.find((g) => g.id === "process");
      expect(processGroup).toBeDefined();

      const itemIds = processGroup?.items.map((i) => i.id);
      expect(itemIds).toEqual(["stats", "colophon", "uses", "now"]);
    });

    it("filters out curriculum-vitae when cvPublic is false", () => {
      const groups = navGroupsForPublicSite(false, []);
      const portfolioGroup = groups.find((g) => g.id === "portfolio");
      expect(portfolioGroup).toBeDefined();

      const itemIds = portfolioGroup?.items.map((i) => i.id);
      expect(itemIds).not.toContain("curriculum");
    });
  });
});
