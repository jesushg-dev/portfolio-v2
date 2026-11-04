import { z } from "zod";

export const FaqItemSchema = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(5000),
});

export const FaqItemsSchema = z.array(FaqItemSchema).max(30);
export type FaqItem = z.infer<typeof FaqItemSchema>;

/** Invalid stored content is omitted rather than replaced with another owner's claims. */
export function parseFaqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).flatMap((item) => {
    const result = FaqItemSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
}
