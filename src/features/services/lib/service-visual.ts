import { z } from "zod";
import type { LanguageRef } from "@/lib/i18n/editor-rows";

export const serviceVisualTypes = [
  "network",
  "architecture",
  "frontend",
  "pipeline",
  "security",
  "mobile",
  "ai",
] as const;
export const serviceVisualTypeSchema = z.enum(serviceVisualTypes);
export type ServiceVisualType = z.infer<typeof serviceVisualTypeSchema>;
export const serviceVisualNodesSchema = z
  .array(z.object({ label: z.string().trim().min(1).max(48) }))
  .max(16);
export type ServiceVisualNode = z.infer<
  typeof serviceVisualNodesSchema
>[number];

export function parseServiceVisualNodes(value: unknown): ServiceVisualNode[] {
  const parsed = serviceVisualNodesSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function resolveServiceVisualNodes(
  translations: { appLanguageId: string; visualNodes?: unknown }[],
  languages: LanguageRef[],
  locale: string,
): ServiceVisualNode[] {
  const preferredIds = [
    languages.find((language) => language.code === locale)?.id,
    languages.find((language) => language.code === "en")?.id,
  ];
  for (const id of preferredIds) {
    const nodes = parseServiceVisualNodes(
      translations.find((translation) => translation.appLanguageId === id)
        ?.visualNodes,
    );
    if (nodes.length) return nodes;
  }
  return (
    translations
      .map((translation) => parseServiceVisualNodes(translation.visualNodes))
      .find((nodes) => nodes.length > 0) ?? []
  );
}
