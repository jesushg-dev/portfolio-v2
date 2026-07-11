import "server-only";

import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";
import { z } from "zod";

import { type Locale, locales } from "@/i18n/config";
import { resolveStepsForLocale } from "@/features/terminal/lib/resolve";
import type {
  TerminalDisplayDTO,
  TerminalEditorDTO,
  TerminalStepResolved,
} from "@/features/terminal/lib/types";
import { translationMapEntries } from "@/lib/i18n/translation-map";
import {
  createTRPCRouter,
  protectedProcedure,
  tenantProcedure,
} from "@/server/api/trpc";
import type { db } from "@/server/db";

type DbClient = typeof db;
type DbLike = Prisma.TransactionClient | DbClient;

const TerminalStepTranslationMapSchema = z.record(
  z.string(),
  z.object({
    command: z.string(),
    output: z.string(),
  }),
);

const TerminalUpsertSchema = z.object({
  username: z.string().min(1),
  typingSpeed: z.number().int().positive().optional(),
  delayBetweenCommands: z.number().int().nonnegative().optional(),
  steps: z
    .array(
      z.object({
        order: z.number().int().nonnegative(),
        translations: TerminalStepTranslationMapSchema,
      }),
    )
    .min(1),
});

const terminalInclude = {
  steps: {
    orderBy: { order: "asc" as const },
    include: {
      translations: {
        include: { language: true },
      },
    },
  },
} satisfies Prisma.CvTerminalInclude;

type TerminalWithRelations = Prisma.CvTerminalGetPayload<{
  include: typeof terminalInclude;
}>;

const DEFAULT_TERMINAL_TYPING_SPEED = 45;
const DEFAULT_TERMINAL_DELAY = 1000;

function mapTerminalToEditorDto(
  terminal: TerminalWithRelations,
): TerminalEditorDTO {
  return {
    username: terminal.username,
    typingSpeed: terminal.typingSpeed,
    delayBetweenCommands: terminal.delayBetweenCommands,
    steps: terminal.steps.map((step) => ({
      id: step.id,
      order: step.order,
      translations: Object.fromEntries(
        step.translations.map((translation) => [
          translation.appLanguageId,
          {
            command: translation.command,
            output: translation.output,
          },
        ]),
      ),
    })),
  };
}

function mapTerminalToResolvedSteps(
  terminal: TerminalWithRelations,
): TerminalStepResolved[] {
  return terminal.steps.map((step) => ({
    order: step.order,
    translations: step.translations.map((translation) => ({
      appLanguageId: translation.appLanguageId,
      languageCode: translation.language.code,
      command: translation.command,
      output: translation.output,
    })),
  }));
}

async function fetchTerminalForUser(
  client: DbLike,
  userId: string,
): Promise<TerminalWithRelations | null> {
  return client.cvTerminal.findUnique({
    where: { userId },
    include: terminalInclude,
  });
}

async function getTerminalEditorDto(
  client: DbLike,
  userId: string,
): Promise<TerminalEditorDTO | null> {
  const terminal = await fetchTerminalForUser(client, userId);
  return terminal ? mapTerminalToEditorDto(terminal) : null;
}

async function getTerminalDisplayDto(
  client: DbLike,
  userId: string,
  locale: Locale,
  defaultLocale?: Locale,
): Promise<TerminalDisplayDTO | null> {
  const terminal = await fetchTerminalForUser(client, userId);
  if (!terminal || terminal.steps.length === 0) {
    return null;
  }

  const { commands, outputs } = resolveStepsForLocale(
    mapTerminalToResolvedSteps(terminal),
    locale,
    defaultLocale,
  );

  return {
    username: terminal.username,
    commands,
    outputs,
    typingSpeed: terminal.typingSpeed,
    delayBetweenCommands: terminal.delayBetweenCommands,
  };
}

async function upsertTerminal(
  client: DbClient,
  userId: string,
  input: z.infer<typeof TerminalUpsertSchema>,
): Promise<TerminalEditorDTO> {
  const terminal = await client.$transaction(async (tx) => {
    const upserted = await tx.cvTerminal.upsert({
      where: { userId },
      create: {
        userId,
        username: input.username,
        typingSpeed: input.typingSpeed ?? DEFAULT_TERMINAL_TYPING_SPEED,
        delayBetweenCommands:
          input.delayBetweenCommands ?? DEFAULT_TERMINAL_DELAY,
      },
      update: {
        username: input.username,
        typingSpeed: input.typingSpeed ?? DEFAULT_TERMINAL_TYPING_SPEED,
        delayBetweenCommands:
          input.delayBetweenCommands ?? DEFAULT_TERMINAL_DELAY,
      },
    });

    await tx.cvTerminalStep.deleteMany({
      where: { terminalId: upserted.id },
    });

    for (const step of [...input.steps].sort((a, b) => a.order - b.order)) {
      const translations = translationMapEntries(step.translations).filter(
        (entry) => entry.command.trim() !== "" || entry.output.trim() !== "",
      );

      if (translations.length === 0) continue;

      await tx.cvTerminalStep.create({
        data: {
          terminalId: upserted.id,
          order: step.order,
          translations: {
            create: translations.map((translation) => ({
              appLanguageId: translation.appLanguageId,
              command: translation.command,
              output: translation.output,
            })),
          },
        },
      });
    }

    return tx.cvTerminal.findUnique({
      where: { id: upserted.id },
      include: terminalInclude,
    });
  });

  if (!terminal) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to load terminal after upsert",
    });
  }

  return mapTerminalToEditorDto(terminal);
}

export const terminalRouter = createTRPCRouter({
  getMine: protectedProcedure.query(async ({ ctx }) =>
    getTerminalEditorDto(ctx.db, ctx.user.id),
  ),

  getPublic: tenantProcedure
    .input(z.object({ locale: z.enum(locales) }))
    .query(async ({ ctx, input }) =>
      getTerminalDisplayDto(
        ctx.db,
        ctx.tenant.userId,
        input.locale,
        ctx.tenant.defaultLocale,
      ),
    ),

  upsert: protectedProcedure
    .input(TerminalUpsertSchema)
    .mutation(async ({ ctx, input }) =>
      upsertTerminal(ctx.db, ctx.user.id, input),
    ),
});
