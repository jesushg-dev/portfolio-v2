import { expect, test } from "@playwright/test";

for (const pathname of ["/", "/es", "/nl"]) {
  test(`serves portfolio cards and main content without JavaScript: ${pathname}`, async ({
    page,
  }) => {
    const response = await page.goto(pathname, {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(200);
    expect(await response?.text()).not.toContain("adminCredentials");

    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("#about p").first()).not.toBeEmpty();
    await expect(page.locator("#services h2")).not.toBeEmpty();
    await expect(page.locator("#experience h2")).not.toBeEmpty();

    const cards = page.locator("#portfolio article");
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(page.locator("#portfolio-tab-panel-0 > ul")).toHaveCSS(
      "opacity",
      "1",
    );
    for (const card of await cards.all()) {
      await card.scrollIntoViewIfNeeded();
      await expect(card.locator("h3")).toBeVisible();
      await expect(card.locator("p").first()).not.toBeEmpty();
      await expect(card).toHaveCSS("opacity", "1");
    }

    const projectLink = page
      .locator(
        '#portfolio a[href*="/projects/"], #portfolio a[href*="/proyectos/"], #portfolio a[href*="/projecten/"]',
      )
      .first();
    await expect(projectLink).toHaveAttribute(
      "href",
      /\/(projects|proyectos|projecten)\/.+/,
    );
    const image = cards.locator('img[loading="lazy"]').first();
    await expect(image).toHaveAttribute("src", /.+/);
  });
}

test.describe("hydrated portfolio", () => {
  test.use({ javaScriptEnabled: true });

  test("loads live queries when the footer enters the viewport", async ({
    page,
  }) => {
    const errors: string[] = [];
    const queryRequests: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.url().includes("/api/trpc/"))
        queryRequests.push(request.url());
    });
    await page.goto("/", { waitUntil: "load" });
    await expect(page.locator("main h1")).toBeVisible();
    expect(queryRequests).toEqual([]);

    const playbackRequest = page.waitForRequest((request) =>
      request.url().includes("/api/trpc/spotify."),
    );
    const spotifyLink = page.locator(
      'footer a[href="https://developer.spotify.com/documentation/web-api"]',
    );
    await expect(async () => {
      await spotifyLink.scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, 50);
      await expect(spotifyLink).toBeInViewport({ timeout: 500 });
    }).toPass({ timeout: 15000 });
    await playbackRequest;
    expect(errors).toEqual([]);
  });

  test("keeps project filters interactive", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (/MISSING_MESSAGE|IntlError/.test(message.text())) {
        errors.push(message.text());
      }
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const frontend = page
      .locator("#portfolio")
      .getByRole("tab", { name: /^Frontend/ });
    await frontend.click();
    await expect(frontend).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#portfolio-tab-panel-1")).toBeVisible();
    expect(errors).toEqual([]);
  });

  for (const locale of ["en", "es", "nl"] as const) {
    test(`provides the required client translations on public routes: ${locale}`, async ({
      page,
    }) => {
      test.slow();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (/MISSING_MESSAGE|IntlError/.test(message.text())) {
          errors.push(message.text());
        }
      });
      const routes = {
        en: [
          "/now",
          "/projects",
          "/timeline",
          "/colophon",
          "/certificates",
          "/curriculum-vitae",
          "/theme-customizer",
          "/schedule",
          "/skills/javascript",
        ],
        es: [
          "/es/now",
          "/es/proyectos",
          "/es/linea-de-tiempo",
          "/es/colofon",
          "/es/certificados",
          "/es/curriculum-vitae",
          "/es/personalizar-tema",
          "/es/agendar",
          "/es/habilidades/javascript",
        ],
        nl: [
          "/nl/now",
          "/nl/projecten",
          "/nl/tijdlijn",
          "/nl/colofon",
          "/nl/certificaten",
          "/nl/curriculum-vitae",
          "/nl/thematool",
          "/nl/plannen",
          "/nl/vaardigheden/javascript",
        ],
      };
      for (const pathname of routes[locale]) {
        const response = await page.goto(pathname, { waitUntil: "load" });
        expect(response?.status(), pathname).toBe(200);
        await expect(page.locator("main h1").first()).toBeVisible();
      }
      expect(errors).toEqual([]);
    });
  }

  test("shares responsive hero candidates with the preload", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });
    const hero = page.locator("#top img");
    const srcSet = await hero.getAttribute("srcset");
    const sizes = await hero.getAttribute("sizes");
    expect(srcSet).toContain("/_next/image?");

    const preloads = await page
      .locator('link[rel="preload"][as="image"]')
      .evaluateAll((links) =>
        links.map((link) => ({
          srcSet: link.getAttribute("imagesrcset"),
          sizes: link.getAttribute("imagesizes"),
          media: link.getAttribute("media"),
        })),
      );
    expect(preloads).toContainEqual({
      srcSet,
      sizes,
      media: "(min-width: 64rem)",
    });
  });

  test("uses compositor properties for service micro-animations", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.locator("#services").scrollIntoViewIfNeeded();

    const properties = await page.evaluate(() => {
      const names = new Set([
        "bento-ring",
        "bento-blink",
        "bento-travel",
        "bento-sweep",
      ]);
      return document.getAnimations().flatMap((animation) => {
        if (
          !(animation instanceof CSSAnimation) ||
          !names.has(animation.animationName)
        )
          return [];
        if (!(animation.effect instanceof KeyframeEffect)) return [];
        return animation.effect
          .getKeyframes()
          .flatMap((frame) =>
            Object.keys(frame).filter(
              (key) =>
                !["offset", "computedOffset", "easing", "composite"].includes(
                  key,
                ),
            ),
          );
      });
    });

    expect(properties.length).toBeGreaterThan(0);
    expect(
      properties.every((property) =>
        ["transform", "opacity"].includes(property),
      ),
    ).toBe(true);
  });

  test("limits the hero photo preload to desktop home visits", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "load" });
    const preload = page.locator(
      'link[rel="preload"][as="image"][media="(min-width: 64rem)"]',
    );
    await expect(preload).toHaveCount(1);
    expect(
      await preload.evaluate(
        (link) => matchMedia((link as HTMLLinkElement).media).matches,
      ),
    ).toBe(false);
    await expect(page.locator("#top img")).toHaveAttribute("loading", "lazy");

    await page.goto("/now", { waitUntil: "load" });
    await expect(preload).toHaveCount(0);
  });
});

test.describe("initial page scroll", () => {
  test.use({ javaScriptEnabled: true });

  for (const pathname of ["/", "/now"]) {
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 390, height: 844 },
    ]) {
      test(`stays at the top during hydration: ${pathname}, ${viewport.width}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto(pathname, { waitUntil: "load" });
        // Observe the hydration/measurement window without clicking or scrolling.
        await page.waitForTimeout(3000);
        expect(await page.evaluate(() => window.scrollY)).toBe(0);
      });
    }
  }
});
