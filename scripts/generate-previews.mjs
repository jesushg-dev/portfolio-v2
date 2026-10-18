import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const LOCALES = ["en", "es", "nl"];

const PREVIEW_TARGETS = [
  {
    key: "curriculum",
    filename: "curriculum.webp",
    aliases: ["curriculum-vitae.webp"],
    paths: {
      en: "/curriculum-vitae",
      es: "/es/curriculum-vitae",
      nl: "/nl/curriculum-vitae",
    },
  },
  {
    key: "certificates",
    filename: "certificates.webp",
    paths: {
      en: "/certificates",
      es: "/es/certificados",
      nl: "/nl/certificaten",
    },
  },
  {
    key: "timeline",
    filename: "timeline.webp",
    paths: {
      en: "/timeline",
      es: "/es/linea-de-tiempo",
      nl: "/nl/tijdlijn",
    },
  },
  {
    key: "cv-generator",
    filename: "cv-generator.webp",
    paths: {
      en: "/register?next=/admin/cv",
      es: "/es/registrarse?next=/admin/cv",
      nl: "/nl/registreren?next=/admin/cv",
    },
  },
  {
    key: "projects",
    filename: "projects.webp",
    paths: {
      en: "/projects",
      es: "/es/proyectos",
      nl: "/nl/projecten",
    },
  },
  {
    key: "colophon",
    filename: "colophon.webp",
    paths: {
      en: "/colophon",
      es: "/es/colofon",
      nl: "/nl/colofon",
    },
  },
  {
    key: "stats",
    filename: "stats.webp",
    paths: {
      en: "/stats",
      es: "/es/estadisticas",
      nl: "/nl/statistieken",
    },
  },
  {
    key: "uses",
    filename: "uses.webp",
    paths: {
      en: "/uses",
      es: "/es/uses",
      nl: "/nl/uses",
    },
  },
  {
    key: "now",
    filename: "now.webp",
    paths: {
      en: "/now",
      es: "/es/now",
      nl: "/nl/now",
    },
  },
  {
    key: "process-how-i-use-ai",
    filename: "process-how-i-use-ai.webp",
    paths: {
      en: "/process/how-i-use-ai",
      es: "/es/proceso/how-i-use-ai",
      nl: "/nl/proces/how-i-use-ai",
    },
  },
  {
    key: "process-qa-collaboration",
    filename: "process-qa-collaboration.webp",
    paths: {
      en: "/process/qa-collaboration",
      es: "/es/proceso/qa-collaboration",
      nl: "/nl/proces/qa-collaboration",
    },
  },
];

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "msedge", headless: true });
  } catch {
    return await chromium.launch({ headless: true });
  }
}

async function main() {
  const urlArg = process.argv.find((arg) => arg.startsWith("--url="));
  let baseUrl = (
    urlArg?.split("=")[1] ||
    process.env.APP_URL ||
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");

  // Auto-correct common typo if user passes jesushg.dev instead of jesushg.com
  if (baseUrl.includes("jesushg.dev")) {
    console.log(
      `[previews] Note: redirecting 'jesushg.dev' to 'https://www.jesushg.com'`,
    );
    baseUrl = baseUrl.replace("jesushg.dev", "www.jesushg.com");
  }

  const localeArg = process.argv.find((arg) => arg.startsWith("--locale="));
  const specifiedLocale = localeArg?.split("=")[1];
  const activeLocales =
    specifiedLocale && LOCALES.includes(specifiedLocale)
      ? [specifiedLocale]
      : LOCALES;

  console.log(`[previews] Target baseUrl: ${baseUrl}`);
  console.log(`[previews] Target locales: [${activeLocales.join(", ")}]`);

  let serverReachable = false;
  try {
    const res = await fetch(baseUrl);
    serverReachable = true;
    if (!res.ok) {
      console.warn(
        `[previews] Warning: ${baseUrl} returned status ${res.status}`,
      );
    }
  } catch {
    if (!urlArg && !process.env.APP_URL) {
      const fallbackUrl = "http://127.0.0.1:3001";
      try {
        const fallbackRes = await fetch(fallbackUrl);
        baseUrl = fallbackUrl;
        serverReachable = true;
        console.log(
          `[previews] Note: Port 3000 unreachable, auto-switched to ${baseUrl}`,
        );
        if (!fallbackRes.ok) {
          console.warn(
            `[previews] Warning: ${baseUrl} returned status ${fallbackRes.status}`,
          );
        }
      } catch {
        // neither port reachable
      }
    }
  }

  if (!serverReachable) {
    console.error(`\n[previews] Error: Could not reach ${baseUrl}.`);
    console.error(
      `Please ensure your local dev server is running ('pnpm dev')`,
    );
    console.error(
      `or specify a live URL (e.g., 'pnpm update:previews --url=https://www.jesushg.com')\n`,
    );
    process.exit(1);
  }

  const outputDir = resolve(process.cwd(), "public", "previews");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  for (const locale of activeLocales) {
    console.log(
      `\n--- Capturing previews for locale: [${locale.toUpperCase()}] ---`,
    );
    const localeDir = resolve(outputDir, locale);
    if (!existsSync(localeDir)) {
      mkdirSync(localeDir, { recursive: true });
    }

    for (const target of PREVIEW_TARGETS) {
      const routePath = target.paths[locale] || target.paths.en;
      const targetUrl = `${baseUrl}${routePath}`;
      const destinationPath = resolve(localeDir, target.filename);

      try {
        console.log(`  -> [${locale}] Navigating to ${routePath}...`);
        const response = await page.goto(targetUrl, {
          waitUntil: "networkidle",
          timeout: 25000,
        });

        if (response && response.status() >= 400) {
          console.warn(
            `    ! Warning: ${routePath} returned HTTP ${response.status()} (page might not be deployed yet). Skipping to prevent saving a 404 image.`,
          );
          continue;
        }

        await page.waitForTimeout(600);

        const rawBuffer = await page.screenshot({ type: "png" });

        await sharp(rawBuffer)
          .resize(600, 375, { fit: "cover", position: "top" })
          .webp({ quality: 85 })
          .toFile(destinationPath);

        // Also save aliases for this locale if specified
        if (target.aliases) {
          for (const alias of target.aliases) {
            await sharp(rawBuffer)
              .resize(600, 375, { fit: "cover", position: "top" })
              .webp({ quality: 85 })
              .toFile(resolve(localeDir, alias));
          }
        }

        // If English or default, mirror to root public/previews/ for general backwards compatibility
        if (locale === "en") {
          await sharp(rawBuffer)
            .resize(600, 375, { fit: "cover", position: "top" })
            .webp({ quality: 85 })
            .toFile(resolve(outputDir, target.filename));

          if (target.aliases) {
            for (const alias of target.aliases) {
              await sharp(rawBuffer)
                .resize(600, 375, { fit: "cover", position: "top" })
                .webp({ quality: 85 })
                .toFile(resolve(outputDir, alias));
            }
          }
        }

        console.log(`    + Saved ${locale}/${target.filename}`);
      } catch (err) {
        console.error(
          `    x Failed to capture ${routePath}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  await browser.close();
  console.log(
    `\n[previews] Completed successfully! Previews saved in public/previews/[en|es|nl]/\n`,
  );
}

main().catch((err) => {
  console.error("[previews] Fatal error:", err);
  process.exit(1);
});
