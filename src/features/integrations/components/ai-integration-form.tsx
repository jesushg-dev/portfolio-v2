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
  FormSection,
} from "@/components/shared/form-root";

const aiFormSchema = z.object({
  geminiApiKey: z.string(),
  openaiApiKey: z.string(),
  anthropicApiKey: z.string(),
  deepseekApiKey: z.string(),
  defaultProvider: z.enum(["gemini", "openai", "anthropic", "deepseek"]),
});

type AiFormValues = z.infer<typeof aiFormSchema>;
type AiStatus = RouterOutputs["integrationsAdmin"]["getConfigs"]["ai"];

interface AiIntegrationFormProps {
  status: AiStatus;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AiIntegrationForm({
  status,
  onSuccess,
  onCancel,
}: AiIntegrationFormProps) {
  const t = useTranslations("adminCredentials");
  const utils = api.useUtils();
  const [isPending, startTransition] = useTransition();
  const saveAi = api.integrationsAdmin.saveAi.useMutation();

  const form = useForm<AiFormValues>({
    resolver: zodResolver(aiFormSchema),
    defaultValues: {
      geminiApiKey: "",
      openaiApiKey: "",
      anthropicApiKey: "",
      deepseekApiKey: "",
      defaultProvider: status.defaultProvider ?? "gemini",
    },
  });

  const handleSubmit = useCallback(
    (values: AiFormValues) => {
      startTransition(async () => {
        try {
          await saveAi.mutateAsync({
            geminiApiKey: values.geminiApiKey || undefined,
            openaiApiKey: values.openaiApiKey || undefined,
            anthropicApiKey: values.anthropicApiKey || undefined,
            deepseekApiKey: values.deepseekApiKey || undefined,
            defaultProvider: values.defaultProvider,
          });

          await utils.integrationsAdmin.getConfigs.invalidate();
          form.reset({
            geminiApiKey: "",
            openaiApiKey: "",
            anthropicApiKey: "",
            deepseekApiKey: "",
            defaultProvider: values.defaultProvider,
          });
          toast.success(t("ai.saveSuccess"));
          onSuccess();
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to save AI credentials",
          );
        }
      });
    },
    [saveAi, utils, t, form, onSuccess],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent>
          <FormSection title={t("ai.title")} description={t("ai.description")}>
            <FormField
              control={form.control}
              name="geminiApiKey"
              render={({ field }) => (
                <FormItem label={t("ai.geminiLabel")}>
                  <Input
                    {...field}
                    id="ai-gemini-key"
                    type="password"
                    placeholder={
                      status.maskedGeminiApiKey !== ""
                        ? status.maskedGeminiApiKey
                        : t("ai.geminiPlaceholder")
                    }
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="openaiApiKey"
              render={({ field }) => (
                <FormItem label={t("ai.openaiLabel")}>
                  <Input
                    {...field}
                    id="ai-openai-key"
                    type="password"
                    placeholder={
                      status.maskedOpenAiApiKey !== ""
                        ? status.maskedOpenAiApiKey
                        : t("ai.openaiPlaceholder")
                    }
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="anthropicApiKey"
              render={({ field }) => (
                <FormItem label={t("ai.anthropicLabel")}>
                  <Input
                    {...field}
                    id="ai-anthropic-key"
                    type="password"
                    placeholder={
                      status.maskedAnthropicApiKey !== ""
                        ? status.maskedAnthropicApiKey
                        : t("ai.anthropicPlaceholder")
                    }
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deepseekApiKey"
              render={({ field }) => (
                <FormItem label={t("ai.deepseekLabel")}>
                  <Input
                    {...field}
                    id="ai-deepseek-key"
                    type="password"
                    placeholder={
                      status.maskedDeepseekApiKey !== ""
                        ? status.maskedDeepseekApiKey
                        : t("ai.deepseekPlaceholder")
                    }
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultProvider"
              render={({ field }) => (
                <FormItem label={t("ai.defaultProviderLabel")}>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="ai-default-provider">
                      <SelectValue
                        placeholder={t("ai.defaultProviderPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                      <SelectItem value="anthropic">
                        Anthropic (Claude)
                      </SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                    </SelectContent>
                  </Select>
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
            title={t("ai.saveButton")}
            submitId="save-ai-btn"
          />
        </div>
      </FormRoot>
    </Form>
  );
}
