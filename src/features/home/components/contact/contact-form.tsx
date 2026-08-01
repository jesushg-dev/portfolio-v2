"use client";

import { useCallback, useMemo, useTransition } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Send, Zap } from "lucide-react";

import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormItem, FormRoot } from "@/components/shared/form-root";
import { api } from "@/trpc/react";
import { Link } from "@/i18n/routing";
import { SCHEDULE_PATH } from "@/utils/calendly-url";

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
        <div className="space-y-2 text-center md:text-left">
          <div className="border-primary/25 bg-primary/10 text-primary inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.75rem] font-medium backdrop-blur-xs">
            <Zap className="fill-primary/20 text-primary size-3 shrink-0" />
            <span>{t("responseTime")}</span>
          </div>

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
                  className="bg-background/70 focus-visible:border-primary/50 focus-visible:ring-primary/20 h-11 px-4 transition-all"
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
                  className="bg-background/70 focus-visible:border-primary/50 focus-visible:ring-primary/20 h-11 px-4 transition-all"
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
                  rows={4}
                  placeholder={t("form.message.placeholder")}
                  className="bg-background/70 focus-visible:border-primary/50 focus-visible:ring-primary/20 min-h-28 px-4 py-3 transition-all"
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
          className="group from-primary via-primary/95 to-primary/90 hover:from-primary/95 hover:to-primary/85 text-primary-foreground pressable shadow-primary/20 relative box-border flex w-full max-w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl bg-linear-to-b px-6 py-3.5 text-sm font-semibold tracking-[0.14em] uppercase shadow-md transition-all disabled:opacity-60"
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
            <Send className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          )}
          {t("form.submit")}
        </motion.button>

        <p className="text-muted-foreground/80 mt-3.5 text-center text-[0.75rem] leading-relaxed">
          {t.rich("form.alternativeContact", {
            schedule: (chunks) => (
              <Link
                href={SCHEDULE_PATH}
                className="text-primary/90 hover:text-primary font-medium underline underline-offset-4 transition-colors"
              >
                {chunks}
              </Link>
            ),
            linkedin: (chunks) => (
              <a
                href="https://www.linkedin.com/in/jesushg-dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary/90 hover:text-primary font-medium underline underline-offset-4 transition-colors"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </FormRoot>
    </Form>
  );
};

export default ContactForm;
