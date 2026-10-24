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
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem as ShadcnFormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormContent, FormRoot } from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";
import LoginLayout from "@/features/auth/components/login-layout";

const fieldInputClassName =
  "mt-1.5 h-12 rounded-xl border-border/70 bg-background/40 px-4 shadow-none transition-colors focus-visible:border-primary/60 focus-visible:ring-primary/15";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <LoginLayout variant="reset">
      <Form {...form}>
        <FormRoot
          className="text-foreground [&_input]:text-foreground [&_input]:placeholder:text-muted-foreground [&_label]:text-muted-foreground flex-none overflow-visible [&_label]:text-xs [&_label]:font-medium"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <h1 className="text-foreground text-left text-4xl font-semibold tracking-tight sm:text-5xl">
            {formatHighlightTitle(t("resetPassword.title"))}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-left text-sm leading-relaxed sm:text-base">
            {t("resetPassword.description")}
          </p>

          <FormContent className="mt-8 gap-4 px-0">
            {tokenReady && !token ? (
              <p className="bg-destructive/10 text-destructive border-destructive/20 rounded-xl border px-4 py-3 text-sm">
                {t("resetPassword.tokenMissing")}
              </p>
            ) : null}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <ShadcnFormItem id="reset-password">
                  <FormLabel>{t("resetPassword.newPassword")}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className={cn(
                          fieldInputClassName,
                          "border-border/70 bg-background/40 pr-16",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? t("hidePassword") : t("showPassword")
                      }
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 flex min-h-11 -translate-y-1/2 items-center px-2 text-xs font-medium transition-colors focus-visible:underline focus-visible:outline-none"
                    >
                      {showPassword ? t("hide") : t("show")}
                    </button>
                  </div>
                  <FormMessage />
                </ShadcnFormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <ShadcnFormItem id="reset-password-confirm">
                  <FormLabel>{t("resetPassword.confirmPassword")}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className={cn(
                          fieldInputClassName,
                          "border-border/70 bg-background/40 pr-16",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword
                          ? t("hidePassword")
                          : t("showPassword")
                      }
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 flex min-h-11 -translate-y-1/2 items-center px-2 text-xs font-medium transition-colors focus-visible:underline focus-visible:outline-none"
                    >
                      {showConfirmPassword ? t("hide") : t("show")}
                    </button>
                  </div>
                  <FormMessage />
                </ShadcnFormItem>
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
              </div>
            ) : null}
          </FormContent>

          <Button
            type="submit"
            disabled={form.formState.isSubmitting || isPending || !token}
            className="shadow-primary/20 mt-2 h-12 w-full rounded-xl text-sm font-semibold shadow-lg"
          >
            {form.formState.isSubmitting || isPending
              ? t("resetPassword.submitting")
              : t("resetPassword.submit")}
          </Button>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            {t("resetPassword.backToSignIn")}{" "}
            <Link
              href="/login"
              className="text-primary inline-flex min-h-11 items-center font-medium hover:underline"
            >
              {t("register.signIn")}
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

export default ResetPasswordForm;
