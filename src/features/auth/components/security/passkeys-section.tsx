"use client";

import { useCallback, useState } from "react";
import type { FC, FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Fingerprint, Pencil, Trash2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormStatus from "@/components/admin/shared/form-status";

interface PasskeyItem {
  id: string;
  name?: string | undefined;
  backedUp: boolean;
  createdAt: Date | string;
}

interface PasskeysSectionProps {
  onChanged?: () => void;
}

function formatDate(value: Date | string, locale: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

function displayName(item: PasskeyItem, fallback: string): string {
  const trimmed = item.name?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : fallback;
}

const PasskeysSection: FC<PasskeysSectionProps> = ({ onChanged }) => {
  const t = useTranslations("admin.settings.security.passkeys");
  const locale = useLocale();
  // Re-fetches automatically after add / rename / delete (plugin atom listeners).
  const {
    data: passkeyList,
    error: listError,
    isPending: isLoading,
    refetch,
  } = authClient.useListPasskeys();
  const passkeys: PasskeyItem[] | null = isLoading ? null : (passkeyList ?? []);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const add = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setBusy(true);
      setError(null);
      setSuccess(null);
      const { error: addError } = await authClient.passkey.addPasskey({
        name: newName.trim() || undefined,
      });
      setBusy(false);
      if (addError) {
        setError(addError.message ?? t("errorAdd"));
        return;
      }
      setNewName("");
      setSuccess(t("added"));
      await load();
      onChanged?.();
    },
    [load, newName, onChanged, t],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!window.confirm(t("confirmDelete"))) return;
      setBusy(true);
      setError(null);
      setSuccess(null);
      const { error: deleteError } = await authClient.passkey.deletePasskey({
        id,
      });
      setBusy(false);
      if (deleteError) {
        setError(deleteError.message ?? t("errorDelete"));
        return;
      }
      setSuccess(t("deleted"));
      await load();
      onChanged?.();
    },
    [load, onChanged, t],
  );

  const rename = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!renamingId || !renameValue.trim()) return;
      setBusy(true);
      setError(null);
      const { error: updateError } = await authClient.passkey.updatePasskey({
        id: renamingId,
        name: renameValue.trim(),
      });
      setBusy(false);
      if (updateError) {
        setError(updateError.message ?? t("errorRename"));
        return;
      }
      setRenamingId(null);
      setRenameValue("");
      await load();
    },
    [load, renameValue, renamingId, t],
  );

  return (
    <section
      aria-labelledby="security-passkeys-title"
      className="flex flex-col gap-4"
    >
      <div>
        <h3
          id="security-passkeys-title"
          className="text-foreground text-sm font-semibold"
        >
          {t("title")}
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
      </div>

      {passkeys === null ? (
        <p className="text-muted-foreground text-sm" role="status">
          {t("loading")}
        </p>
      ) : passkeys.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : (
        <ul className="divide-border flex flex-col divide-y rounded-lg border">
          {passkeys.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              {renamingId === item.id ? (
                <form
                  onSubmit={(event) => void rename(event)}
                  className="flex flex-1 flex-wrap items-end gap-2"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Label htmlFor={`passkey-rename-${item.id}`}>
                      {t("nameLabel")}
                    </Label>
                    <Input
                      id={`passkey-rename-${item.id}`}
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      maxLength={60}
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={busy || !renameValue.trim()}
                  >
                    {t("save")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setRenamingId(null)}
                  >
                    {t("cancel")}
                  </Button>
                </form>
              ) : (
                <>
                  <div className="flex min-w-0 items-center gap-3">
                    <Fingerprint
                      className="text-muted-foreground size-5 shrink-0"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-sm font-medium">
                        {displayName(item, t("unnamed"))}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {t("meta", {
                          date: formatDate(item.createdAt, locale),
                          kind: item.backedUp
                            ? t("kindSynced")
                            : t("kindDevice"),
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={t("rename", {
                        name: displayName(item, t("unnamed")),
                      })}
                      disabled={busy}
                      onClick={() => {
                        setRenamingId(item.id);
                        setRenameValue(item.name ?? "");
                      }}
                    >
                      <Pencil aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      aria-label={t("delete", {
                        name: displayName(item, t("unnamed")),
                      })}
                      disabled={busy}
                      onClick={() => void remove(item.id)}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(event) => void add(event)}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="security-passkey-name">{t("nameLabel")}</Label>
          <Input
            id="security-passkey-name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder={t("namePlaceholder")}
            maxLength={60}
            autoComplete="off"
          />
        </div>
        <Button type="submit" size="sm" disabled={busy} className="sm:h-9">
          <Fingerprint aria-hidden />
          {busy ? t("working") : t("add")}
        </Button>
      </form>

      <FormStatus
        error={error ?? (listError ? t("errorLoad") : null)}
        success={!!success}
        successMessage={success ?? ""}
      />
    </section>
  );
};

export default PasskeysSection;
