"use client";

import { useCallback, useEffect, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { api, type RouterOutputs } from "@/trpc/react";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";

const resendFormSchema = z.object({
  apiKey: z.string(),
  emailDomain: z.string(),
  fromEmail: z.string(),
  emailSignatureHtml: z.string(),
});

type ResendFormValues = z.infer<typeof resendFormSchema>;
type ResendStatus = RouterOutputs["integrationsAdmin"]["getConfigs"]["resend"];

interface ResendIntegrationFormProps {
  status: ResendStatus;
  onSuccess: () => void;
  onCancel: () => void;
}

function createResendSchema(isConfigured: boolean) {
  return resendFormSchema.superRefine((data, ctx) => {
    if (isConfigured) return;

    if (!data.apiKey.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["apiKey"],
        message: "Required",
      });
    }
    if (!data.emailDomain.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emailDomain"],
        message: "Required",
      });
    }
  });
}

export function ResendIntegrationForm({
  status,
  onSuccess,
  onCancel,
}: ResendIntegrationFormProps) {
  const t = useTranslations("adminCredentials");
  const utils = api.useUtils();
  const [isPending, startTransition] = useTransition();
  const saveResend = api.integrationsAdmin.saveResend.useMutation();

  const schema = useMemo(
    () => createResendSchema(status.isConfigured),
    [status.isConfigured],
  );

  const form = useForm<ResendFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      apiKey: "",
      emailDomain: status.emailDomain,
      fromEmail: status.fromEmail,
      emailSignatureHtml: status.emailSignatureHtml,
    },
  });

  useEffect(() => {
    form.reset({
      apiKey: "",
      emailDomain: status.emailDomain,
      fromEmail: status.fromEmail,
      emailSignatureHtml: status.emailSignatureHtml,
    });
  }, [form, status]);

  const handleSubmit = useCallback(
    (values: ResendFormValues) => {
      startTransition(async () => {
        try {
          const res = await saveResend.mutateAsync({
            apiKey: values.apiKey.trim() || undefined,
            emailDomain: values.emailDomain.trim() || undefined,
            fromEmail: values.fromEmail.trim() || undefined,
            emailSignatureHtml: values.emailSignatureHtml,
          });

          await utils.integrationsAdmin.getConfigs.invalidate();
          toast.success(
            t("resend.saveSuccess") + ` (${res.syncedCount} templates)`,
          );
          onSuccess();
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to save Resend credentials",
          );
        }
      });
    },
    [saveResend, utils, t, onSuccess],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent>
          {status.lastError && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
              ⚠️ {status.lastError}
            </div>
          )}

          <FormSection
            title={t("resend.title")}
            description={t("resend.description")}
          >
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem
                  label={t("resend.apiKeyLabel")}
                  required={!status.isConfigured}
                >
                  <Input
                    {...field}
                    id="resend-api-key"
                    type="password"
                    placeholder={
                      status.maskedApiKey !== ""
                        ? status.maskedApiKey
                        : t("resend.apiKeyPlaceholder")
                    }
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emailDomain"
              render={({ field }) => (
                <FormItem
                  label={t("resend.domainLabel")}
                  required={!status.isConfigured}
                >
                  <Input
                    {...field}
                    id="resend-domain"
                    type="text"
                    placeholder={t("resend.domainPlaceholder")}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fromEmail"
              render={({ field }) => (
                <FormItem label={t("resend.fromLabel")}>
                  <Input
                    {...field}
                    id="resend-from"
                    type="text"
                    placeholder={t("resend.fromPlaceholder")}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emailSignatureHtml"
              render={({ field }) => (
                <FormItem
                  label={t("resend.signatureLabel")}
                  description={t("resend.signatureHint")}
                >
                  <Textarea
                    {...field}
                    id="resend-signature"
                    rows={8}
                    className="font-mono text-xs"
                    placeholder={t("resend.signaturePlaceholder")}
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
            title={t("resend.saveButton")}
            submitId="save-resend-btn"
          />
        </div>
      </FormRoot>
    </Form>
  );
}
