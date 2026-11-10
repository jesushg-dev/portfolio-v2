"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Send, LoaderCircle } from "lucide-react";

import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormItem, FormRoot } from "@/components/shared/form-root";
import { TurnstileWidget } from "@/components/shared/turnstile-widget";
import { env } from "@/env";
import { api, TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";
import {
  ContactAlternativeLinks,
  type ContactAlternativeLinksProps,
} from "./contact-alternative-links";

export interface ContactFormProps extends ContactAlternativeLinksProps {
  responseTime?: string | null;
}

const ContactForm: FC<ContactFormProps> = ({
  linkedinUrl,
  schedulingEnabled,
  responseTime,
}) => {
  const t = useTranslations("main.contact");
  const [isPending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileWidgetId, setTurnstileWidgetId] = useState<string | null>(
    null,
  );
  const sendMessage = api.contact.sendMessage.useMutation();

  const handleTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken("");
  }, []);

  const handleTurnstileWidgetId = useCallback((id: string) => {
    setTurnstileWidgetId(id);
  }, []);

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
      let token = turnstileToken;
      if (
        !token &&
        typeof window !== "undefined" &&
        window.turnstile &&
        turnstileWidgetId
      ) {
        token = window.turnstile.getResponse(turnstileWidgetId) ?? "";
      }

      if (!token) {
        toast.error(t("form.errors.description"));
        return;
      }

      startTransition(async () => {
        try {
          await sendMessage.mutateAsync({
            ...data,
            turnstileToken: token,
          });
          form.reset();
          setTurnstileToken("");
          if (turnstileWidgetId && window.turnstile) {
            window.turnstile.reset(turnstileWidgetId);
          }
          toast.success(t("form.success.description"));
        } catch {
          if (turnstileWidgetId && window.turnstile) {
            window.turnstile.reset(turnstileWidgetId);
            setTurnstileToken("");
          }
          toast.error(t("form.errors.description"));
        }
      });
    },
    [form, sendMessage, t, turnstileToken, turnstileWidgetId],
  );

  return (
    <Form {...form}>
      <FormRoot
        id="contact-form"
        className="text-foreground box-border w-full min-w-0 flex-1 flex-col gap-7 overflow-visible p-0"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="text-left">
          {responseTime && (
            <p className="text-primary mb-3 text-sm font-semibold">
              {responseTime}
            </p>
          )}

          <h3 className="text-foreground text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {t("title2")}
          </h3>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed sm:text-lg">
            {t("form.helper")}
          </p>
        </div>

        <div className="border-border/50 bg-background/25 divide-border/50 flex min-w-0 flex-1 flex-col divide-y overflow-hidden rounded-3xl border">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem
                label={t("form.name.label")}
                inputId="contact-name"
                className="[&_label]:text-muted-foreground gap-1 p-4 pb-3 [&_label]:text-xs [&_label]:font-medium"
              >
                <Input
                  {...field}
                  autoComplete="name"
                  placeholder={t("form.name.placeholder")}
                  maxLength={80}
                  className="focus-visible:bg-primary/5 focus-visible:ring-primary/20 h-11 rounded-xl border-0 bg-transparent px-3 text-base shadow-none transition-colors focus-visible:ring-2 md:text-base"
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem
                label={t("form.email.label")}
                inputId="contact-email"
                className="[&_label]:text-muted-foreground gap-1 p-4 pb-3 [&_label]:text-xs [&_label]:font-medium"
              >
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  placeholder={t("form.email.placeholder")}
                  maxLength={120}
                  className="focus-visible:bg-primary/5 focus-visible:ring-primary/20 h-11 rounded-xl border-0 bg-transparent px-3 text-base shadow-none transition-colors focus-visible:ring-2 md:text-base"
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
                className="[&_label]:text-muted-foreground flex flex-1 flex-col gap-1 p-4 [&_label]:text-xs [&_label]:font-medium"
              >
                <Textarea
                  {...field}
                  rows={4}
                  maxLength={2000}
                  placeholder={t("form.message.placeholder")}
                  className="focus-visible:bg-primary/5 focus-visible:ring-primary/20 min-h-32 flex-1 resize-y rounded-xl border-0 bg-transparent px-3 py-3 text-base shadow-none transition-colors focus-visible:ring-2 md:text-base"
                />
              </FormItem>
            )}
          />
        </div>

        <TurnstileWidget
          siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          action="contact"
          appearance="interaction-only"
          onSuccess={handleTurnstileSuccess}
          onExpire={handleTurnstileExpire}
          onWidgetId={handleTurnstileWidgetId}
          className="flex justify-center empty:hidden"
        />

        <button
          type="submit"
          disabled={isPending || sendMessage.isPending}
          className="btn-primary-glow group focus-visible:outline-ring relative box-border inline-flex min-h-11 w-fit max-w-full cursor-pointer items-center justify-center gap-3 self-center rounded-full px-6 py-2.5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-4 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("form.submit")}
          <span className="inline-flex shrink-0">
            {isPending || sendMessage.isPending ? (
              <LoaderCircle aria-hidden className="size-4 animate-spin" />
            ) : (
              <Send
                aria-hidden
                className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            )}
          </span>
        </button>

        <ContactAlternativeLinks
          linkedinUrl={linkedinUrl}
          schedulingEnabled={schedulingEnabled}
        />
      </FormRoot>
    </Form>
  );
};

export default function ContactFormWithProvider(props: ContactFormProps) {
  return (
    <TRPCReactProvider>
      <ContactForm {...props} />
      <Toaster />
    </TRPCReactProvider>
  );
}
