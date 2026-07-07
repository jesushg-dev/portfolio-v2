"use client";

import { useState, useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { api } from "@/trpc/react";
import {
  FormRoot,
  FormContent,
  FormSection,
  FormItem,
  FormActions,
} from "@/components/shared/form-root";
import { Form, FormField, FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  consoleCode: z.string().min(1),
});

type FormValues = z.infer<typeof formSchema>;

interface ConsoleFormProps {
  initial?: Record<string, unknown> | null;
}

export function ConsoleForm({ initial }: ConsoleFormProps) {
  const t = useTranslations("admin.profile");
  const utils = api.useUtils();

  const initialConsoleCode =
    typeof initial?.consoleCode === "string"
      ? initial.consoleCode
      : "const dev = {\n  name: 'Jesús',\n  roles: ['Developer', 'Engineer']\n};";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      consoleCode: initialConsoleCode,
    },
  });

  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const upsertAboutMe = api.cv.upsertAboutMe.useMutation();

  const handleSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        setServerError(null);
        try {
          const defaultText =
            typeof initial?.default === "string" ? initial.default : "";
          const translationsText =
            typeof initial?.translations === "object" &&
            initial?.translations !== null
              ? (initial.translations as Record<string, string>)
              : undefined;

          const payload = {
            default: defaultText,
            translations: translationsText,
            consoleCode: values.consoleCode,
          };

          await upsertAboutMe.mutateAsync({
            aboutMe: payload,
          });

          await utils.cv.getMine.invalidate();
        } catch (err) {
          setServerError(err instanceof Error ? err.message : "Save failed");
        }
      });
    },
    [initial, upsertAboutMe, utils],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent error={serverError}>
          <FormSection
            title={t("heroConsoleTitle")}
            description={t("heroConsoleSubtitle")}
          >
            <FormField
              control={form.control}
              name="consoleCode"
              render={({ field }) => (
                <FormItem label={t("heroConsoleTitle")}>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </FormSection>
        </FormContent>
        <FormActions
          isPending={isPending}
          title={isPending ? t("saving") : t("save")}
        />
      </FormRoot>
    </Form>
  );
}
