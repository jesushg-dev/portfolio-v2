"use client";

import { useCallback, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles } from "lucide-react";
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
  token: z.string().trim().min(1),
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
  const [isTesting, setIsTesting] = useState(false);

  const saveUploadThing = api.integrationsAdmin.saveUploadThing.useMutation();
  const testUploadThing = api.integrationsAdmin.testUploadThing.useMutation();

  const form = useForm<UploadThingFormValues>({
    resolver: zodResolver(uploadThingFormSchema),
    defaultValues: { token: "" },
  });

  const tokenValue = useWatch({ control: form.control, name: "token" });

  const handleTestConnection = useCallback(async () => {
    const values = form.getValues();
    const token = values.token.trim() || undefined;

    if (!token && !status.isConfigured) {
      toast.error(t("uploadthing.missingTokenToTest"));
      return;
    }

    setIsTesting(true);
    try {
      await testUploadThing.mutateAsync({ token });
      toast.success(t("uploadthing.testSuccess"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("uploadthing.testFailed"),
      );
    } finally {
      setIsTesting(false);
    }
  }, [form, status.isConfigured, testUploadThing, t]);

  const handleSubmit = useCallback(
    (values: UploadThingFormValues) => {
      startTransition(async () => {
        try {
          await saveUploadThing.mutateAsync({
            token: values.token,
          });

          await utils.integrationsAdmin.getConfigs.invalidate();
          form.reset({ token: "" });
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
        <FormContent error={saveUploadThing.error}>
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
                    autoComplete="new-password"
                    spellCheck={false}
                    placeholder={
                      status.maskedToken !== ""
                        ? status.maskedToken
                        : t("uploadthing.tokenPlaceholder")
                    }
                  />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void handleTestConnection();
                }}
                disabled={
                  isTesting ||
                  isPending ||
                  (!tokenValue?.trim() && !status.isConfigured)
                }
              >
                {isTesting ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 size-3.5" />
                )}
                {t("uploadthing.testButton")}
              </Button>
            </div>
          </FormSection>
        </FormContent>

        <FormActions
          isPending={isPending}
          disabled={!tokenValue?.trim() || isPending || isTesting}
          title={t("uploadthing.saveButton")}
          submitId="save-uploadthing-btn"
        >
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t("actions.cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
}
