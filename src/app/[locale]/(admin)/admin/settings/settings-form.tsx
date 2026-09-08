"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { FC } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  ImageIcon,
  MapPin,
  Sparkles,
  User,
} from "lucide-react";

import { api } from "@/trpc/react";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
} from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  const watchedValues = useWatch({
    control: form.control,
  });

  const activeInitials =
    (watchedValues.logoInitials?.trim() !== ""
      ? watchedValues.logoInitials?.trim()
      : undefined) ??
    (watchedValues.displayName
      ? watchedValues.displayName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 3)
          .toUpperCase()
      : "CV");

  const activeLogoUrl = watchedValues.logoImageUrl?.trim() ?? "";
  const isPublished = watchedValues.isPublished ?? false;
  const currentUsername =
    (watchedValues.username?.trim() !== ""
      ? watchedValues.username?.trim()
      : undefined) ?? "username";

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
        className="flex flex-col gap-6"
      >
        <FormContent className="flex flex-col gap-6">
          {/* Card 1: Identity & Subdomain */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                  <User className="size-4" aria-hidden />
                </div>
                <div>
                  <CardTitle>{t("identitySectionTitle")}</CardTitle>
                  <CardDescription>
                    {t("identitySectionDescription")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
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

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem
                    label={t("username")}
                    inputId="settings-username"
                    description={`${t("subdomainPrefix")}${currentUsername}`}
                  >
                    <Input {...field} />
                  </FormItem>
                )}
              />

              <div className="sm:col-span-2">
                <FormField
                  control={form.control}
                  name="mapLocationLabel"
                  render={({ field }) => (
                    <FormItem
                      label={t("mapLocation")}
                      description={t("mapLocationHint")}
                      inputId="settings-map-location"
                    >
                      <div className="relative">
                        <MapPin
                          className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                          aria-hidden
                        />
                        <Input
                          className="pl-9"
                          placeholder={t("mapLocationPlaceholder")}
                          {...field}
                        />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Brand & Logo with Live Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                  <Sparkles className="size-4" aria-hidden />
                </div>
                <div>
                  <CardTitle>{t("brandSectionTitle")}</CardTitle>
                  <CardDescription>
                    {t("brandSectionDescription")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Live Preview Box */}
              <div className="bg-muted/40 border-border/80 rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
                    <Sparkles className="text-primary size-3.5" aria-hidden />
                    {t("brandPreviewTitle")}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {t("brandPreviewDescription")}
                  </Badge>
                </div>
                <div className="bg-card border-border flex items-center justify-between rounded-lg border p-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    {activeLogoUrl ? (
                      <div className="border-border bg-background flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeLogoUrl}
                          alt="Logo Preview"
                          className="size-full object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div className="bg-primary/15 text-primary border-primary/20 flex size-9 shrink-0 items-center justify-center rounded-lg border font-semibold">
                        {activeInitials}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-foreground text-sm font-semibold">
                        {watchedValues.displayName?.trim() !== ""
                          ? (watchedValues.displayName ?? "Jesus HG")
                          : "Jesus HG"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Portfolio Header
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-muted h-2 w-12 rounded-full" />
                    <div className="bg-muted h-2 w-8 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                      <div className="relative">
                        <ImageIcon
                          className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                          aria-hidden
                        />
                        <Input
                          type="url"
                          className="pl-9"
                          placeholder={t("logoImageUrlPlaceholder")}
                          {...field}
                        />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Language & Portfolio Visibility */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                  <Globe className="size-4" aria-hidden />
                </div>
                <div>
                  <CardTitle>{t("visibilitySectionTitle")}</CardTitle>
                  <CardDescription>
                    {t("visibilitySectionDescription")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
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
                        <SelectItem value="en">English (EN)</SelectItem>
                        <SelectItem value="es">Español (ES)</SelectItem>
                        <SelectItem value="nl">Nederlands (NL)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Publication Status Card Banner */}
              <div className="border-border bg-card/60 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      isPublished
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isPublished ? (
                      <Eye className="size-4.5" aria-hidden />
                    ) : (
                      <EyeOff className="size-4.5" aria-hidden />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground text-sm font-semibold">
                        {t("publish")}
                      </span>
                      <Badge
                        variant={isPublished ? "default" : "outline"}
                        className="text-xs"
                      >
                        {isPublished ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="size-3" />
                            {t("statusPublic")}
                          </span>
                        ) : (
                          t("statusDraft")
                        )}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {isPublished
                        ? "Your portfolio is live and visible to the world."
                        : "Your portfolio is currently hidden from public visitors."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isPublished && (
                    <a
                      href={`/`}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                        className: "h-9 gap-1.5 text-xs",
                      })}
                    >
                      <span>{t("viewPublicSite")}</span>
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  )}
                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label={t("publish")}
                        />
                      </FormControl>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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
