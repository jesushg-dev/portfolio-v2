"use client";

import { useState } from "react";
import type { FC } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { authClient } from "@/lib/auth-client";
import { useMounted } from "@/hooks/use-mounted";

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

const readTokenFromUrl = () => {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("token") ?? params.get("code") ?? "";
};

const ResetPasswordForm: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mounted = useMounted();
  const searchToken =
    searchParams.get("token") ?? searchParams.get("code") ?? "";
  const token = searchToken || (mounted ? readTokenFromUrl() : "");
  const tokenReady = mounted;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError(null);
    setSuccessMessage(null);

    const resetToken = token || readTokenFromUrl();
    if (!resetToken) {
      setServerError("Missing reset token in URL.");
      return;
    }

    const { error } = await authClient.resetPassword({
      token: resetToken,
      newPassword: data.password,
    });

    if (error) {
      setServerError(error.message ?? "Could not reset password");
      return;
    }

    setSuccessMessage("Password updated successfully. Redirecting to login...");
    setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 1200);
  };

  return (
    <form
      method="post"
      action="#"
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(onSubmit)(event);
      }}
    >
      {tokenReady && !token ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Invalid or missing reset token. Open the link from your reset email
          again.
        </p>
      ) : null}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          className="focus:border-primary-700 focus:ring-primary-700 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:outline-none"
        />
        {errors.password ? (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="confirmPassword">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          className="focus:border-primary-700 focus:ring-primary-700 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:outline-none"
        />
        {errors.confirmPassword ? (
          <p className="text-xs text-red-500">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      {serverError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !token}
        className="bg-primary-700 hover:bg-primary-800 rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Updating..." : "Update password"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Back to{" "}
        <Link href="/login" className="text-primary-700 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
};

export default ResetPasswordForm;
