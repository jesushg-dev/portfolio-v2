"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";

import { api } from "@/trpc/react";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";

interface GoogleCalendarConnectFormProps {
  disabled?: boolean;
  embedded?: boolean;
}

const GoogleCalendarConnectForm: FC<GoogleCalendarConnectFormProps> = ({
  disabled = false,
  embedded = false,
}) => {
  const t = useTranslations("admin.googleCalendar");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const initiateConnect = api.googleCalendarAdmin.initiateConnect.useMutation();

  const schema = useMemo(
    () =>
      z.object({
        clientId: z.string().min(10),
        clientSecret: z.string().min(10),
      }),
    [],
  );

  type ConnectInput = z.infer<typeof schema>;

  const form = useForm<ConnectInput>({
    resolver: zodResolver(schema),
    defaultValues: { clientId: "", clientSecret: "" },
  });

  const handleSubmit = useCallback(
    (data: ConnectInput) => {
      startTransition(async () => {
        setServerError(null);
        try {
          const result = await initiateConnect.mutateAsync({
            locale: locale,
            clientId: data.clientId.trim(),
            clientSecret: data.clientSecret.trim(),
          });
          window.location.href = result.authUrl;
        } catch (err) {
          setServerError(
            err instanceof Error ? err.message : t("actions.connectFailed"),
          );
        }
      });
    },
    [initiateConnect, locale, t],
  );

  const formBody = (
    <>
      <div className="mb-4 flex flex-col gap-3">
        <Alert>
          <AlertDescription>{t("connect.byoNote")}</AlertDescription>
        </Alert>
        {!embedded && (
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            {t("connect.dashboardLink")}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
      </div>

      <Form {...form}>
        <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
          <FormContent error={serverError}>
            <FormSection>
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem
                    label={t("connect.clientId")}
                    inputId="gcal-client-id"
                  >
                    <Input
                      {...field}
                      id="gcal-client-id"
                      autoComplete="off"
                      placeholder={t("connect.clientIdPlaceholder")}
                      className="font-mono text-sm"
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientSecret"
                render={({ field }) => (
                  <FormItem
                    label={t("connect.clientSecret")}
                    inputId="gcal-client-secret"
                  >
                    <Input
                      {...field}
                      id="gcal-client-secret"
                      type="password"
                      autoComplete="off"
                      placeholder={t("connect.clientSecretPlaceholder")}
                      className="font-mono text-sm"
                    />
                  </FormItem>
                )}
              />
            </FormSection>
          </FormContent>
          <div className="mt-4">
            <Button type="submit" disabled={disabled || isPending}>
              {isPending ? t("connect.connecting") : t("connect.connect")}
            </Button>
          </div>
        </FormRoot>
      </Form>
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold">{t("connect.title")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("connect.description")}
          </p>
        </div>
        {formBody}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("connect.title")}</CardTitle>
        <CardDescription>{t("connect.description")}</CardDescription>
      </CardHeader>
      <CardContent>{formBody}</CardContent>
    </Card>
  );
};

export default GoogleCalendarConnectForm;
