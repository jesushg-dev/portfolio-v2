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

const ContactForm: FC = () => {
  const t = useTranslations("main.contact");
  const [isPending, startTransition] = useTransition();

  const contactSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("form.name.errors.required")),
        email: z
          .string()
          .min(1, t("form.email.errors.required"))
          .email(t("form.email.errors.pattern")),
        message: z.string().min(1, t("form.message.errors.required")),
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
        const body = new FormData();
        body.append("name", data.name);
        body.append("email", data.email);
        body.append("message", data.message);

        try {
          const res = await fetch("https://formspree.io/f/xnqwqkrl", {
            method: "POST",
            body,
            headers: { Accept: "application/json" },
          });

          if (res.ok) {
            form.reset();
            toast.success(t("form.success.description"));
          } else {
            toast.error(t("form.errors.description"));
          }
        } catch {
          toast.error(t("form.errors.description"));
        }
      });
    },
    [form, t],
  );

  return (
    <Form {...form}>
      <FormRoot
        id="contact-form"
        className="text-card-foreground mx-auto box-border h-full w-full max-w-md min-w-0 flex-none flex-col justify-center gap-4 overflow-visible p-0"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <p className="text-foreground text-center text-lg font-bold">
          {t("title2")}
        </p>

        <div className="min-w-0 space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem label={t("form.name.label")}>
                <Input
                  {...field}
                  autoComplete="name"
                  placeholder={t("form.name.placeholder")}
                  className="h-11 px-4"
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem label={t("form.email.label")}>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  placeholder={t("form.email.placeholder")}
                  className="h-11 px-4"
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem label={t("form.message.label")}>
                <Textarea
                  {...field}
                  rows={4}
                  placeholder={t("form.message.placeholder")}
                  className="min-h-28 px-4 py-3"
                />
              </FormItem>
            )}
          />
        </div>

        <motion.button
          type="submit"
          disabled={isPending}
          whileHover={{ scale: isPending ? 1 : 1.02 }}
          whileTap={{ scale: isPending ? 1 : 0.97 }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 pressable relative mt-2 box-border flex w-full max-w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-lg px-6 py-3 font-semibold tracking-widest uppercase shadow-lg transition-all disabled:opacity-60"
        >
          {!isPending && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          )}

          {isPending ? (
            <svg
              className="h-5 w-5 animate-spin"
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
            <Send className="h-4 w-4" />
          )}
          {t("form.submit")}
        </motion.button>
      </FormRoot>
    </Form>
  );
};

export default ContactForm;
