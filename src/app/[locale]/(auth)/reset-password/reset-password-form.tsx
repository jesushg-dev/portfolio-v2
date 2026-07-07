"use client";

import { useCallback, useState, useTransition } from "react";
import type { FC } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { authClient } from "@/lib/auth-client";
import { useMounted } from "@/hooks/use-mounted";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
} from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";

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
  const [isPending, startTransition] = useTransition();
  const mounted = useMounted();
  const searchToken =
    searchParams.get("token") ?? searchParams.get("code") ?? "";
  const token = searchToken || (mounted ? readTokenFromUrl() : "");
  const tokenReady = mounted;

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

        setSuccessMessage(
          "Password updated successfully. Redirecting to login...",
        );
        setTimeout(() => {
          router.push("/login");
          router.refresh();
        }, 1200);
      });
    },
    [router, token],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent>
          {tokenReady && !token ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Invalid or missing reset token. Open the link from your reset
              email again.
            </p>
          ) : null}

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem label="New password" inputId="reset-password">
                <Input type="password" autoComplete="new-password" {...field} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem
                label="Confirm password"
                inputId="reset-password-confirm"
              >
                <Input type="password" autoComplete="new-password" {...field} />
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

        <FormActions
          isPending={form.formState.isSubmitting || isPending || !token}
          title="Update password"
        />

        <p className="text-muted-foreground text-center text-sm">
          Back to{" "}
          <Link href="/login" className="text-primary font-medium">
            Sign in
          </Link>
        </p>
      </FormRoot>
    </Form>
  );
};

export default ResetPasswordForm;
