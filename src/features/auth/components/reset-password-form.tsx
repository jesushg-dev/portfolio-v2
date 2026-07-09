"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { FC } from "react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth-client";
import { useMounted } from "@/hooks/use-mounted";
import { Link, useRouter } from "@/i18n/routing";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormContent, FormItem, FormRoot } from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";
import AuthBrandHeader from "@/features/auth/components/auth-brand-header";
import AuthSplitLayout from "@/features/auth/components/auth-split-layout";
import AuthShowcasePanel from "@/features/auth/components/auth-showcase-panel";

const fieldInputClassName = "mt-1 h-11 shadow-sm";

const readTokenFromUrl = () => {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("token") ?? params.get("code") ?? "";
};

const ResetPasswordForm: FC = () => {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const mounted = useMounted();
  const searchToken =
    searchParams.get("token") ?? searchParams.get("code") ?? "";
  const token = searchToken || (mounted ? readTokenFromUrl() : "");
  const tokenReady = mounted;

  const ResetPasswordSchema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(8),
          confirmPassword: z.string().min(8),
        })
        .refine((data) => data.password === data.confirmPassword, {
          path: ["confirmPassword"],
          message: t("validation.passwordMismatch"),
        }),
    [t],
  );

  type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = useCallback(
    (data: ResetPasswordInput) => {
      startTransition(async () => {
        setServerError(null);
        setSuccessMessage(null);

        const resetToken = token || readTokenFromUrl();
        if (!resetToken) {
          setServerError(t("resetPassword.errorToken"));
          return;
        }

        const { error } = await authClient.resetPassword({
          token: resetToken,
          newPassword: data.password,
        });

        if (error) {
          setServerError(error.message ?? t("resetPassword.error"));
          return;
        }

        setSuccessMessage(t("resetPassword.success"));
        setTimeout(() => {
          router.push("/login");
          router.refresh();
        }, 1200);
      });
    },
    [router, t, token],
  );

  return (
    <AuthSplitLayout
      form={
        <Form {...form}>
          <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
            <AuthBrandHeader />

            <h1 className="text-foreground mt-6 text-left text-3xl font-medium tracking-tight md:text-4xl">
              {t("resetPassword.title")}
            </h1>
            <p className="text-muted-foreground mt-4 text-sm md:text-base">
              {t("resetPassword.description")}
            </p>

            <FormContent className="mt-8 gap-6 px-0">
              {tokenReady && !token ? (
                <p className="bg-muted text-foreground border-border rounded-md border px-3 py-2 text-sm">
                  {t("resetPassword.tokenMissing")}
                </p>
              ) : null}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem
                    label={t("resetPassword.newPassword")}
                    inputId="reset-password"
                  >
                    <Input
                      type="password"
                      autoComplete="new-password"
                      className={fieldInputClassName}
                      {...field}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem
                    label={t("resetPassword.confirmPassword")}
                    inputId="reset-password-confirm"
                  >
                    <Input
                      type="password"
                      autoComplete="new-password"
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
              disabled={form.formState.isSubmitting || isPending || !token}
              className="mt-2 h-11 w-full rounded-xl text-sm font-medium"
            >
              {form.formState.isSubmitting || isPending
                ? t("resetPassword.submitting")
                : t("resetPassword.submit")}
            </Button>

            <p className="text-muted-foreground mt-6 text-center text-sm">
              {t("resetPassword.backToSignIn")}{" "}
              <Link href="/login" className="text-primary font-medium">
                {t("register.signIn")}
              </Link>
            </p>
          </FormRoot>
        </Form>
      }
      showcase={<AuthShowcasePanel variant="trust" />}
    />
  );
};

export default ResetPasswordForm;
