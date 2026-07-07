import "server-only";

import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";

import { type Locale } from "@/i18n/config";
import { resolveStepsForLocale } from "@/features/terminal/lib/resolve";
import type {
  TerminalDisplayDTO,
  TerminalEditorDTO,
  TerminalStepResolved,
  TerminalUpsertInput,
} from "@/features/terminal/lib/types";
import { type db } from "@/server/db";

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

type DbClient = typeof db;

const DEFAULT_TERMINAL_TYPING_SPEED = 45;
const DEFAULT_TERMINAL_DELAY = 1000;

const mapTerminalToEditorDto = (
  terminal: TerminalWithRelations,
): TerminalEditorDTO => ({
  username: terminal.username,
  typingSpeed: terminal.typingSpeed,
  delayBetweenCommands: terminal.delayBetweenCommands,
  steps: terminal.steps.map((step) => ({
    id: step.id,
    order: step.order,
    translationsByLangId: Object.fromEntries(
      step.translations.map((translation) => [
        translation.appLanguageId,
        {
          command: translation.command,
          output: translation.output,
        },
      ]),
    ),
  })),
});

const mapTerminalToResolvedSteps = (
  terminal: TerminalWithRelations,
): TerminalStepResolved[] =>
  terminal.steps.map((step) => ({
    order: step.order,
    translations: step.translations.map((translation) => ({
      appLanguageId: translation.appLanguageId,
      languageCode: translation.language.code,
      command: translation.command,
      output: translation.output,
    })),
  }));

const fetchTerminalForUser = async (
  client: DbClient,
  userId: string,
): Promise<TerminalWithRelations | null> =>
  client.cvTerminal.findUnique({
    where: { userId },
    include: terminalInclude,
  });

export const getTerminalEditorDto = async (
  client: DbClient,
  userId: string,
): Promise<TerminalEditorDTO | null> => {
  const terminal = await fetchTerminalForUser(client, userId);
  return terminal ? mapTerminalToEditorDto(terminal) : null;
};

export const getTerminalDisplayDto = async (
  client: DbClient,
  userId: string,
  locale: Locale,
  defaultLocale?: Locale,
): Promise<TerminalDisplayDTO | null> => {
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
};

export const upsertTerminalFromEditor = async (
  client: DbClient,
  userId: string,
  input: TerminalUpsertInput,
): Promise<TerminalEditorDTO> => {
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
      await tx.cvTerminalStep.create({
        data: {
          terminalId: upserted.id,
          order: step.order,
          translations: {
            create: step.translations.map((translation) => ({
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
};
