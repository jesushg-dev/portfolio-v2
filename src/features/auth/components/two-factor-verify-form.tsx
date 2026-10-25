"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { FC, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { authClient } from "@/lib/auth-client";
import {
  buildLocalizedCallbackUrl,
  safeInternalPath,
} from "@/lib/auth-routing";
import { hardNavigate } from "@/lib/hard-navigate";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormContent, FormRoot } from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";
import LoginLayout from "@/features/auth/components/login-layout";
import {
  parseTwoFactorMethods,
  type TwoFactorMethod,
} from "@/features/auth/lib/two-factor-methods";

const fieldInputClassName =
  "mt-1.5 h-12 rounded-xl border-border/70 bg-background/40 px-4 shadow-none transition-colors focus-visible:border-primary/60 focus-visible:ring-primary/15";

/**
 * Second step of a password sign-in for users with 2FA enabled. Better Auth
 * identifies the pending sign-in through a signed cookie, so this form only
 * needs the code. Devices are never remembered (`trustDevice: false`).
 */
const TwoFactorVerifyForm: FC = () => {
  const t = useTranslations("auth.twoFactor");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const redirectTo = useMemo(
    () => safeInternalPath(searchParams.get("next")),
    [searchParams],
  );
  const callbackURL = useMemo(
    () => buildLocalizedCallbackUrl(locale, redirectTo),
    [locale, redirectTo],
  );
  const availableMethods = useMemo(
    () => parseTwoFactorMethods(searchParams.get("methods")),
    [searchParams],
  );

  const [method, setMethod] = useState<TwoFactorMethod>(availableMethods[0]);
  const [code, setCode] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isPending, startTransition] = useTransition();

  const switchMethod = useCallback((next: TwoFactorMethod) => {
    setMethod(next);
    setCode("");
    setServerError(null);
  }, []);

  const sendOtp = useCallback(async () => {
    setServerError(null);
    setIsSendingOtp(true);
    const { error } = await authClient.twoFactor.sendOtp();
    setIsSendingOtp(false);
    if (error) {
      setServerError(error.message ?? t("errorSend"));
      return;
    }
    setOtpSent(true);
  }, [t]);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = code.replace(/\s+/g, "");
      if (!trimmed) return;

      startTransition(async () => {
        setServerError(null);
        const result =
          method === "totp"
            ? await authClient.twoFactor.verifyTotp({
                code: trimmed,
                trustDevice: false,
              })
            : method === "otp"
              ? await authClient.twoFactor.verifyOtp({
                  code: trimmed,
                  trustDevice: false,
                })
              : await authClient.twoFactor.verifyBackupCode({
                  code: trimmed,
                  trustDevice: false,
                });

        if (result.error) {
          const message =
            result.error.status === 401 || result.error.status === 400
              ? (result.error.message ?? t("errorVerify"))
              : t("errorVerify");
          setServerError(message);
          return;
        }
        // Full navigation so the session cookie set by the auth API is sent on the next request.
        hardNavigate(callbackURL);
      });
    },
    [callbackURL, code, method, t],
  );

  const codeLabel = method === "backup" ? t("backupLabel") : t("codeLabel");
  const codePlaceholder =
    method === "backup" ? t("backupPlaceholder") : t("codePlaceholder");
  const canSubmit =
    !isPending && code.trim().length > 0 && (method !== "otp" || otpSent);

  return (
    <LoginLayout badge={t("title")} variant="reset">
      <FormRoot className="flex-none overflow-visible" onSubmit={onSubmit}>
        <h1 className="text-foreground text-left text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-left text-sm leading-relaxed sm:text-base">
          {t(`description.${method}`)}
        </p>

        <FormContent className="mt-8 gap-5 px-0">
          {availableMethods.length > 1 ? (
            <Tabs
              value={method}
              onValueChange={(value) => switchMethod(value as TwoFactorMethod)}
            >
              <TabsList
                className="min-h-12 w-full"
                aria-label={t("methodLabel")}
              >
                {availableMethods.map((item) => (
                  <TabsTrigger
                    key={item}
                    value={item}
                    className="min-h-11 flex-1"
                  >
                    {t(`method.${item}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : null}

          {method === "otp" ? (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSendingOtp || isPending}
                onClick={() => void sendOtp()}
                className="border-border bg-card/40 text-foreground hover:bg-accent h-12 w-full rounded-xl text-sm font-medium"
              >
                {isSendingOtp
                  ? t("sending")
                  : otpSent
                    ? t("resend")
                    : t("sendCode")}
              </Button>
              {otpSent ? (
                <p className="text-muted-foreground text-sm" role="status">
                  {t("codeSent")}
                </p>
              ) : null}
            </div>
          ) : null}

          {method === "backup" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="two-factor-code">{codeLabel}</Label>
              <Input
                id="two-factor-code"
                name="code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="text"
                autoComplete="one-time-code"
                autoFocus
                placeholder={codePlaceholder}
                className={cn(
                  fieldInputClassName,
                  "font-mono tracking-[0.3em]",
                )}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="two-factor-code">{codeLabel}</Label>
              <InputOTP
                id="two-factor-code"
                name="code"
                value={code}
                onChange={setCode}
                maxLength={6}
                autoFocus
                disabled={method === "otp" && !otpSent}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          )}

          <FormStatus error={serverError} />
        </FormContent>

        <Button
          type="submit"
          disabled={!canSubmit}
          className="shadow-primary/20 mt-2 h-12 w-full rounded-xl text-sm font-semibold shadow-lg"
        >
          {isPending ? t("verifying") : t("verify")}
        </Button>

        <p className="text-muted-foreground mt-8 text-center text-sm">
          {t("backToSignIn")}{" "}
          <Link
            href="/login"
            className="text-primary inline-flex min-h-11 items-center font-medium hover:underline"
          >
            {t("signIn")}
          </Link>
        </p>
      </FormRoot>
    </LoginLayout>
  );
};

export default TwoFactorVerifyForm;
