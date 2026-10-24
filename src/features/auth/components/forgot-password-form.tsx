"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { FC } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";

import { authClient } from "@/lib/auth-client";
import { buildLocalizedCallbackUrl } from "@/lib/auth-routing";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormContent, FormItem, FormRoot } from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";
import LoginLayout from "@/features/auth/components/login-layout";

const fieldInputClassName =
  "mt-1.5 h-12 rounded-xl border-border/70 bg-background/40 px-4 shadow-none transition-colors focus-visible:border-primary/60 focus-visible:ring-primary/15";

const ForgotPasswordForm: FC = () => {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ForgotPasswordSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(),
      }),
    [],
  );

  type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetRedirectUrl = useMemo(
    () => buildLocalizedCallbackUrl(locale, "/reset-password"),
    [locale],
  );

  const onSubmit = useCallback(
    (data: ForgotPasswordInput) => {
      startTransition(async () => {
        setServerError(null);
        setSuccessMessage(null);

        const { error } = await authClient.requestPasswordReset({
          email: data.email,
          redirectTo: resetRedirectUrl,
        });

        if (error) {
          setServerError(error.message ?? t("forgotPassword.error"));
          return;
        }

        setSuccessMessage(t("forgotPassword.success"));
      });
    },
    [resetRedirectUrl, t],
  );

  return (
    <LoginLayout variant="reset">
      <Form {...form}>
        <FormRoot
          className="text-foreground [&_input]:text-foreground [&_input]:placeholder:text-muted-foreground [&_label]:text-muted-foreground flex-none overflow-visible [&_label]:text-xs [&_label]:font-medium"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <h1 className="text-foreground text-left text-4xl font-semibold tracking-tight sm:text-5xl">
            {formatHighlightTitle(t("forgotPassword.title"))}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-left text-sm leading-relaxed sm:text-base">
            {t("forgotPassword.description")}
          </p>

          <FormContent className="mt-8 gap-4 px-0">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem
                  label={t("forgotPassword.email")}
                  inputId="forgot-password-email"
                >
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@domain.com"
                    className={cn(
                      fieldInputClassName,
                      "border-border/70 bg-background/40",
                    )}
                    {...field}
                  />
                </FormItem>
              )}
            />

            <FormStatus error={serverError} />
            {successMessage ? (
              <div
                className="text-foreground rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-sm"
                role="status"
              >
                <p className="font-semibold text-emerald-400">
                  {successMessage}
                </p>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {t("forgotPassword.successDescription", {
                    email: form.getValues("email"),
                  })}
                </p>
              </div>
            ) : null}
          </FormContent>

          <Button
            type="submit"
            disabled={form.formState.isSubmitting || isPending}
            className="shadow-primary/20 mt-2 h-12 w-full rounded-xl text-sm font-semibold shadow-lg"
          >
            {form.formState.isSubmitting || isPending
              ? t("forgotPassword.submitting")
              : t("forgotPassword.submit")}
          </Button>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            {t("forgotPassword.remembered")}{" "}
            <Link
              href="/login"
              className="text-primary inline-flex min-h-11 items-center font-medium hover:underline"
            >
              {t("forgotPassword.signIn")}
            </Link>
          </p>
        </FormRoot>
      </Form>
    </LoginLayout>
  );
};

function formatHighlightTitle(title: string) {
  const parts = title.trim().split(/\s+/);
  if (parts.length <= 1) return title;
  const last = parts.pop();
  return (
    <>
      {parts.join(" ")} <span className="text-primary">{last}</span>
    </>
  );
}

export default ForgotPasswordForm;
