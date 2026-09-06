"use client";

import { useCallback, useState, useTransition, type FC } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertTriangle, CalendarDays } from "lucide-react";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ConnectionStatus = "connected" | "refresh_error";

interface GoogleCalendarConnectionStatusProps {
  status: ConnectionStatus;
  clientId: string | null;
  connectedAt: Date | null;
  embedded?: boolean;
}

const GoogleCalendarConnectionStatus: FC<
  GoogleCalendarConnectionStatusProps
> = ({ status, clientId, connectedAt, embedded = false }) => {
  const t = useTranslations("admin.googleCalendar");
  const utils = api.useUtils();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const disconnect = api.googleCalendarAdmin.disconnect.useMutation();

  const statusLabel =
    status === "refresh_error"
      ? t("status.refreshError")
      : t("status.connected");

  const handleDisconnect = useCallback(() => {
    startTransition(async () => {
      setActionError(null);
      try {
        await disconnect.mutateAsync();
        await utils.googleCalendarAdmin.getConnectionStatus.invalidate();
      } catch {
        setActionError(t("actions.disconnectFailed"));
      }
    });
  }, [disconnect, utils, t]);

  const body = (
    <>
      {clientId ? (
        <p className="text-muted-foreground text-sm">
          {t("status.clientId", { id: clientId })}
        </p>
      ) : null}

      {!embedded && (
        <Alert>
          <AlertDescription>{t("disconnectPolicy")}</AlertDescription>
        </Alert>
      )}

      {connectedAt ? (
        <p className="text-muted-foreground text-xs">
          {t("status.connectedAt", {
            date: new Date(connectedAt).toLocaleString(),
          })}
        </p>
      ) : null}

      {actionError ? (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleDisconnect}
        >
          {isPending ? t("status.disconnecting") : t("status.disconnect")}
        </Button>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {status === "refresh_error" ? (
            <AlertTriangle className="text-destructive mt-0.5 size-5 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          )}
          <div>
            <p className="text-sm font-semibold">{statusLabel}</p>
          </div>
        </div>
        {body}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
            <CalendarDays className="size-5" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-base">{statusLabel}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{body}</CardContent>
    </Card>
  );
};

export default GoogleCalendarConnectionStatus;
