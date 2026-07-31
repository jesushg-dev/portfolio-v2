"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { FC, SVGProps } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { authClient } from "@/lib/auth-client";
import {
  buildLocalizedCallbackUrl,
  safeInternalPath,
  type AppHref,
} from "@/lib/auth-routing";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormContent, FormItem, FormRoot } from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";
import AuthBrandHeader from "@/features/auth/components/auth-brand-header";
import AuthSplitLayout from "@/features/auth/components/auth-split-layout";
import AuthShowcasePanel from "@/features/auth/components/auth-showcase-panel";

const fieldInputClassName = "mt-1 h-11 shadow-sm";

interface LoginFormProps {
  socialProviders?: {
    github?: boolean;
    google?: boolean;
  };
}

const LoginForm: FC<LoginFormProps> = ({ socialProviders }) => {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(
    () => safeInternalPath(searchParams.get("next")),
    [searchParams],
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasSocialProviders = socialProviders?.github ?? socialProviders?.google;
  const [socialLoading, setSocialLoading] = useState<
    "github" | "google" | null
  >(null);

  const LoginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      }),
    [],
  );

  type LoginInput = z.infer<typeof LoginSchema>;

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const callbackURL = useMemo(
    () => buildLocalizedCallbackUrl(locale, redirectTo),
    [locale, redirectTo],
  );

  const onSubmit = useCallback(
    (data: LoginInput) => {
      startTransition(async () => {
        setServerError(null);
        const { error } = await authClient.signIn.email({
          email: data.email,
          password: data.password,
          callbackURL,
        });
        if (error) {
          setServerError(error.message ?? t("errorSignIn"));
          return;
        }
        // Full navigation so the session cookie set by the auth API is sent on the next request.
        window.location.assign(callbackURL);
      });
    },
    [callbackURL, t],
  );

  const handleSocialSignIn = useCallback(
    async (provider: "github" | "google") => {
      setServerError(null);
      setSocialLoading(provider);
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL,
      });
      if (error) {
        setServerError(error.message ?? t("errorSignIn"));
        setSocialLoading(null);
      }
    },
    [callbackURL, t],
  );

  const socialCount =
    Number(socialProviders?.github ?? false) +
    Number(socialProviders?.google ?? false);

  const registerHref: AppHref =
    redirectTo === "/admin"
      ? "/register"
      : {
          pathname: "/register",
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
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-4 max-w-xl text-left text-sm md:text-base">
              {redirectTo.startsWith("/admin/cv")
                ? t("subtitleCv")
                : t("subtitleDefault")}
            </p>

            <FormContent className="mt-8 gap-6 px-0">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem label={t("email")} inputId="login-email">
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder={t("emailPlaceholder")}
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
                  <FormItem label={t("password")} inputId="login-password">
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder={t("passwordPlaceholder")}
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
              disabled={isPending || !!socialLoading}
              className="mt-2 h-11 w-full rounded-xl text-sm font-medium"
            >
              {isPending ? t("submitting") : t("submit")}
            </Button>

            {hasSocialProviders ? (
              <>
                <div className="mt-6 flex items-center">
                  <div className="bg-border h-px flex-1" />
                  <span className="text-muted-foreground px-4 text-sm">
                    {t("or")}
                  </span>
                  <div className="bg-border h-px flex-1" />
                </div>

                <div
                  className={cn(
                    "mt-4 grid grid-cols-1 gap-4",
                    socialCount > 1 && "sm:grid-cols-2",
                  )}
                >
                  {socialProviders?.google ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!!socialLoading}
                      onClick={() => void handleSocialSignIn("google")}
                      className="w-full rounded-xl py-6"
                      aria-label={
                        socialLoading === "google"
                          ? t("connectingGoogle")
                          : t("signInGoogle")
                      }
                    >
                      <GoogleBrandIcon />
                    </Button>
                  ) : null}
                  {socialProviders?.github ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!!socialLoading}
                      onClick={() => void handleSocialSignIn("github")}
                      className="w-full rounded-xl py-6"
                      aria-label={
                        socialLoading === "github"
                          ? t("connectingGithub")
                          : t("signInGithub")
                      }
                    >
                      <GitHubBrandIcon />
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}

            <div className="text-muted-foreground mt-8 space-y-2 text-center text-sm">
              <p>
                {t("noAccount")}{" "}
                <Link
                  href={registerHref}
                  className="text-primary inline-flex min-h-11 items-center font-medium hover:underline"
                >
                  {t("signUp")}
                </Link>
              </p>
              <p>
                <Link
                  href="/forgot-password"
                  className="text-primary inline-flex min-h-11 items-center font-medium hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              </p>
            </div>
          </FormRoot>
        </Form>
      }
      showcase={<AuthShowcasePanel variant="hero" />}
    />
  );
};

function GoogleBrandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={29}
      height={29}
      viewBox="0 0 29 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <g clipPath="url(#login-google-clip)">
        <path
          d="M25.1018 15.1176C25.1018 14.1999 25.0273 13.5302 24.8662 12.8358H14.3867V16.9779H20.5379C20.4139 18.0072 19.7443 19.5575 18.256 20.5991L18.2352 20.7378L21.5486 23.3047L21.7781 23.3276C23.8864 21.3805 25.1018 18.5157 25.1018 15.1176Z"
          fill="#4285F4"
        />
        <path
          d="M14.3851 26.0311C17.3986 26.0311 19.9285 25.0389 21.7765 23.3276L18.2544 20.5991C17.3118 21.2564 16.0468 21.7153 14.3851 21.7153C11.4335 21.7153 8.92835 19.7683 8.03534 17.0771L7.90444 17.0882L4.45912 19.7546L4.41406 19.8799C6.24949 23.5259 10.0196 26.0311 14.3851 26.0311Z"
          fill="#34A853"
        />
        <path
          d="M8.03837 17.0772C7.80275 16.3827 7.66638 15.6385 7.66638 14.8697C7.66638 14.1007 7.80275 13.3567 8.02598 12.6622L8.01973 12.5143L4.53123 9.80505L4.4171 9.85934C3.66063 11.3724 3.22656 13.0714 3.22656 14.8697C3.22656 16.6679 3.66063 18.3669 4.4171 19.8799L8.03837 17.0772Z"
          fill="#FBBC05"
        />
        <path
          d="M14.3851 8.02383C16.4809 8.02383 17.8947 8.92915 18.7008 9.68571L21.8508 6.61007C19.9162 4.81182 17.3986 3.70807 14.3851 3.70807C10.0196 3.70807 6.24949 6.21319 4.41406 9.85926L8.02294 12.6621C8.92835 9.97092 11.4335 8.02383 14.3851 8.02383Z"
          fill="#EB4335"
        />
      </g>
      <defs>
        <clipPath id="login-google-clip">
          <rect
            width={22.4}
            height={22.4}
            fill="white"
            transform="translate(2.96875 3.7081)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}

function GitHubBrandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={29}
      height={29}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="text-background"
      {...props}
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default LoginForm;
