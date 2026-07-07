"use client";

import { useCallback, useState, useTransition } from "react";
import type { FC, SVGProps } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormContent, FormItem, FormRoot } from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginInput = z.infer<typeof LoginSchema>;

/** Temporary showcase image — swap when final auth artwork is ready. */
const LOGIN_SHOWCASE_IMAGE =
  "https://res.cloudinary.com/js-media/image/upload/f_auto/q_auto/v1642524508/portfolio/hero/3233453_brzqcm.webp";

interface LoginFormProps {
  socialProviders?: {
    github?: boolean;
    google?: boolean;
  };
}

const socialButtonClassName =
  "bg-foreground text-background hover:bg-foreground/90 flex w-full cursor-pointer items-center justify-center rounded-xl py-4 text-sm font-medium transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const fieldInputClassName = "mt-1 h-11 shadow-sm";

const LoginForm: FC<LoginFormProps> = ({ socialProviders }) => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasSocialProviders = socialProviders?.github ?? socialProviders?.google;
  const [socialLoading, setSocialLoading] = useState<
    "github" | "google" | null
  >(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = useCallback(
    (data: LoginInput) => {
      startTransition(async () => {
        setServerError(null);
        const { error } = await authClient.signIn.email({
          email: data.email,
          password: data.password,
          callbackURL: "/admin",
        });
        if (error) {
          setServerError(error.message ?? "Could not sign in");
          return;
        }
        router.push("/admin");
        router.refresh();
      });
    },
    [router],
  );

  const handleSocialSignIn = useCallback(
    async (provider: "github" | "google") => {
      setServerError(null);
      setSocialLoading(provider);
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: "/admin",
      });
      if (error) {
        setServerError(error.message ?? "Could not sign in");
        setSocialLoading(null);
      }
    },
    [],
  );

  const socialCount =
    Number(socialProviders?.github ?? false) +
    Number(socialProviders?.google ?? false);

  return (
    <div className="mx-auto w-full max-w-7xl py-10 md:py-20">
      <div className="grid grid-cols-1 gap-10 px-4 md:grid-cols-2 md:px-8 lg:gap-24 xl:gap-40">
        <Form {...form}>
          <FormRoot
            className="flex-none overflow-visible"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Link
              href="/"
              className="text-foreground inline-flex items-center gap-2 text-sm font-medium"
            >
              <Image
                alt="Jehg"
                width={28}
                height={28}
                src="/icon-192x192.png"
                className="rounded-sm"
              />
              <span>Jehg.</span>
            </Link>

            <h1 className="text-foreground mt-6 text-left text-3xl font-medium tracking-tight md:text-4xl">
              Welcome back!
            </h1>
            <p className="text-muted-foreground mt-4 max-w-xl text-left text-sm md:text-base">
              Sign in to manage your portfolio, projects, skills, and
              certifications from one place.
            </p>

            <FormContent className="mt-8 gap-6 px-0">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem label="Email">
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="youremail@yourdomain.com"
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
                  <FormItem label="Password">
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
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
              {isPending ? "Signing in..." : "Sign in"}
            </Button>

            {hasSocialProviders ? (
              <>
                <div className="mt-6 flex items-center">
                  <div className="bg-border h-px flex-1" />
                  <span className="text-muted-foreground px-4 text-sm">or</span>
                  <div className="bg-border h-px flex-1" />
                </div>

                <div
                  className={cn(
                    "mt-4 grid grid-cols-1 gap-4",
                    socialCount > 1 && "sm:grid-cols-2",
                  )}
                >
                  {socialProviders?.google ? (
                    <button
                      type="button"
                      disabled={!!socialLoading}
                      onClick={() => void handleSocialSignIn("google")}
                      className={socialButtonClassName}
                      aria-label={
                        socialLoading === "google"
                          ? "Connecting with Google"
                          : "Sign in with Google"
                      }
                    >
                      <GoogleBrandIcon />
                    </button>
                  ) : null}
                  {socialProviders?.github ? (
                    <button
                      type="button"
                      disabled={!!socialLoading}
                      onClick={() => void handleSocialSignIn("github")}
                      className={socialButtonClassName}
                      aria-label={
                        socialLoading === "github"
                          ? "Connecting with GitHub"
                          : "Sign in with GitHub"
                      }
                    >
                      <GitHubBrandIcon />
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}

            <div className="text-muted-foreground mt-8 space-y-2 text-center text-sm">
              <p>
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-primary font-medium hover:underline"
                >
                  Sign up
                </Link>
              </p>
              <p>
                <Link
                  href="/forgot-password"
                  className="text-primary font-medium hover:underline"
                >
                  Forgot your password?
                </Link>
              </p>
            </div>
          </FormRoot>
        </Form>

        <LoginShowcase />
      </div>
    </div>
  );
};

function LoginShowcase() {
  return (
    <div className="relative flex min-h-80 flex-col items-start justify-end overflow-hidden rounded-2xl md:min-h-[32rem]">
      <Image
        src={LOGIN_SHOWCASE_IMAGE}
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="from-background-900 via-background-900/80 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent"
      />

      <div className="relative z-10 mb-2 flex flex-wrap items-center gap-2 p-4 md:p-8 md:pb-0">
        <span className="text-secondaryText-50 rounded-md bg-black/40 px-2 py-1 text-xs backdrop-blur-sm">
          Portfolio
        </span>
        <span className="text-secondaryText-50 rounded-md bg-black/40 px-2 py-1 text-xs backdrop-blur-sm">
          Admin Panel
        </span>
      </div>

      <div className="relative z-10 m-4 max-w-sm rounded-xl bg-black/40 p-4 backdrop-blur-sm md:m-8">
        <h2 className="text-secondaryText-50 text-base leading-relaxed font-medium">
          Manage your entire portfolio from a single dashboard — projects,
          skills, timeline, and CV in one workflow.
        </h2>
        <p className="text-secondaryText-50/60 mt-4 text-sm">Jesús Hernández</p>
        <p className="text-secondaryText-50/60 mt-1 text-sm">
          Full Stack Developer,{" "}
          <span className="text-secondaryText-50 font-semibold">Jehg.</span>
        </p>
      </div>
    </div>
  );
}

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
