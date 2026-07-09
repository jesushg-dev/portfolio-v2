"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { api } from "@/trpc/react";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormContent, FormItem, FormRoot } from "@/components/shared/form-root";
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

function safeInternalPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }
  return value;
}

const fieldInputClassName = "mt-1 h-11 shadow-sm";

const RegisterForm: FC = () => {
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

  const form = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      username: "",
    },
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

        router.push(redirectTo);
        router.refresh();
      });
    },
    [redirectTo, router, upsertProfile],
  );

  return (
    <div className="mx-auto w-full max-w-lg py-10 md:py-16">
      <div className="px-4 sm:px-6">
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
              {isCvFlow ? "Build your CV" : "Create your portfolio"}
            </h1>
            <p className="text-muted-foreground mt-4 max-w-xl text-left text-sm leading-relaxed md:text-base">
              {isCvFlow
                ? "Create a free account to start your CV. You’ll get a personal space to add experience, education, skills, and languages — then export or share when you’re ready. This generator is still in beta."
                : "Create a free account to get your own portfolio space: projects, skills, certifications, timeline, and a CV builder you can edit anytime. Pick a username for your subdomain and you’re ready to go."}
            </p>

            <ul className="text-muted-foreground mt-5 space-y-2 text-sm">
              {(isCvFlow
                ? [
                    "Edit experience, education, skills, and languages",
                    "Keep drafts private until you publish",
                    "Come back anytime from any device",
                  ]
                : [
                    "Your own subdomain for a public portfolio",
                    "Admin tools for projects, skills, and certificates",
                    "Built-in CV editor (beta) included",
                  ]
              ).map((item) => (
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
                  <FormItem label="Full name" inputId="register-name">
                    <Input
                      autoComplete="name"
                      placeholder="Your name"
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
                    label="Username (subdomain)"
                    description="e.g. jesus → jesus.jesushg.com"
                    inputId="register-username"
                  >
                    <Input
                      autoComplete="username"
                      placeholder="your-name"
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
                  <FormItem label="Email" inputId="register-email">
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
                  <FormItem label="Password" inputId="register-password">
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
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
              disabled={isPending || form.formState.isSubmitting}
              className="mt-2 h-11 w-full rounded-xl text-sm font-medium"
            >
              {isPending || form.formState.isSubmitting
                ? "Creating account…"
                : isCvFlow
                  ? "Create account & start CV"
                  : "Create account"}
            </Button>

            <p className="text-muted-foreground mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link
                href={
                  redirectTo === "/admin"
                    ? "/login"
                    : `/login?next=${encodeURIComponent(redirectTo)}`
                }
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </FormRoot>
        </Form>
      </div>
    </div>
  );
};

export default RegisterForm;
