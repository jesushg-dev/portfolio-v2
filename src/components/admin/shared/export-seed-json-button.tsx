"use client";

import { useState, type FC } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { SeedExportEntity } from "@/lib/seed-export/entities";
import { api } from "@/trpc/react";

export type SeedExportTarget = SeedExportEntity | "all";

interface ExportSeedJsonButtonProps {
  entity: SeedExportTarget;
}

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadJsonFile(fileName: string, json: string) {
  downloadBlob(
    fileName,
    new Blob([json], { type: "application/json;charset=utf-8" }),
  );
}

function downloadZipFromBase64(fileName: string, base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  downloadBlob(fileName, new Blob([bytes], { type: "application/zip" }));
}

export const ExportSeedJsonButton: FC<ExportSeedJsonButtonProps> = ({
  entity,
}) => {
  const t = useTranslations("admin.common");
  const utils = api.useUtils();
  const [isExporting, setIsExporting] = useState(false);
  const isZip = entity === "all";

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (isZip) {
        const result = await utils.portfolioSeedExport.allZip.fetch();
        downloadZipFromBase64(result.fileName, result.base64);
      } else {
        const result = await utils.portfolioSeedExport[entity].fetch();
        downloadJsonFile(result.fileName, result.json);
      }
    } catch {
      toast.error(t(isZip ? "exportSeedZipError" : "exportSeedJsonError"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      id={`${entity}-export-seed`}
      disabled={isExporting}
      title={t(isZip ? "exportSeedZipHint" : "exportSeedJsonHint")}
      onClick={() => {
        void handleExport();
      }}
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {t("exportSeedJson")}
    </Button>
  );
};
