import { Prisma, type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { NowTabInput } from "../lib/now-settings-schema";
import {
  mapNowSettingsToEditorDto,
  nowSettingsEditorInclude,
} from "../lib/now-editor-dto";

type SnapshotInput = Extract<NowTabInput, { tab: "snapshot" }>;

async function saveSnapshot(
  db: PrismaClient,
  userId: string,
  input: SnapshotInput,
) {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  const allowed = new Set(languages.map((language) => language.id));
  const ids = [
    ...Object.keys(input.translations),
    ...input.statusSchedule.flatMap((slot) => Object.keys(slot.translations)),
  ];
  if (ids.some((id) => !allowed.has(id)))
    throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown language" });
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const existing = await tx.nowSettings.upsert({
            where: { userId },
            create: { userId },
            update: { updatedAt: new Date() },
            include: nowSettingsEditorInclude,
          });
          const selectedIds = input.statusSchedule.flatMap((slot) =>
            slot.id ? [slot.id] : [],
          );
          if (
            selectedIds.some(
              (id) => !existing.statusSchedule.some((slot) => slot.id === id),
            )
          )
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Activity not found",
            });
          const statusRows = Object.entries(input.translations).filter(
            ([appLanguageId, fields]) => {
              const row = existing.NowSettingsTranslation.find(
                (item) => item.appLanguageId === appLanguageId,
              );
              return (
                row?.statusBody !== fields.statusBody ||
                row?.statusRelative !== fields.statusRelative
              );
            },
          );
          const newSlots = input.statusSchedule
            .filter((slot) => !slot.id)
            .map((slot) => ({
              startMinute: slot.startMinute,
              endMinute: slot.endMinute,
              weekdays: slot.weekdays,
              emoji: slot.emoji,
              translations: {
                create: Object.entries(slot.translations).map(
                  ([appLanguageId, row]) => ({ appLanguageId, body: row.body }),
                ),
              },
            }));
          const changedSlots = input.statusSchedule.flatMap(
            ({ id, translations, ...fields }) => {
              if (!id) return [];
              const previous = existing.statusSchedule.find(
                (slot) => slot.id === id,
              );
              if (!previous) return [];
              const changedRows = Object.entries(translations).filter(
                ([appLanguageId, row]) =>
                  previous.translations.find(
                    (item) => item.appLanguageId === appLanguageId,
                  )?.body !== row.body,
              );
              const sameDays =
                fields.weekdays.length === previous.weekdays.length &&
                fields.weekdays.every((day) => previous.weekdays.includes(day));
              if (
                previous.startMinute === fields.startMinute &&
                previous.endMinute === fields.endMinute &&
                previous.emoji === fields.emoji &&
                sameDays &&
                changedRows.length === 0
              )
                return [];
              return [
                {
                  where: { id },
                  data: {
                    ...fields,
                    translations: {
                      upsert: changedRows.map(([appLanguageId, row]) => ({
                        where: {
                          slotId_appLanguageId: { slotId: id, appLanguageId },
                        },
                        create: { appLanguageId, body: row.body },
                        update: { body: row.body },
                      })),
                    },
                  },
                },
              ];
            },
          );
          const updated = await tx.nowSettings.update({
            where: { id: existing.id },
            data: {
              timezone: input.timezone,
              statusEmoji: input.statusEmoji,
              NowSettingsTranslation: {
                upsert: statusRows.map(([appLanguageId, fields]) => ({
                  where: {
                    nowSettingsId_appLanguageId: {
                      nowSettingsId: existing.id,
                      appLanguageId,
                    },
                  },
                  create: { appLanguageId, ...fields },
                  update: fields,
                })),
              },
              statusSchedule: {
                deleteMany: {
                  id: {
                    in: existing.statusSchedule
                      .filter((slot) => !selectedIds.includes(slot.id))
                      .map((slot) => slot.id),
                  },
                },
                create: newSlots,
                update: changedSlots,
              },
            },
            include: nowSettingsEditorInclude,
          });
          return {
            tab: "snapshot" as const,
            saved: true as const,
            statusSchedule: mapNowSettingsToEditorDto(updated, languages)
              .statusSchedule,
          };
        },
        { timeout: 15000, maxWait: 5000 },
      );
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2034" ||
        attempt >= 2
      )
        throw error;
    }
  }
}
export async function saveNowTab(
  db: PrismaClient,
  userId: string,
  input: NowTabInput,
) {
  if (input.tab === "snapshot") return saveSnapshot(db, userId, input);
  if (input.tab === "github") {
    const data = { githubUsername: input.githubUsername || null };
    await db.nowSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return { tab: "github" as const, saved: true as const };
  }
  const data = {
    readingTitle: input.readingTitle || null,
    readingAuthors: input.readingAuthors || null,
    readingCoverUrl: input.readingCoverUrl || null,
    readingProgress: input.readingProgress,
    watchedTitle: input.watchedTitle || null,
    watchedCoverUrl: input.watchedCoverUrl || null,
    watchedRating: input.watchedRating,
    photoUrls: input.photoUrls,
  };
  await db.nowSettings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  return { tab: "activity" as const, saved: true as const };
}
