import { expect, type Page } from "@playwright/test";

const languageNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  nl: "Dutch",
};

export async function selectFormTab(page: Page, name: string): Promise<void> {
  const tab = page.getByRole("tab", { name: new RegExp(`^${name}\\b`) });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
}

export async function selectFormLanguage(
  page: Page,
  locale: string,
): Promise<void> {
  const languages = page.getByRole("tablist", { name: "Language selector" });
  if (!(await languages.isVisible())) await selectFormTab(page, "Content");
  const tab = languages.getByRole("tab", {
    name: new RegExp(`^${languageNames[locale]}\\b`),
  });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  const startBlank = page.getByRole("button", {
    name: "Start blank",
    exact: true,
  });
  if (await startBlank.isVisible()) await startBlank.click();
}

export function translationField(
  page: Page,
  field: string,
  prefix = "translations",
) {
  return page.locator(`[name^="${prefix}."][name$=".${field}"]:visible`);
}
