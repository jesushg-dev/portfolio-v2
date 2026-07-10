"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { authClient } from "@/lib/auth-client";
import { safeInternalPath, type AppHref } from "@/lib/auth-routing";
import { Link, useRouter } from "@/i18n/routing";
import { api } from "@/trpc/react";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormContent, FormItem, FormRoot } from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";
import AuthBrandHeader from "@/features/auth/components/auth-brand-header";
import AuthSplitLayout from "@/features/auth/components/auth-split-layout";
import AuthShowcasePanel from "@/features/auth/components/auth-showcase-panel";

const fieldInputClassName = "mt-1 h-11 shadow-sm";

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

  const bullets = isCvFlow
    ? [
        t("register.bulletCv1"),
        t("register.bulletCv2"),
        t("register.bulletCv3"),
      ]
    : [
        t("register.bulletPortfolio1"),
        t("register.bulletPortfolio2"),
        t("register.bulletPortfolio3"),
      ];

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
    <AuthSplitLayout
      form={
        <Form {...form}>
          <FormRoot
            className="flex-none overflow-visible"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <AuthBrandHeader />

            <h1 className="text-foreground mt-6 text-left text-3xl font-medium tracking-tight md:text-4xl">
              {isCvFlow ? t("register.titleCv") : t("register.titlePortfolio")}
            </h1>
            <p className="text-muted-foreground mt-4 max-w-xl text-left text-sm leading-relaxed md:text-base">
              {isCvFlow
                ? t("register.descriptionCv")
                : t("register.descriptionPortfolio")}
            </p>

            <ul className="text-muted-foreground mt-5 space-y-2 text-sm">
              {bullets.map((item) => (
                <li key={item} className="flex gap-2">
                  <span
                    aria-hidden
                    className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <FormContent className="mt-8 gap-5 px-0">
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
                      className={fieldInputClassName}
                      {...field}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem
                    label={t("register.username")}
                    description={t("register.usernameDescription")}
                    inputId="register-username"
                  >
                    <Input
                      autoComplete="username"
                      placeholder={t("register.usernamePlaceholder")}
                      className={fieldInputClassName}
                      {...field}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem
                    label={t("register.email")}
                    inputId="register-email"
                  >
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder={t("register.emailPlaceholder")}
                      className={fieldInputClassName}
                      {...field}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem
                    label={t("register.password")}
                    inputId="register-password"
                  >
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder={t("register.passwordPlaceholder")}
                      className={fieldInputClassName}
                      {...field}
                    />
                  </FormItem>
                )}
              />

              <FormStatus error={serverError} />
            </FormContent>

            <Button
              type="submit"
              id="register-form-submit"
              disabled={isPending || form.formState.isSubmitting}
              className="mt-2 h-11 w-full rounded-xl text-sm font-medium"
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
                className="text-primary font-medium hover:underline"
              >
                {t("register.signIn")}
              </Link>
            </p>
          </FormRoot>
        </Form>
      }
      showcase={<AuthShowcasePanel variant="community" />}
    />
  );
};

export default RegisterForm;
