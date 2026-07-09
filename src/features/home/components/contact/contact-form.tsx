"use client";

import { useCallback, useMemo, useTransition } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Send } from "lucide-react";

import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormItem, FormRoot } from "@/components/shared/form-root";
import { api } from "@/trpc/react";

const ContactForm: FC = () => {
  const t = useTranslations("main.contact");
  const [isPending, startTransition] = useTransition();
  const sendMessage = api.contact.sendMessage.useMutation();

  const contactSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("form.name.errors.required")),
        email: z
          .string()
          .min(1, t("form.email.errors.required"))
          .email(t("form.email.errors.pattern")),
        message: z
          .string()
          .min(10, t("form.message.errors.minLength"))
          .max(2000, t("form.message.errors.maxLength")),
      }),
    [t],
  );

  type ContactInput = z.infer<typeof contactSchema>;

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const onSubmit = useCallback(
    (data: ContactInput) => {
      startTransition(async () => {
        try {
          await sendMessage.mutateAsync(data);
          form.reset();
          toast.success(t("form.success.description"));
        } catch {
          toast.error(t("form.errors.description"));
        }
      });
    },
    [form, sendMessage, t],
  );

  return (
    <Form {...form}>
      <FormRoot
        id="contact-form"
        className="text-card-foreground mx-auto box-border h-full w-full max-w-md min-w-0 flex-none flex-col justify-center gap-4 overflow-visible p-0"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="space-y-1 text-center md:text-left">
          <p className="text-foreground text-lg font-semibold tracking-tight">
            {t("title2")}
          </p>
          <p className="text-muted-foreground text-sm">{t("form.helper")}</p>
        </div>

        <div className="min-w-0 space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem label={t("form.name.label")} inputId="contact-name">
                <Input
                  {...field}
                  autoComplete="name"
                  placeholder={t("form.name.placeholder")}
                  className="bg-background/70 h-11 px-4"
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem label={t("form.email.label")} inputId="contact-email">
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  placeholder={t("form.email.placeholder")}
                  className="bg-background/70 h-11 px-4"
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem
                label={t("form.message.label")}
                inputId="contact-message"
              >
                <Textarea
                  {...field}
                  rows={5}
                  placeholder={t("form.message.placeholder")}
                  className="bg-background/70 min-h-32 px-4 py-3"
                />
              </FormItem>
            )}
          />
        </div>

        <motion.button
          type="submit"
          disabled={isPending || sendMessage.isPending}
          whileHover={{
            scale: isPending || sendMessage.isPending ? 1 : 1.015,
          }}
          whileTap={{
            scale: isPending || sendMessage.isPending ? 1 : 0.98,
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 pressable relative mt-1 box-border flex w-full max-w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3.5 text-sm font-semibold tracking-[0.14em] uppercase shadow-lg transition-all disabled:opacity-60"
        >
          {!(isPending || sendMessage.isPending) && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-linear-to-r from-transparent via-white/20 to-transparent"
            />
          )}

          {isPending || sendMessage.isPending ? (
            <svg
              className="size-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" className="opacity-25" />
              <path
                d="M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0"
                className="opacity-75"
              />
            </svg>
          ) : (
            <Send className="size-4" />
          )}
          {t("form.submit")}
        </motion.button>
      </FormRoot>
    </Form>
  );
};

export default ContactForm;
