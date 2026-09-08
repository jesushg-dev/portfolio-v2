import { ArrowRight, KeyRound, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function SettingsIntegrationsCard() {
  const t = await getTranslations("admin.settings");

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <KeyRound className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">
                  {t("credentialsTitle")}
                </CardTitle>
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Sparkles className="text-primary size-3" aria-hidden />
                  API
                </Badge>
              </div>
              <CardDescription className="mt-1">
                {t("credentialsDescription")}
              </CardDescription>
            </div>
          </div>
          <Link
            href="/admin/credentials"
            className={buttonVariants({
              variant: "default",
              size: "sm",
              className: "shrink-0 gap-1.5",
            })}
          >
            <span>{t("credentialsCta")}</span>
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">Spotify Web API</Badge>
          <Badge variant="outline">Resend Email</Badge>
          <Badge variant="outline">Cloudinary Storage</Badge>
          <Badge variant="outline">OpenAI / Gemini AI</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
