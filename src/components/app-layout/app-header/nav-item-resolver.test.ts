import { User } from "lucide-react";
import { resolveNavItem, type NavTranslator } from "./nav-item-resolver";
import type { NavLinkItem, NavRouteItem } from "./navigation-config";

describe("resolveNavItem", () => {
  it("resolves a section nav item with custom translation", () => {
    const item: NavLinkItem = {
      kind: "section",
      id: "about",
      sectionId: "about",
      icon: User,
      chips: ["Profile summary"],
      stat: { value: "6+", label: "years" },
    };

    const mockT = Object.assign(
      (key: string) => {
        if (key === "items.about.label") return "About me";
        if (key === "items.about.headline") return "Who I am";
        if (key === "items.about.description") return "My profile text";
        if (key === "items.about.short") return "Short bio";
        return key;
      },
      {
        has: () => true,
        raw: () => ["Chip 1", "Chip 2"],
      },
    ) as unknown as NavTranslator;

    const resolved = resolveNavItem(item, mockT);

    expect(resolved.id).toBe("about");
    expect(resolved.label).toBe("About me");
    expect(resolved.headline).toBe("Who I am");
    expect(resolved.description).toBe("My profile text");
    expect(resolved.short).toBe("Short bio");
    expect(resolved.chips).toEqual(["Chip 1", "Chip 2"]);
    expect(resolved.href).toEqual({ pathname: "/", hash: "#about" });
  });

  it("resolves route item and respects comingSoon", () => {
    const item: NavRouteItem = {
      kind: "route",
      id: "uses",
      href: "/uses",
      icon: User,
      comingSoon: true,
      chips: ["Hardware"],
    };

    const mockT = Object.assign(
      (key: string) => (key === "explore" ? "Explore" : key),
      {
        has: () => false,
        raw: () => undefined,
      },
    ) as unknown as NavTranslator;

    const resolved = resolveNavItem(item, mockT);

    expect(resolved.id).toBe("uses");
    expect(resolved.comingSoon).toBe(true);
    expect(resolved.chips).toEqual(["Hardware"]);
    expect(resolved.href).toBe("/uses");
  });
});
