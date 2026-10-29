"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  KeyRound,
  Webhook,
} from "lucide-react";

import { api, type RouterOutputs } from "@/trpc/react";
import { ResendIntegrationGuide } from "./resend-integration-guide";
import { ResendWebhookGuide } from "./resend-webhook-guide";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  webhookSecret: z.string(),
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
  const [activeTab, setActiveTab] = useState<"credentials" | "events">(
    "credentials",
  );
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
      webhookSecret: "",
      emailDomain: status.emailDomain,
      fromEmail: status.fromEmail,
      emailSignatureHtml: status.emailSignatureHtml,
    },
  });

  useEffect(() => {
    form.reset({
      apiKey: "",
      webhookSecret: "",
      emailDomain: status.emailDomain,
      fromEmail: status.fromEmail,
      emailSignatureHtml: status.emailSignatureHtml,
    });
  }, [form, status]);

  const copyWebhookUrl = useCallback(async () => {
    if (!status.webhookUrl) return;
    try {
      await navigator.clipboard.writeText(status.webhookUrl);
      toast.success(t("resend.webhookCopied"));
    } catch {
      toast.error(t("resend.webhookCopyFailed"));
    }
  }, [status.webhookUrl, t]);

  const handleSubmit = useCallback(
    (values: ResendFormValues) => {
      startTransition(async () => {
        try {
          const res = await saveResend.mutateAsync({
            apiKey: values.apiKey.trim() || undefined,
            webhookSecret: values.webhookSecret.trim() || undefined,
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

  const handleFormSubmit = form.handleSubmit(handleSubmit, (errors) => {
    if (
      errors.apiKey ||
      errors.emailDomain ||
      errors.fromEmail ||
      errors.emailSignatureHtml
    ) {
      setActiveTab("credentials");
    } else if (errors.webhookSecret) {
      setActiveTab("events");
    }
  });

  return (
    <Form {...form}>
      <FormRoot onSubmit={handleFormSubmit}>
        <FormContent>
          {status.lastError && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive mb-4 flex items-center gap-2 rounded-md border p-3 text-sm">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              <span>{status.lastError}</span>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(val) =>
              setActiveTab(val as "credentials" | "events")
            }
            className="w-full"
          >
            <TabsList
              variant="line"
              className="border-border/60 mb-6 w-full justify-start border-b"
            >
              <TabsTrigger value="credentials" className="text-sm">
                <KeyRound className="size-4" aria-hidden />
                <span>{t("resend.tabCredentials")}</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="text-sm">
                <Webhook className="size-4" aria-hidden />
                <span>{t("resend.tabEvents")}</span>
                {status.webhookConfigured && (
                  <span className="bg-success/15 text-success ml-1.5 rounded-full px-2 py-0.5 text-xs font-semibold">
                    {t("resend.webhookConnected")}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="mt-0">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,22.5rem)] lg:items-start">
                <div className="space-y-6">
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
                </div>

                <ResendIntegrationGuide />
              </div>
            </TabsContent>

            <TabsContent value="events" className="mt-0">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,22.5rem)] lg:items-start">
                <div className="space-y-6">
                  <FormSection
                    title={t("resend.webhookTitle")}
                    description={t("resend.webhookHint")}
                  >
                    <div className="space-y-1.5">
                      <label
                        htmlFor="resend-webhook-url"
                        className="text-foreground text-xs font-medium"
                      >
                        {t("resend.webhookUrl")}
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="resend-webhook-url"
                          readOnly
                          value={status.webhookUrl}
                          className="min-w-0 font-mono text-xs"
                          onFocus={(event) => event.target.select()}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!status.webhookUrl}
                          onClick={() => void copyWebhookUrl()}
                        >
                          <Copy aria-hidden className="size-4" />
                          {t("resend.webhookCopy")}
                        </Button>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="webhookSecret"
                      render={({ field }) => (
                        <FormItem
                          label={t("resend.webhookSecret")}
                          description={
                            status.webhookConfigured
                              ? t("resend.webhookSaved")
                              : undefined
                          }
                        >
                          <Input
                            {...field}
                            id="resend-webhook-secret"
                            type="password"
                            autoComplete="new-password"
                            placeholder="whsec_…"
                          />
                        </FormItem>
                      )}
                    />

                    {status.webhookConfigured && (
                      <div className="border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-lg border p-3 text-xs font-medium">
                        <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                        <span>{t("resend.webhookActiveNotice")}</span>
                      </div>
                    )}
                  </FormSection>
                </div>

                <ResendWebhookGuide />
              </div>
            </TabsContent>
          </Tabs>
        </FormContent>

        <div className="border-border/60 mt-6 flex w-full items-center justify-end gap-2 border-t pt-4">
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
