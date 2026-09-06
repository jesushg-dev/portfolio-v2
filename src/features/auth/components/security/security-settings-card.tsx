"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";

import { useRouter } from "@/i18n/routing";
import { Separator } from "@/components/ui/separator";
import TwoFactorSection from "./two-factor-section";
import PasskeysSection from "./passkeys-section";

interface SecuritySettingsCardProps {
  twoFactorEnabled: boolean;
  hasPassword: boolean;
}

/**
 * Admin → Settings → Security: opt-in two-factor authentication (TOTP + email
 * OTP + backup codes) and passkey management for the signed-in user.
 */
const SecuritySettingsCard: FC<SecuritySettingsCardProps> = ({
  twoFactorEnabled,
  hasPassword,
}) => {
  const t = useTranslations("admin.settings.security");
  const router = useRouter();

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
          <ShieldCheck className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-foreground text-base font-semibold">
            {t("title")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("description")}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <TwoFactorSection
          enabled={twoFactorEnabled}
          hasPassword={hasPassword}
          onChanged={() => router.refresh()}
        />
        <Separator />
        <PasskeysSection />
      </div>
    </div>
  );
};

export default SecuritySettingsCard;
