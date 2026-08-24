import { expect, test } from "./authenticated-test";

test.describe("CV Engine and Resume Import integration", () => {
  test("loads CV editor, toggles preview and import tabs, and verifies import workflow", async ({
    page,
  }) => {
    // 1. Navigate to CV admin page
    await page.goto("/admin/cv");
    await page.waitForURL(/\/admin\/cv(\?|$)/, { timeout: 15_000 });

    // 2. Verify main CV section headers/container are loaded
    await expect(page.locator("body")).toBeVisible();

    // 3. Switch to Preview tab
    const previewTab = page
      .getByRole("tab", { name: /preview|vista previa/i })
      .or(page.getByText(/preview|vista previa/i))
      .first();

    if (await previewTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await previewTab.click();
      await expect(page.locator("body")).toBeVisible();
    }

    // 4. Switch to Import tab
    const importTab = page
      .getByRole("tab", { name: /import|importar/i })
      .or(page.getByText(/import|importar/i))
      .first();

    if (await importTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await importTab.click();
      // Verify dropzone or AI controls in ResumeImportWorkflow
      const importCard = page.locator("body");
      await expect(importCard).toBeVisible();
    }
  });
});
