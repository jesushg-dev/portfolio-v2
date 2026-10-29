"use client";

import { useState } from "react";
import type { AppLanguage } from "@prisma/client";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  routineDayPreset,
  routineTime,
  newRoutineSlot,
} from "../../lib/routine-editor";
import type { StatusSlotInput } from "../../lib/status-schedule";
import type { NowSettingsFormValues } from "../../lib/now-settings-schema";
import { NowRoutineDialog } from "./now-routine-dialog";

interface Props {
  languages: AppLanguage[];
  activeLangId: string;
}
interface EditingRoutine {
  index: number | null;
  value: StatusSlotInput;
}

export function NowScheduleEditor({ languages, activeLangId }: Props) {
  const t = useTranslations("admin.forms.nowSettings");
  const locale = useLocale();
  const { control, formState } = useFormContext<NowSettingsFormValues>();
  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "statusSchedule",
    keyName: "fieldKey",
  });
  const slots = useWatch({ control, name: "statusSchedule" });
  const [editing, setEditing] = useState<EditingRoutine | null>(null);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarClock aria-hidden className="text-primary size-5" />
            {t("scheduleTitle")}
          </h2>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            {t("routineEditorHint")}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={fields.length >= 32}
          onClick={() =>
            setEditing({ index: null, value: newRoutineSlot(languages, slots) })
          }
        >
          <Plus aria-hidden />
          {t("routineAdd")}
        </Button>
      </div>
      {!fields.length ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-5 text-sm">
          {t("noSlots")}
        </p>
      ) : (
        <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
          {fields.map((field, index) => {
            const slot = slots[index] ?? field;
            const title =
              [
                slot.translations[activeLangId],
                ...Object.values(slot.translations),
              ].find((row) => Boolean(row?.body.trim()))?.body ??
              t("routineUntitled");
            const preset = routineDayPreset(slot.weekdays);
            const days =
              preset === "custom"
                ? ([1, 2, 3, 4, 5, 6, 0] as const)
                    .filter((day) => slot.weekdays.includes(day))
                    .map((day) => t(`day${day}`))
                    .join(", ")
                : t(`routineDays.${preset}`);
            return (
              <li
                key={field.fieldKey}
                className="bg-card flex flex-wrap items-center gap-3 p-4"
              >
                <span
                  aria-hidden
                  className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg text-xl"
                >
                  {slot.emoji}
                </span>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="text-foreground font-medium">{title}</p>
                  <p className="text-muted-foreground mt-1 text-sm">{days}</p>
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {routineTime(slot.startMinute, locale)} –{" "}
                    {routineTime(slot.endMinute, locale)}
                    {slot.endMinute <= slot.startMinute
                      ? " · " +
                        t(
                          slot.endMinute === slot.startMinute
                            ? "routineFullDay"
                            : "routineNextDay",
                        )
                      : ""}
                  </p>
                  {formState.errors.statusSchedule?.[index] ? (
                    <p className="text-destructive mt-1 text-sm" role="alert">
                      {t("routineNeedsReview")}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-label={t("routineEditNamed", { name: title })}
                    onClick={() =>
                      setEditing({
                        index,
                        value: {
                          ...slot,
                          weekdays: [...slot.weekdays],
                          translations: Object.fromEntries(
                            Object.entries(slot.translations).map(
                              ([id, row]) => [id, { ...row }],
                            ),
                          ),
                        },
                      })
                    }
                  >
                    <Pencil aria-hidden />
                    {t("routineEdit")}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={t("routineRemoveNamed", { name: title })}
                    onClick={() => remove(index)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-muted-foreground text-xs">{t("routineSaveHint")}</p>
      {editing ? (
        <NowRoutineDialog
          key={editing.index ?? "new"}
          value={editing.value}
          otherSlots={slots.filter((_, index) => index !== editing.index)}
          languages={languages}
          initialLangId={activeLangId}
          editing={editing.index !== null}
          onClose={() => setEditing(null)}
          onApply={(value) => {
            if (editing.index === null) append(value);
            else update(editing.index, value);
            setEditing(null);
          }}
        />
      ) : null}
    </section>
  );
}
