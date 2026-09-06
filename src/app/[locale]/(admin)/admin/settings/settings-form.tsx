"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { api } from "@/trpc/react";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormActions,
  FormCheckboxItem,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";

interface ISettingsFormProps {
  defaultValues: {
    username: string;
    displayName?: string;
    logoInitials?: string;
    logoImageUrl?: string;
    defaultLocale: "en" | "es" | "nl";
    isPublished: boolean;
    mapLocationLabel?: string;
  };
}

const SettingsForm: FC<ISettingsFormProps> = ({ defaultValues }) => {
  const t = useTranslations("admin.settings");
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const upsertProfile = api.cv.upsertProfile.useMutation();
  const utils = api.useUtils();

  const settingsSchema = useMemo(
    () =>
      z.object({
        username: z
          .string()
          .min(3)
          .max(40)
          .regex(/^[a-z0-9-]+$/, t("usernameValidation")),
        displayName: z.string().min(1).optional(),
        logoInitials: z.string().max(8).optional(),
        logoImageUrl: z.string().url().or(z.literal("")).optional(),
        defaultLocale: z.enum(["en", "es", "nl"]),
        isPublished: z.boolean(),
        mapLocationLabel: z.string().max(160).optional(),
      }),
    [t],
  );

  type SettingsInput = z.infer<typeof settingsSchema>;

  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ...defaultValues,
      logoInitials: defaultValues.logoInitials ?? "",
      logoImageUrl: defaultValues.logoImageUrl ?? "",
      mapLocationLabel: defaultValues.mapLocationLabel ?? "",
    },
  });

  const onSubmit = useCallback(
    (data: SettingsInput) => {
      startTransition(async () => {
        setSuccess(false);
        setServerError(null);
        try {
          await upsertProfile.mutateAsync({
            username: data.username,
            displayName: data.displayName,
            logoInitials: data.logoInitials ?? "",
            logoImageUrl: data.logoImageUrl ?? "",
            defaultLocale: data.defaultLocale,
            isPublished: data.isPublished,
            mapLocationLabel: data.mapLocationLabel ?? "",
          });
          await utils.cv.getMine.invalidate();
          setSuccess(true);
        } catch (err) {
          setServerError(err instanceof Error ? err.message : t("saveFailed"));
        }
      });
    },
    [t, upsertProfile, utils],
  );

  return (
    <Form {...form}>
      <FormRoot
        onSubmit={(e) => {
          void form.handleSubmit(onSubmit)(e);
        }}
        className="bg-card scroll-mt-24 rounded-xl p-6 shadow-sm"
      >
        <FormContent>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem label={t("username")} inputId="settings-username">
                <Input {...field} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem
                label={t("displayName")}
                inputId="settings-display-name"
              >
                <Input {...field} />
              </FormItem>
            )}
          />

          <FormSection
            title={t("brandSectionTitle")}
            description={t("brandSectionDescription")}
          >
            <FormField
              control={form.control}
              name="logoInitials"
              render={({ field }) => (
                <FormItem
                  label={t("logoInitials")}
                  description={t("logoInitialsHint")}
                  inputId="settings-logo-initials"
                >
                  <Input
                    maxLength={8}
                    placeholder={t("logoInitialsPlaceholder")}
                    {...field}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoImageUrl"
              render={({ field }) => (
                <FormItem
                  label={t("logoImageUrl")}
                  description={t("logoImageUrlHint")}
                  inputId="settings-logo-image-url"
                >
                  <Input
                    type="url"
                    placeholder={t("logoImageUrlPlaceholder")}
                    {...field}
                  />
                </FormItem>
              )}
            />
          </FormSection>

          <FormField
            control={form.control}
            name="defaultLocale"
            render={({ field }) => (
              <FormItem
                label={t("defaultLocale")}
                description={t("defaultLocaleHint")}
                inputId="settings-default-locale"
              >
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("defaultLocale")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="nl">Nederlands</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mapLocationLabel"
            render={({ field }) => (
              <FormItem
                label={t("mapLocation")}
                description={t("mapLocationHint")}
                inputId="settings-map-location"
              >
                <Input placeholder={t("mapLocationPlaceholder")} {...field} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <FormCheckboxItem label={t("publish")}>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormCheckboxItem>
            )}
          />

          <FormStatus
            error={serverError}
            success={success}
            successMessage={t("saved")}
          />
        </FormContent>

        <FormActions
          isPending={form.formState.isSubmitting || isPending}
          title={t("save")}
        />
      </FormRoot>
    </Form>
  );
};

export default SettingsForm;
