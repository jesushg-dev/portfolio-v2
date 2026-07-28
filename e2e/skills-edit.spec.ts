import { expect, test } from "@playwright/test";
import { getWorkerAuthFile } from "./helpers/auth-state";

import { cleanupUserSkills, fillSkillForm } from "./helpers/fill-skill-form";

test.describe("skills edit and data integrity", () => {
  test.use({ storageState: getWorkerAuthFile() });

  const uniqueId = Date.now();
  const uniqueTitle = `E2E Skill ${uniqueId}`;
  const tempSkill = {
    key: `e2e-skill-${uniqueId}`,
    title: uniqueTitle,
    image: "https://example.com/ts.png",
    type: "FRONTEND",
    translations: [
      {
        locale: "en" as const,
        description: "Typed JavaScript at scale",
        urlWiki: "https://wikipedia.org/wiki/TypeScript",
      },
      {
        locale: "es" as const,
        description: "JavaScript tipado",
        urlWiki: "https://es.wikipedia.org/wiki/TypeScript",
      },
    ],
  };

  test("creates a skill, edits title, verifies persistence, restores, and cleans up", async ({
    page,
  }) => {
    // 0. Go to admin base first
    await page.goto("/admin");

    // 1. Create skill without title collision
    await fillSkillForm(page, tempSkill, { verifyInList: false });
    await page.goto("/admin/skills");

    // 2. Open edit form
    const cell = page.getByRole("cell", { name: tempSkill.title }).first();
    await expect(cell).toBeVisible();

    const row = page.locator("tr").filter({ has: cell }).first();
    await row
      .getByRole("link", { name: /edit|editar/i })
      .first()
      .click();
    await page.waitForURL(/\/admin\/skills\/.*\/edit/, { timeout: 15_000 });

    // 3. Edit title and submit
    const titleInput = page.locator("#skill-title");
    await expect(titleInput).toHaveValue(tempSkill.title);

    const updatedTitle = `${tempSkill.title} (Updated)`;
    await titleInput.fill(updatedTitle);

    const updateResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/trpc/skillsAdmin.updateItem") &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30_000 },
    );

    await page.locator("#skill-form-submit").click();
    await updateResponse;

    // 4. Verify modified title in list
    await page.goto("/admin/skills");
    await expect(
      page.getByRole("cell", { name: updatedTitle }).first(),
    ).toBeVisible();

    // 5. Cleanup
    await cleanupUserSkills(page);
  });
});
