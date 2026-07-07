"use client";

import { useCallback, useState, useTransition } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { api } from "@/trpc/react";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
} from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";

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
  const [isPending, startTransition] = useTransition();
  const upsertProfile = api.cv.upsertProfile.useMutation();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

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
          setServerError(error.message ?? "Could not sign up");
          return;
        }

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
      });
    },
    [router, upsertProfile],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <FormContent>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem label="Full name">
                <Input autoComplete="name" {...field} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem
                label="Username (subdomain)"
                description="e.g. jesus → jesus.jesushg.com"
              >
                <Input autoComplete="username" {...field} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem label="Email">
                <Input type="email" autoComplete="email" {...field} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem label="Password">
                <Input type="password" autoComplete="new-password" {...field} />
              </FormItem>
            )}
          />

          <FormStatus error={serverError} />
        </FormContent>

        <FormActions
          isPending={form.formState.isSubmitting || isPending}
          title="Create account"
        />

        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium">
            Sign in
          </Link>
        </p>
      </FormRoot>
    </Form>
  );
};

export default RegisterForm;
