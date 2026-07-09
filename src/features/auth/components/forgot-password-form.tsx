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
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormContent, FormItem, FormRoot } from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";
import AuthBrandHeader from "@/features/auth/components/auth-brand-header";
import AuthSplitLayout from "@/features/auth/components/auth-split-layout";
import AuthShowcasePanel from "@/features/auth/components/auth-showcase-panel";

const fieldInputClassName = "mt-1 h-11 shadow-sm";

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
    <AuthSplitLayout
      form={
        <Form {...form}>
          <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
            <AuthBrandHeader />

            <h1 className="text-foreground mt-6 text-left text-3xl font-medium tracking-tight md:text-4xl">
              {t("forgotPassword.title")}
            </h1>
            <p className="text-muted-foreground mt-4 text-sm md:text-base">
              {t("forgotPassword.description")}
            </p>

            <FormContent className="mt-8 gap-6 px-0">
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
                      className={fieldInputClassName}
                      {...field}
                    />
                  </FormItem>
                )}
              />

              <FormStatus error={serverError} />
              {successMessage ? (
                <p className="bg-primary/10 text-primary rounded-md px-3 py-2 text-sm">
                  {successMessage}
                </p>
              ) : null}
            </FormContent>

            <Button
              type="submit"
              disabled={form.formState.isSubmitting || isPending}
              className="mt-2 h-11 w-full rounded-xl text-sm font-medium"
            >
              {form.formState.isSubmitting || isPending
                ? t("forgotPassword.submitting")
                : t("forgotPassword.submit")}
            </Button>

            <p className="text-muted-foreground mt-6 text-center text-sm">
              {t("forgotPassword.remembered")}{" "}
              <Link href="/login" className="text-primary font-medium">
                {t("forgotPassword.signIn")}
              </Link>
            </p>
          </FormRoot>
        </Form>
      }
      showcase={<AuthShowcasePanel variant="trust" />}
    />
  );
};

export default ForgotPasswordForm;
