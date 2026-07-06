"use client";

import { useState } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginInput = z.infer<typeof LoginSchema>;

interface LoginFormProps {
  socialProviders?: {
    github?: boolean;
    google?: boolean;
  };
}

const socialButtonClassName =
  "flex flex-1 items-center justify-center space-x-2 rounded-md border border-neutral-200 bg-gray-100 px-4 py-3 text-neutral-700 shadow-[0px_1.5px_0px_0px_rgba(0,0,0,0.05)_inset] transition duration-200 hover:bg-gray-100/80 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-[0px_1.5px_0px_0px_rgba(255,255,255,0.05)_inset] dark:hover:bg-neutral-800/80";

const inputClassName =
  "block h-10 w-full rounded-md border border-neutral-200 bg-white px-4 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/30 focus:outline-none sm:text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/30";

const LoginForm: FC<LoginFormProps> = ({ socialProviders }) => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const hasSocialProviders = socialProviders?.github ?? socialProviders?.google;
  const [showEmailForm, setShowEmailForm] = useState(!hasSocialProviders);
  const [socialLoading, setSocialLoading] = useState<
    "github" | "google" | null
  >(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
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
  };

  const handleSocialSignIn = async (provider: "github" | "google") => {
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
  };

  const handleContinueWithEmail = () => {
    if (!showEmailForm) {
      setShowEmailForm(true);
      return;
    }
    void handleSubmit(onSubmit)();
  };

  return (
    <form
      className="relative z-10 mx-auto flex h-screen max-w-lg flex-col items-center justify-center px-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Link
        href="/"
        className="relative z-20 mb-2 flex items-center space-x-2 px-2 py-1 text-sm font-normal"
      >
        <Image
          alt="logo"
          width={30}
          height={30}
          src="/icon-192x192.png"
          className="rounded-sm"
        />
        <span className="font-medium text-black dark:text-white">
          Portfolio JHG
        </span>
      </Link>

      <h1 className="my-4 text-center text-xl font-bold text-neutral-800 md:text-4xl dark:text-neutral-100">
        Sign in to your account
      </h1>

      {hasSocialProviders ? (
        <div className="flex w-full flex-col gap-4 sm:flex-row">
          {socialProviders?.github ? (
            <button
              type="button"
              disabled={!!socialLoading}
              onClick={() => void handleSocialSignIn("github")}
              className={socialButtonClassName}
            >
              <GitHubIcon />
              <span className="text-sm">
                {socialLoading === "github"
                  ? "Connecting..."
                  : "Login with GitHub"}
              </span>
            </button>
          ) : null}
          {socialProviders?.google ? (
            <button
              type="button"
              disabled={!!socialLoading}
              onClick={() => void handleSocialSignIn("google")}
              className={socialButtonClassName}
            >
              <GoogleIcon />
              <span className="text-sm">
                {socialLoading === "google"
                  ? "Connecting..."
                  : "Login with Google"}
              </span>
            </button>
          ) : null}
        </div>
      ) : null}

      {hasSocialProviders ? (
        <div className="my-6 h-px w-full bg-neutral-200 dark:bg-neutral-800" />
      ) : null}

      <div
        className={cn(
          "grid w-full transition-all duration-300",
          showEmailForm
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <div className="flex flex-col gap-1">
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
              className={inputClassName}
            />
            {errors.email ? (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              {...register("password")}
              className={inputClassName}
            />
            {errors.password ? (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            ) : null}
          </div>
        </div>
      </div>

      {serverError ? (
        <p className="mt-4 w-full rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {serverError}
        </p>
      ) : null}

      <button
        type={showEmailForm ? "submit" : "button"}
        disabled={isSubmitting || !!socialLoading}
        onClick={showEmailForm ? undefined : handleContinueWithEmail}
        className="group/btn relative mt-4 w-full rounded-lg bg-black px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
      >
        <div className="absolute inset-0 h-full w-full transform opacity-0 transition duration-200 group-hover/btn:opacity-100">
          <div className="absolute -top-px -left-px h-4 w-4 rounded-tl-lg border-t-2 border-l-2 border-black bg-transparent transition-all duration-200 group-hover/btn:-top-4 group-hover/btn:-left-4 dark:border-white" />
          <div className="absolute -top-px -right-px h-4 w-4 rounded-tr-lg border-t-2 border-r-2 border-black bg-transparent transition-all duration-200 group-hover/btn:-top-4 group-hover/btn:-right-4 dark:border-white" />
          <div className="absolute -bottom-px -left-px h-4 w-4 rounded-bl-lg border-b-2 border-l-2 border-black bg-transparent transition-all duration-200 group-hover/btn:-bottom-4 group-hover/btn:-left-4 dark:border-white" />
          <div className="absolute -right-px -bottom-px h-4 w-4 rounded-br-lg border-r-2 border-b-2 border-black bg-transparent transition-all duration-200 group-hover/btn:-right-4 group-hover/btn:-bottom-4 dark:border-white" />
        </div>
        <span className="text-sm">
          {isSubmitting
            ? "Signing in..."
            : showEmailForm
              ? "Sign in"
              : "Continue with Email"}
        </span>
      </button>

      {showEmailForm ? (
        <div className="mt-6 flex flex-col gap-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
          <Link
            href="/forgot-password"
            className="font-medium text-neutral-700 hover:underline dark:text-neutral-300"
          >
            Forgot your password?
          </Link>
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-neutral-700 hover:underline dark:text-neutral-300"
            >
              Sign up
            </Link>
          </p>
        </div>
      ) : null}
    </form>
  );
};

function GitHubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-neutral-700 dark:text-neutral-300"
    >
      <path
        d="M5.315 2.1c.791 -.113 1.9 .145 3.333 .966l.272 .161l.16 .1l.397 -.083a13.3 13.3 0 0 1 4.59 -.08l.456 .08l.396 .083l.161 -.1c1.385 -.84 2.487 -1.17 3.322 -1.148l.164 .008l.147 .017l.076 .014l.05 .011l.144 .047a1 1 0 0 1 .53 .514a5.2 5.2 0 0 1 .397 2.91l-.047 .267l-.046 .196l.123 .163c.574 .795 .93 1.728 1.03 2.707l.023 .295l.007 .272c0 3.855 -1.659 5.883 -4.644 6.68l-.245 .061l-.132 .029l.014 .161l.008 .157l.004 .365l-.002 .213l-.003 3.834a1 1 0 0 1 -.883 .993l-.117 .007h-6a1 1 0 0 1 -.993 -.883l-.007 -.117v-.734c-1.818 .26 -3.03 -.424 -4.11 -1.878l-.535 -.766c-.28 -.396 -.455 -.579 -.589 -.644l-.048 -.019a1 1 0 0 1 .564 -1.918c.642 .188 1.074 .568 1.57 1.239l.538 .769c.76 1.079 1.36 1.459 2.609 1.191l.001 -.678l-.018 -.168a5.03 5.03 0 0 1 -.021 -.824l.017 -.185l.019 -.12l-.108 -.024c-2.976 -.71 -4.703 -2.573 -4.875 -6.139l-.01 -.31l-.004 -.292a5.6 5.6 0 0 1 .908 -3.051l.152 -.222l.122 -.163l-.045 -.196a5.2 5.2 0 0 1 .145 -2.642l.1 -.282l.106 -.253a1 1 0 0 1 .529 -.514l.144 -.047l.154 -.03z"
        fill="currentColor"
        strokeWidth="0"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-neutral-700 dark:text-neutral-300"
    >
      <path
        d="M12 2a9.96 9.96 0 0 1 6.29 2.226a1 1 0 0 1 .04 1.52l-1.51 1.362a1 1 0 0 1 -1.265 .06a6 6 0 1 0 2.103 6.836l.001 -.004h-3.66a1 1 0 0 1 -.992 -.883l-.007 -.117v-2a1 1 0 0 1 1 -1h6.945a1 1 0 0 1 .994 .89c.04 .367 .061 .737 .061 1.11c0 5.523 -4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10z"
        fill="currentColor"
        strokeWidth="0"
      />
    </svg>
  );
}

export default LoginForm;
