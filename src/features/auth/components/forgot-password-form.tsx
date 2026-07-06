"use client";

import { useState } from "react";
import type { FC } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { authClient } from "@/lib/auth-client";

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

const ForgotPasswordForm: FC = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);
    setSuccessMessage(null);

    const { error } = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: "/reset-password",
    });

    if (error) {
      setServerError(error.message ?? "Could not send reset link");
      return;
    }

    setSuccessMessage(
      "If this email exists, a reset link was generated. Check server logs for now.",
    );
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
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className="focus:border-primary-700 focus:ring-primary-700 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:outline-none"
        />
        {errors.email ? (
          <p className="text-xs text-red-500">{errors.email.message}</p>
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
        disabled={isSubmitting}
        className="bg-primary-700 hover:bg-primary-800 rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Sending..." : "Send reset link"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Remembered your password?{" "}
        <Link href="/login" className="text-primary-700 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
};

export default ForgotPasswordForm;
