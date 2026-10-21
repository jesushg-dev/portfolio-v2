"use client";

import { useCallback, useState } from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Download } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BackupCodesListProps {
  codes: string[];
}

const BackupCodesList: FC<BackupCodesListProps> = ({ codes }) => {
  const t = useTranslations("admin.settings.security.backupCodes");
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [codes]);

  const download = useCallback(() => {
    const blob = new Blob([`${codes.join("\n")}\n`], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "backup-codes.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }, [codes]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h4 className="text-foreground text-sm font-semibold">{t("title")}</h4>
        <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
      </div>
      <ul
        aria-label={t("title")}
        className="grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-5"
      >
        {codes.map((backupCode) => (
          <li
            key={backupCode}
            data-testid="backup-code"
            className="bg-background rounded-md border px-2 py-1.5 text-center tracking-wider select-all"
          >
            {backupCode}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void copy()}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? t("copied") : t("copy")}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={download}>
          <Download aria-hidden />
          {t("download")}
        </Button>
      </div>
    </div>
  );
};

export default BackupCodesList;
