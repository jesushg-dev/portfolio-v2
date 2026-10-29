"use client";

import { useState } from "react";
import type { AppLanguage } from "@prisma/client";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { FormItem, FormRoot } from "@/components/shared/form-root";
import { LocalizedFormLanguageBar } from "@/components/admin/shared/localized-form-language-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  minuteLabel,
  parseMinute,
  statusSlotSchema,
  type StatusSlotInput,
} from "../../lib/status-schedule";
import {
  findRoutineConflict,
  routineDayPreset,
  routineTime,
  ROUTINE_DAY_GROUPS,
} from "../../lib/routine-editor";

interface DayPickerProps {
  days: number[];
  onChange: (days: number[]) => void;
}
function RoutineDayPicker({ days, onChange }: DayPickerProps) {
  const t = useTranslations("admin.forms.nowSettings");
  const [custom, setCustom] = useState(false);
  const preset = custom ? "custom" : routineDayPreset(days);
  return (
    <div className="space-y-3">
      <Select
        value={preset}
        onValueChange={(value) => {
          if (value === "custom") {
            setCustom(true);
            return;
          }
          if (
            value === "daily" ||
            value === "weekdays" ||
            value === "weekends"
          ) {
            setCustom(false);
            onChange([...ROUTINE_DAY_GROUPS[value]]);
          }
        }}
      >
        <SelectTrigger className="w-full" aria-label={t("weekdays")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(["daily", "weekdays", "weekends", "custom"] as const).map(
            (value) => (
              <SelectItem key={value} value={value}>
                {t(`routineDays.${value}`)}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>
      {preset === "custom" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {([1, 2, 3, 4, 5, 6, 0] as const).map((day) => (
            <Label key={day} className="flex items-center gap-2">
              <Checkbox
                checked={days.includes(day)}
                onCheckedChange={(checked) =>
                  onChange(
                    checked === true
                      ? [...days, day]
                      : days.filter((value) => value !== day),
                  )
                }
              />
              {t(`day${day}`)}
            </Label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
interface Props {
  value: StatusSlotInput;
  otherSlots: StatusSlotInput[];
  languages: AppLanguage[];
  initialLangId: string;
  editing: boolean;
  onClose: () => void;
  onApply: (value: StatusSlotInput) => void;
}
export function NowRoutineDialog({
  value,
  otherSlots,
  languages,
  initialLangId,
  editing,
  onClose,
  onApply,
}: Props) {
  const t = useTranslations("admin.forms.nowSettings");
  const locale = useLocale();
  const [activeLangId, setActiveLangId] = useState(initialLangId);
  const form = useForm<StatusSlotInput>({
    resolver: zodResolver(statusSlotSchema),
    defaultValues: value,
  });
  const translations = useWatch({
    control: form.control,
    name: "translations",
  });
  const start = useWatch({ control: form.control, name: "startMinute" });
  const end = useWatch({ control: form.control, name: "endMinute" });
  const languageProgress = languages.map((language) => ({
    id: language.id,
    code: language.code,
    name: language.name || language.code,
    isBase: language.code === "en",
    hasContent: Boolean(translations[language.id]?.body.trim()),
    completedCount: translations[language.id]?.body.trim() ? 1 : 0,
    totalCount: 1,
  }));
  const onSubmit = (next: StatusSlotInput) => {
    const conflict = findRoutineConflict(next, otherSlots);
    if (conflict) {
      const name =
        [
          conflict.translations[activeLangId],
          ...Object.values(conflict.translations),
        ].find((row) => Boolean(row?.body.trim()))?.body ??
        t("routineUntitled");
      form.setError("root", {
        message: t("routineOverlap", {
          name,
          start: routineTime(conflict.startMinute, locale),
          end: routineTime(conflict.endMinute, locale),
        }),
      });
      return;
    }
    onApply(next);
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t(editing ? "routineEdit" : "routineAdd")}</DialogTitle>
          <DialogDescription>{t("routineDialogHint")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <FormRoot
            className="gap-5"
            onSubmit={(event) => {
              event.stopPropagation();
              void form.handleSubmit(onSubmit)(event);
            }}
          >
            <LocalizedFormLanguageBar
              languages={languageProgress}
              activeLangId={activeLangId}
              onSelectLang={setActiveLangId}
            />
            <div className="grid grid-cols-[4.5rem_1fr] items-start gap-3">
              <FormField
                control={form.control}
                name="emoji"
                render={({ field }) => (
                  <FormItem label={t("routineEmoji")}>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={16}
                        className="text-center text-xl"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`translations.${activeLangId}.body`}
                render={({ field }) => (
                  <FormItem label={t("routineActivity")}>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder={t("routineActivityPlaceholder")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            {form.formState.errors.translations ? (
              <p role="alert" className="text-destructive text-sm">
                {t("routineDescriptionRequired")}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              {(["startMinute", "endMinute"] as const).map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem
                      label={t(
                        name === "startMinute" ? "startTime" : "endTime",
                      )}
                    >
                      <FormControl>
                        <Input
                          type="time"
                          step={60}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={
                            Number.isFinite(field.value)
                              ? minuteLabel(field.value)
                              : ""
                          }
                          onChange={(event) =>
                            field.onChange(parseMinute(event.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            {Number.isFinite(start) && Number.isFinite(end) && end <= start ? (
              <p className="text-muted-foreground text-sm">
                {t(
                  end === start ? "routineFullDayHint" : "routineOvernightHint",
                )}
              </p>
            ) : null}
            <FormField
              control={form.control}
              name="weekdays"
              render={({ field }) => (
                <FormItem label={t("weekdays")}>
                  <RoutineDayPicker
                    days={field.value}
                    onChange={field.onChange}
                  />
                </FormItem>
              )}
            />
            {form.formState.errors.root?.message ? (
              <p role="alert" className="text-destructive text-sm">
                {form.formState.errors.root.message}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("routineCancel")}
              </Button>
              <Button type="submit">{t("routineApply")}</Button>
            </DialogFooter>
          </FormRoot>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
