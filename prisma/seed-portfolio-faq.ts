import { readFileSync } from "node:fs";
import type { PrismaClient } from "@prisma/client";
import { restorePortfolioFaq } from "./lib/faq-seed";

export async function seedPortfolioFaq(
  prisma: PrismaClient,
  userId: string,
  langIds: Record<"es" | "en" | "nl", string>,
) {
  const source: unknown = JSON.parse(
    readFileSync(new URL("./data/portfolio-faq.json", import.meta.url), "utf8"),
  );
  await restorePortfolioFaq(prisma, userId, langIds, source);
}
