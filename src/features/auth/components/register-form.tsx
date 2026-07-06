"use client";

import { useState } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { api } from "@/trpc/react";

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
});

type RegisterInput = z.infer<typeof RegisterSchema>;

const RegisterForm: FC = () => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const upsertProfile = api.cv.upsertProfile.useMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    const { error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
    });
    if (error) {
      setServerError(error.message ?? "Could not sign up");
      return;
    }

    // Create the profile (subdomain) for the new user.
    try {
      await upsertProfile.mutateAsync({
        username: data.username,
        displayName: data.name,
        defaultLocale: "en",
        isPublished: false,
      });
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Could not create profile",
      );
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          {...register("name")}
          className="focus:border-primary-700 focus:ring-primary-700 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:outline-none"
        />
        {errors.name ? (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="username">
          Username (subdomain)
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          placeholder="e.g. jesus → jesus.jesushg.com"
          {...register("username")}
          className="focus:border-primary-700 focus:ring-primary-700 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:outline-none"
        />
        {errors.username ? (
          <p className="text-xs text-red-500">{errors.username.message}</p>
        ) : null}
      </div>

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

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="password">
          Password
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

      {serverError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary-700 hover:bg-primary-800 rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-primary-700 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;
