"use client";

import { useCallback, useState } from "react";
import type { FC, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldOff } from "lucide-react";
import QRCode from "react-qr-code";

import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormStatus from "@/components/admin/shared/form-status";
import BackupCodesList from "./backup-codes-list";

interface TwoFactorSectionProps {
  enabled: boolean;
  /** Social-only accounts have no password, which Better Auth requires to (dis)able 2FA. */
  hasPassword: boolean;
  onChanged?: () => void;
}

type Step =
  | { kind: "idle" }
  | { kind: "password"; intent: "enable" | "disable" | "backup" }
  | { kind: "verify"; totpURI: string; backupCodes: string[] }
  | { kind: "backup"; backupCodes: string[] };

function extractTotpSecret(totpURI: string): string | null {
  try {
    return new URL(totpURI).searchParams.get("secret");
  } catch {
    return null;
  }
}

const TwoFactorSection: FC<TwoFactorSectionProps> = ({
  enabled,
  hasPassword,
  onChanged,
}) => {
  const t = useTranslations("admin.settings.security.twoFactor");
  const [step, setStep] = useState<Step>({ kind: "idle" });
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = useCallback(() => {
    setStep({ kind: "idle" });
    setPassword("");
    setCode("");
    setError(null);
  }, []);

  const start = useCallback((intent: "enable" | "disable" | "backup") => {
    setSuccess(null);
    setError(null);
    setStep({ kind: "password", intent });
  }, []);

  const submitPassword = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (step.kind !== "password" || !password) return;
      setBusy(true);
      setError(null);

      if (step.intent === "enable") {
        const { data, error: enableError } = await authClient.twoFactor.enable({
          password,
        });
        setBusy(false);
        // `method: "otp"` only happens when TOTP is disabled server-side, which it is not.
        if (enableError || data?.method !== "totp") {
          setError(enableError?.message ?? t("errorGeneric"));
          return;
        }
        setPassword("");
        setStep({
          kind: "verify",
          totpURI: data.totpURI,
          backupCodes: data.backupCodes,
        });
        return;
      }

      if (step.intent === "disable") {
        const { error: disableError } = await authClient.twoFactor.disable({
          password,
        });
        setBusy(false);
        if (disableError) {
          setError(disableError.message ?? t("errorGeneric"));
          return;
        }
        reset();
        setSuccess(t("disabled"));
        onChanged?.();
        return;
      }

      const { data, error: backupError } =
        await authClient.twoFactor.generateBackupCodes({ password });
      setBusy(false);
      if (backupError || !data) {
        setError(backupError?.message ?? t("errorGeneric"));
        return;
      }
      setPassword("");
      setStep({ kind: "backup", backupCodes: data.backupCodes });
    },
    [onChanged, password, reset, step, t],
  );

  const submitVerification = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (step.kind !== "verify" || !code) return;
      setBusy(true);
      setError(null);
      const { error: verifyError } = await authClient.twoFactor.verifyTotp({
        code: code.replace(/\s+/g, ""),
      });
      setBusy(false);
      if (verifyError) {
        setError(verifyError.message ?? t("errorCode"));
        return;
      }
      setCode("");
      setStep({ kind: "backup", backupCodes: step.backupCodes });
      setSuccess(t("enabled"));
      onChanged?.();
    },
    [code, onChanged, step, t],
  );

  return (
    <section
      aria-labelledby="security-two-factor-title"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              id="security-two-factor-title"
              className="text-foreground text-sm font-semibold"
            >
              {t("title")}
            </h3>
            <Badge variant={enabled ? "default" : "secondary"}>
              {enabled ? (
                <ShieldCheck aria-hidden />
              ) : (
                <ShieldOff aria-hidden />
              )}
              {enabled ? t("statusOn") : t("statusOff")}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("description")}
          </p>
        </div>

        {step.kind === "idle" ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {enabled ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasPassword}
                  onClick={() => start("backup")}
                >
                  {t("regenerateBackup")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={!hasPassword}
                  onClick={() => start("disable")}
                >
                  {t("disable")}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={!hasPassword}
                onClick={() => start("enable")}
              >
                {t("enable")}
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {!hasPassword ? (
        <p className="text-muted-foreground text-sm">{t("needsPassword")}</p>
      ) : null}

      {step.kind === "password" ? (
        <form
          onSubmit={(event) => void submitPassword(event)}
          className="bg-muted/40 flex flex-col gap-3 rounded-lg p-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="security-two-factor-password">
              {t("confirmPassword")}
            </Label>
            <Input
              id="security-two-factor-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
            />
            <p className="text-muted-foreground text-xs">
              {t(`confirmPasswordHint.${step.intent}`)}
            </p>
          </div>
          <FormStatus error={error} />
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              size="sm"
              variant={step.intent === "disable" ? "destructive" : "default"}
              disabled={busy || !password}
            >
              {busy ? t("working") : t(`confirm.${step.intent}`)}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      ) : null}

      {step.kind === "verify" ? (
        <form
          onSubmit={(event) => void submitVerification(event)}
          className="bg-muted/40 flex flex-col gap-4 rounded-lg p-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="rounded-lg bg-white p-3 shadow-sm sm:shrink-0">
              <QRCode
                value={step.totpURI}
                size={160}
                aria-label={t("qrLabel")}
                role="img"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <p className="text-sm">{t("scanHint")}</p>
              {extractTotpSecret(step.totpURI) ? (
                <p className="text-muted-foreground text-xs">
                  {t("manualKey")}{" "}
                  <code
                    data-testid="totp-secret"
                    className="bg-background rounded px-1.5 py-0.5 font-mono text-xs break-all select-all"
                  >
                    {extractTotpSecret(step.totpURI)}
                  </code>
                </p>
              ) : null}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="security-two-factor-code">
                  {t("codeLabel")}
                </Label>
                <Input
                  id="security-two-factor-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="max-w-48 font-mono tracking-[0.3em]"
                />
              </div>
            </div>
          </div>
          <FormStatus error={error} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={busy || !code}>
              {busy ? t("working") : t("verifyAndEnable")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      ) : null}

      {step.kind === "backup" ? (
        <div className="bg-muted/40 flex flex-col gap-3 rounded-lg p-4">
          <BackupCodesList codes={step.backupCodes} />
          <div>
            <Button type="button" size="sm" onClick={reset}>
              {t("savedCodes")}
            </Button>
          </div>
        </div>
      ) : null}

      {step.kind === "idle" ? (
        <FormStatus
          error={error}
          success={!!success}
          successMessage={success ?? ""}
        />
      ) : null}
    </section>
  );
};

export default TwoFactorSection;
