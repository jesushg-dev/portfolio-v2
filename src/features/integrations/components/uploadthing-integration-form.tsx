"use client";

import { useCallback, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { api, type RouterOutputs } from "@/trpc/react";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";

const uploadThingFormSchema = z.object({
  token: z.string(),
  appId: z.string(),
  secret: z.string(),
});

type UploadThingFormValues = z.infer<typeof uploadThingFormSchema>;
type UploadThingStatus =
  RouterOutputs["integrationsAdmin"]["getConfigs"]["uploadthing"];

interface UploadThingIntegrationFormProps {
  status: UploadThingStatus;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UploadThingIntegrationForm({
  status,
  onSuccess,
  onCancel,
}: UploadThingIntegrationFormProps) {
  const t = useTranslations("adminCredentials");
  const utils = api.useUtils();
  const [isPending, startTransition] = useTransition();
  const saveUploadThing = api.integrationsAdmin.saveUploadThing.useMutation();

  const form = useForm<UploadThingFormValues>({
    resolver: zodResolver(uploadThingFormSchema),
    defaultValues: { token: "", appId: "", secret: "" },
  });

  const handleSubmit = useCallback(
    (values: UploadThingFormValues) => {
      startTransition(async () => {
        try {
          await saveUploadThing.mutateAsync({
            token: values.token || undefined,
            appId: values.appId || undefined,
            secret: values.secret || undefined,
          });

          await utils.integrationsAdmin.getConfigs.invalidate();
          form.reset({ token: "", appId: "", secret: "" });
          toast.success(t("uploadthing.saveSuccess"));
          onSuccess();
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to save UploadThing credentials",
          );
        }
      });
    },
    [saveUploadThing, utils, t, form, onSuccess],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent>
          <FormSection
            title={t("uploadthing.title")}
            description={t("uploadthing.description")}
          >
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem label={t("uploadthing.tokenLabel")}>
                  <Input
                    {...field}
                    id="uploadthing-token"
                    type="password"
                    placeholder={
                      status.maskedToken !== ""
                        ? status.maskedToken
                        : t("uploadthing.tokenPlaceholder")
                    }
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="appId"
              render={({ field }) => (
                <FormItem label={t("uploadthing.appIdLabel")}>
                  <Input
                    {...field}
                    id="uploadthing-app-id"
                    type="text"
                    placeholder={
                      status.appId !== ""
                        ? status.appId
                        : t("uploadthing.appIdPlaceholder")
                    }
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secret"
              render={({ field }) => (
                <FormItem label={t("uploadthing.secretLabel")}>
                  <Input
                    {...field}
                    id="uploadthing-secret"
                    type="password"
                    placeholder={
                      status.maskedSecret !== ""
                        ? status.maskedSecret
                        : t("uploadthing.secretPlaceholder")
                    }
                  />
                </FormItem>
              )}
            />
          </FormSection>
        </FormContent>

        <div className="mt-4 flex w-full items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t("actions.cancel")}
          </Button>
          <FormActions
            isPending={isPending}
            title={t("uploadthing.saveButton")}
            submitId="save-uploadthing-btn"
          />
        </div>
      </FormRoot>
    </Form>
  );
}
