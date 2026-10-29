"use client";
import {
  useFormContext,
  type FieldPath,
  type FieldPathByValue,
} from "react-hook-form";
import { FormControl, FormField } from "@/components/ui/form";
import { FormItem } from "@/components/shared/form-root";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { NowSettingsFormValues } from "../../lib/now-settings-schema";
interface TextProps {
  name: FieldPathByValue<NowSettingsFormValues, string> | (string & {});
  label: string;
  multiline?: boolean;
  placeholder?: string;
}
export function NowTextField({
  name,
  label,
  multiline,
  placeholder,
}: TextProps) {
  const { control } = useFormContext<NowSettingsFormValues>();
  return (
    <FormField
      control={control}
      name={name as FieldPath<NowSettingsFormValues>}
      render={({ field }) => (
        <FormItem label={label}>
          <FormControl>
            {multiline ? (
              <Textarea
                {...field}
                value={typeof field.value === "string" ? field.value : ""}
                rows={3}
                placeholder={placeholder}
              />
            ) : (
              <Input
                {...field}
                value={typeof field.value === "string" ? field.value : ""}
                placeholder={placeholder}
              />
            )}
          </FormControl>
        </FormItem>
      )}
    />
  );
}
export function NowNumberField({
  name,
  label,
  max,
}: {
  name: "readingProgress" | "watchedRating";
  label: string;
  max: number;
}) {
  const { control } = useFormContext<NowSettingsFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem label={label}>
          <FormControl>
            <Input
              {...field}
              type="number"
              min={0}
              max={max}
              value={Number.isFinite(field.value) ? field.value : ""}
              onChange={(event) => field.onChange(event.target.valueAsNumber)}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
