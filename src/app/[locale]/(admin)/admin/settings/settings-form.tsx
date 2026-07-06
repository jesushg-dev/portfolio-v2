"use client";

import { useState } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { api } from "@/trpc/react";
import FormStatus from "@/components/admin/shared/form-status";

const SettingsSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  displayName: z.string().min(1).optional(),
  defaultLocale: z.enum(["en", "es", "nl"]),
  isPublished: z.boolean(),
  cvPdfUrl: z.string().url().or(z.literal("")).optional(),
});

type SettingsInput = z.infer<typeof SettingsSchema>;

interface ISettingsFormProps {
  defaultValues: SettingsInput;
}

const SettingsForm: FC<ISettingsFormProps> = ({ defaultValues }) => {
  const t = useTranslations("admin.settings");
  const tErrors = useTranslations("admin.errors");
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const upsertProfile = api.cv.upsertProfile.useMutation();
  const utils = api.useUtils();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsInput>({
    resolver: zodResolver(SettingsSchema),
    defaultValues,
  });

  const onSubmit = async (data: SettingsInput) => {
    setSuccess(false);
    setServerError(null);
    try {
      await upsertProfile.mutateAsync({
        username: data.username,
        displayName: data.displayName,
        defaultLocale: data.defaultLocale,
        isPublished: data.isPublished,
        cvPdfUrl: data.cvPdfUrl ?? null,
      });
      await utils.cv.getMine.invalidate();
      setSuccess(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : tErrors("saveSettings"),
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`bg-card flex scroll-mt-24 flex-col gap-5 rounded-xl p-6 shadow-sm`}
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="username">
          {t("username")}
        </label>
        <input
          id="username"
          type="text"
          {...register("username")}
          className="bg-card focus:border-primary-600 focus:ring-primary-600/20 w-full rounded-lg px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:ring-2 focus:outline-none"
        />
        {errors.username ? (
          <p className="text-xs text-red-500">{errors.username.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="displayName"
        >
          {t("displayName")}
        </label>
        <input
          id="displayName"
          type="text"
          {...register("displayName")}
          className="bg-card focus:border-primary-600 focus:ring-primary-600/20 w-full rounded-lg px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:ring-2 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="defaultLocale"
        >
          {t("defaultLocale")}
        </label>
        <select
          id="defaultLocale"
          {...register("defaultLocale")}
          className="bg-card focus:border-primary-600 focus:ring-primary-600/20 w-full rounded-lg px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:ring-2 focus:outline-none"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="nl">Nederlands</option>
        </select>
        <p className="text-xs text-gray-500">{t("defaultLocaleHint")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="cvPdfUrl">
          {t("cvPdfUrl")}
        </label>
        <input
          id="cvPdfUrl"
          type="url"
          {...register("cvPdfUrl")}
          className="bg-card focus:border-primary-600 focus:ring-primary-600/20 w-full rounded-lg px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:ring-2 focus:outline-none"
        />
        {errors.cvPdfUrl ? (
          <p className="text-xs text-red-500">{errors.cvPdfUrl.message}</p>
        ) : null}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" {...register("isPublished")} />
        {t("publish")}
      </label>

      <FormStatus
        error={serverError}
        success={success}
        successMessage={t("saved")}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary-700 hover:bg-primary-800 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? t("saving") : t("save")}
      </button>
    </form>
  );
};

export default SettingsForm;
