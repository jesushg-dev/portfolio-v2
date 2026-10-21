"use client";

import { useCallback, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
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

const iLovePdfFormSchema = z.object({
  publicKey: z.string().trim(),
  secretKey: z.string().trim(),
});

type ILovePdfFormValues = z.infer<typeof iLovePdfFormSchema>;
type ILovePdfStatus =
  RouterOutputs["integrationsAdmin"]["getConfigs"]["ilovepdf"];

interface ILovePdfIntegrationFormProps {
  status: ILovePdfStatus;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ILovePdfIntegrationForm({
  status,
  onSuccess,
  onCancel,
}: ILovePdfIntegrationFormProps) {
  const t = useTranslations("adminCredentials");
  const utils = api.useUtils();
  const [isPending, startTransition] = useTransition();
  const [isTesting, setIsTesting] = useState(false);

  const saveILovePdf = api.integrationsAdmin.saveILovePdf.useMutation();
  const testILovePdf = api.integrationsAdmin.testILovePdf.useMutation();

  const form = useForm<ILovePdfFormValues>({
    resolver: zodResolver(iLovePdfFormSchema),
    defaultValues: { publicKey: "", secretKey: "" },
  });

  const handleTestConnection = useCallback(async () => {
    const values = form.getValues();
    const publicKey = values.publicKey.trim() || undefined;
    const secretKey = values.secretKey.trim() || undefined;

    if (!publicKey && !status.isConfigured) {
      toast.error(t("ilovepdf.missingKeysToTest"));
      return;
    }

    setIsTesting(true);
    try {
      await testILovePdf.mutateAsync({ publicKey, secretKey });
      toast.success(t("ilovepdf.testSuccess"));
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("ilovepdf.testFailed"),
      );
    } finally {
      setIsTesting(false);
    }
  }, [form, status.isConfigured, testILovePdf, t]);

  const handleSubmit = useCallback(
    (values: ILovePdfFormValues) => {
      startTransition(async () => {
        try {
          await saveILovePdf.mutateAsync({
            publicKey: values.publicKey || undefined,
            secretKey: values.secretKey || undefined,
          });

          await utils.integrationsAdmin.getConfigs.invalidate();
          form.reset({ publicKey: "", secretKey: "" });
          toast.success(t("ilovepdf.saveSuccess"));
          onSuccess();
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : t("ilovepdf.saveFailed"),
          );
        }
      });
    },
    [saveILovePdf, utils, t, form, onSuccess],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent>
          <FormSection
            title={t("ilovepdf.title")}
            description={t("ilovepdf.description")}
          >
            <FormField
              control={form.control}
              name="publicKey"
              render={({ field }) => (
                <FormItem label={t("ilovepdf.publicKeyLabel")}>
                  <Input
                    {...field}
                    id="ilovepdf-public-key"
                    placeholder={
                      status.maskedPublicKey !== ""
                        ? status.maskedPublicKey
                        : t("ilovepdf.publicKeyPlaceholder")
                    }
                    autoComplete="off"
                    spellCheck={false}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secretKey"
              render={({ field }) => (
                <FormItem label={t("ilovepdf.secretKeyLabel")}>
                  <Input
                    {...field}
                    id="ilovepdf-secret-key"
                    type="password"
                    placeholder={
                      status.maskedSecretKey !== ""
                        ? status.maskedSecretKey
                        : t("ilovepdf.secretKeyPlaceholder")
                    }
                    autoComplete="off"
                    spellCheck={false}
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
                disabled={isTesting || isPending}
              >
                {isTesting ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 size-3.5" />
                )}
                {t("ilovepdf.testButton")}
              </Button>
            </div>
          </FormSection>
        </FormContent>

        <FormActions isPending={isPending} title={t("ilovepdf.saveButton")}>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("actions.cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
}
