"use client";

import { useCallback, useState, useTransition } from "react";
import type { FC } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { authClient } from "@/lib/auth-client";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
} from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

const ForgotPasswordForm: FC = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = useCallback((data: ForgotPasswordInput) => {
    startTransition(async () => {
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
    });
  }, []);

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem label="Email" inputId="forgot-password-email">
                <Input type="email" autoComplete="email" {...field} />
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
          isPending={form.formState.isSubmitting || isPending}
          title="Send reset link"
        />

        <p className="text-muted-foreground text-center text-sm">
          Remembered your password?{" "}
          <Link href="/login" className="text-primary font-medium">
            Sign in
          </Link>
        </p>
      </FormRoot>
    </Form>
  );
};

export default ForgotPasswordForm;
