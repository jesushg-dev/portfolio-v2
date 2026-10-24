"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { FC } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { authClient } from "@/lib/auth-client";
import { safeInternalPath, type AppHref } from "@/lib/auth-routing";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem as ShadcnFormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormContent, FormItem, FormRoot } from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";
import LoginLayout from "@/features/auth/components/login-layout";

const fieldInputClassName =
  "mt-1.5 h-12 rounded-xl border-border/70 bg-background/40 px-4 shadow-none transition-colors focus-visible:border-primary/60 focus-visible:ring-primary/15";

const RegisterForm: FC = () => {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(
    () => safeInternalPath(searchParams.get("next")),
    [searchParams],
  );
  const isCvFlow = redirectTo.startsWith("/admin/cv");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const upsertProfile = api.cv.upsertProfile.useMutation();

  const RegisterSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
        username: z
          .string()
          .min(3)
          .max(40)
          .regex(/^[a-z0-9-]+$/, t("validation.usernameFormat")),
      }),
    [t],
  );

  type RegisterInput = z.infer<typeof RegisterSchema>;

  const form = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      username: "",
    },
  });

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedUsername = useWatch({
    control: form.control,
    name: "username",
  });
  const watchedPassword = useWatch({
    control: form.control,
    name: "password",
  });

  const passwordScore = useMemo(
    () => calculatePasswordScore(watchedPassword ?? ""),
    [watchedPassword],
  );

  const onSubmit = useCallback(
    (data: RegisterInput) => {
      startTransition(async () => {
        setServerError(null);
        const { error } = await authClient.signUp.email({
          email: data.email,
          password: data.password,
          name: data.name,
        });
        if (error) {
          setServerError(error.message ?? t("register.errorSignUp"));
          return;
        }

        try {
          await upsertProfile.mutateAsync({
            username: data.username,
            displayName: data.name,
            defaultLocale: locale,
            isPublished: false,
          });
        } catch (err) {
          setServerError(
            err instanceof Error ? err.message : t("register.errorProfile"),
          );
          return;
        }

        router.push(redirectTo);
        router.refresh();
      });
    },
    [locale, redirectTo, router, t, upsertProfile],
  );

  const loginHref: AppHref =
    redirectTo === "/admin"
      ? "/login"
      : {
          pathname: "/login",
          query: { next: redirectTo },
        };

  return (
    <LoginLayout
      badge={isCvFlow ? t("showcase.badgeCv") : t("showcase.badgePortfolio")}
      variant="register"
      registerPreview={{
        name: watchedName,
        username: watchedUsername,
      }}
    >
      <Form {...form}>
        <FormRoot
          className="text-foreground [&_input]:text-foreground [&_input]:placeholder:text-muted-foreground [&_label]:text-muted-foreground flex-none overflow-visible [&_label]:text-xs [&_label]:font-medium"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <h1 className="text-foreground text-left text-4xl font-semibold tracking-tight sm:text-5xl">
            {formatHighlightTitle(
              isCvFlow ? t("register.titleCv") : t("register.titlePortfolio"),
            )}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-left text-sm leading-relaxed sm:text-base">
            {isCvFlow
              ? t("register.descriptionCv")
              : t("register.descriptionPortfolio")}
          </p>

          <FormContent className="mt-8 gap-4 px-0">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem
                  label={t("register.fullName")}
                  inputId="register-name"
                >
                  <Input
                    autoComplete="name"
                    placeholder={t("register.fullNamePlaceholder")}
                    className={cn(
                      fieldInputClassName,
                      "border-border/70 bg-background/40",
                    )}
                    {...field}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <ShadcnFormItem id="register-username">
                  <FormLabel>{t("register.username")}</FormLabel>
                  <div className="border-border/70 bg-background/40 focus-within:border-primary/60 focus-within:ring-primary/15 mt-1.5 flex h-12 items-center rounded-xl border transition-colors focus-within:ring-4">
                    <FormControl>
                      <input
                        autoComplete="username"
                        placeholder={t("register.usernamePlaceholder")}
                        className="placeholder:text-muted-foreground text-foreground w-full bg-transparent px-4 py-3 text-sm outline-none"
                        value={field.value}
                        onChange={(e) => {
                          const sanitized = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "");
                          field.onChange(sanitized);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <span className="text-muted-foreground pr-4 text-sm font-medium select-none">
                      .jesushg.com
                    </span>
                  </div>
                  <FormDescription>
                    {t("register.usernameDescription")}
                  </FormDescription>
                  <FormMessage />
                </ShadcnFormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem label={t("register.email")} inputId="register-email">
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder={t("register.emailPlaceholder")}
                    className={cn(
                      fieldInputClassName,
                      "border-border/70 bg-background/40",
                    )}
                    {...field}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <ShadcnFormItem id="register-password">
                  <FormLabel>{t("register.password")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder={t("register.passwordPlaceholder")}
                        className={cn(
                          fieldInputClassName,
                          "border-border/70 bg-background/40 pr-16",
                        )}
                        {...field}
                      />
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
                  </FormControl>
                  <div className="mt-2.5 flex gap-1.5" aria-hidden="true">
                    <span
                      className={cn(
                        "h-1 flex-1 rounded transition-colors",
                        getStrengthBarClass(0, passwordScore),
                      )}
                    />
                    <span
                      className={cn(
                        "h-1 flex-1 rounded transition-colors",
                        getStrengthBarClass(1, passwordScore),
                      )}
                    />
                    <span
                      className={cn(
                        "h-1 flex-1 rounded transition-colors",
                        getStrengthBarClass(2, passwordScore),
                      )}
                    />
                    <span
                      className={cn(
                        "h-1 flex-1 rounded transition-colors",
                        getStrengthBarClass(3, passwordScore),
                      )}
                    />
                  </div>
                  <p
                    id="password-strength-label"
                    className="text-muted-foreground mt-1.5 text-xs font-normal"
                    aria-live="polite"
                  >
                    {getStrengthLabel(passwordScore, watchedPassword, t)}
                  </p>
                  <FormMessage />
                </ShadcnFormItem>
              )}
            />

            <FormStatus error={serverError} />
          </FormContent>

          <Button
            type="submit"
            id="register-form-submit"
            disabled={isPending || form.formState.isSubmitting}
            className="shadow-primary/20 mt-2 h-12 w-full rounded-xl text-sm font-semibold shadow-lg"
          >
            {isPending || form.formState.isSubmitting
              ? t("register.submitting")
              : isCvFlow
                ? t("register.submitCv")
                : t("register.submit")}
          </Button>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            {t("register.hasAccount")}{" "}
            <Link
              href={loginHref}
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

function calculatePasswordScore(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function getStrengthBarClass(barIndex: number, score: number): string {
  if (score === 0 || barIndex >= score) {
    return "bg-muted";
  }
  if (score === 1) return "bg-destructive";
  if (score === 2) return "bg-amber-500";
  if (score === 3) return "bg-primary";
  return "bg-emerald-500";
}

function getStrengthLabel(
  score: number,
  password: string | undefined,
  t: ReturnType<typeof useTranslations<"auth">>,
): string {
  if (!password) return t("register.strengthHint");
  if (score <= 1) return t("register.strengthTooWeak");
  if (score === 2) return t("register.strengthGettingThere");
  if (score === 3) return t("register.strengthGood");
  return t("register.strengthStrong");
}

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

export default RegisterForm;
