import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const StackTypeSchema = z.enum([
  "FRONTEND",
  "BACKEND",
  "MOBILE",
  "DESKTOP",
  "CYBERSECURITY",
  "DEVOPS",
  "SOFTSKILLS",
  "TOOLS",
]);

export const optionalUrl = z
  .union([z.string().url(), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export async function assertOwner<T extends { userId?: string | null }>(
  entity: T | null,
  userId: string,
): Promise<T> {
  if (!entity || entity.userId !== userId) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return entity;
}
