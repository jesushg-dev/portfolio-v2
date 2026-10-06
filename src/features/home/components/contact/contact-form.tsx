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
        className="text-card-foreground mx-auto box-border h-full w-full max-w-lg min-w-0 flex-none flex-col justify-center gap-5 overflow-visible p-0"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="space-y-2 text-left">
          <div className="border-primary/20 bg-primary/10 text-primary inline-flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold backdrop-blur-xs">
            <Zap className="fill-primary/20 text-primary size-3.5 shrink-0" />
            <span>{t("responseTime")}</span>
          </div>

          <h3 className="text-foreground text-2xl font-bold tracking-tight">
            {t("title2")}
          </h3>
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
                  className="border-border/80 bg-background/80 focus-visible:border-primary focus-visible:ring-primary/10 h-12 rounded-2xl px-4.5 text-base transition-all focus-visible:ring-4"
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
                  className="border-border/80 bg-background/80 focus-visible:border-primary focus-visible:ring-primary/10 h-12 rounded-2xl px-4.5 text-base transition-all focus-visible:ring-4"
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
                  className="border-border/80 bg-background/80 focus-visible:border-primary focus-visible:ring-primary/10 min-h-28 resize-none rounded-2xl px-4.5 py-3.5 text-base transition-all focus-visible:ring-4"
                />
              </FormItem>
            )}
          />
        </div>

        <motion.button
          type="submit"
          disabled={isPending || sendMessage.isPending}
          whileHover={{
            scale: isPending || sendMessage.isPending ? 1 : 1.01,
          }}
          whileTap={{
            scale: isPending || sendMessage.isPending ? 1 : 0.98,
          }}
          className="group bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90 relative box-border flex w-full max-w-full min-w-0 items-center justify-center gap-3 overflow-hidden rounded-2xl py-4 text-sm font-bold tracking-[0.2em] uppercase shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-60"
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

        <p className="text-muted-foreground mt-2 text-center text-[0.8125rem] leading-relaxed">
          {t.rich("form.alternativeContact", {
            schedule: (chunks) => (
              <Link
                href={SCHEDULE_PATH}
                className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4 transition-colors"
              >
                {chunks}
              </Link>
            ),
            linkedin: (chunks) => (
              <a
                href="https://www.linkedin.com/in/jesushg-dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4 transition-colors"
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
