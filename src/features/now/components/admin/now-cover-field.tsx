"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ImageIcon, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { fileToBase64 } from "@/lib/uploadthing/file-to-base64";
import { FormField, FormControl } from "@/components/ui/form";
import { FormItem } from "@/components/shared/form-root";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/shared/media-image";
import { UploadThingRequiredNotice } from "@/features/integrations/components/uploadthing-required-notice";
import { isAbsoluteOrLocalImagePath } from "@/utils/tools/image";
import type { NowSettingsFormValues } from "../../lib/now-settings-schema";

interface Props {
  name: "readingCoverUrl" | "watchedCoverUrl";
  label: string;
}
const coverTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export function NowCoverField({ name, label }: Props) {
  const t = useTranslations("admin.forms.nowSettings");
  const { control, setValue } = useFormContext<NowSettingsFormValues>();
  const { data: integrations } = api.integrationsAdmin.getConfigs.useQuery();
  const upload = api.integrationsAdmin.uploadFile.useMutation();
  const [uploading, setUploading] = useState(false);
  const configured = integrations?.uploadthing.isConfigured ?? false;

  const uploadCover = async (file: File): Promise<void> => {
    if (!coverTypes.has(file.type) || file.size > 4 * 1024 * 1024) {
      toast.error(t("invalidCover"));
      return;
    }
    setUploading(true);
    try {
      const result = await upload.mutateAsync({
        fileName: file.name,
        mimeType: file.type,
        dataBase64: await fileToBase64(file),
      });
      setValue(name, result.url, { shouldDirty: true, shouldValidate: true });
      toast.success(t("coverUploaded"));
    } catch {
      toast.error(t("coverUploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem label={label} description={t("coverHint")}>
          <div className="flex items-start gap-4">
            <div className="bg-muted relative flex aspect-[2/3] w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg">
              {field.value && isAbsoluteOrLocalImagePath(field.value) ? (
                <MediaImage
                  src={field.value}
                  alt={label}
                  fill
                  sizes="5rem"
                  className="object-cover"
                />
              ) : (
                <ImageIcon
                  aria-hidden
                  className="text-muted-foreground size-7"
                />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="https://"
                  disabled={uploading}
                />
              </FormControl>
              {configured ? (
                <div className="space-y-2">
                  <Input
                    type="file"
                    aria-label={t("uploadCover", { label })}
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={uploading}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (file) void uploadCover(file);
                    }}
                  />
                  {uploading ? (
                    <LoaderCircle
                      aria-label={t("uploadingCover")}
                      className="text-primary size-4 animate-spin"
                    />
                  ) : null}
                </div>
              ) : integrations ? (
                <UploadThingRequiredNotice />
              ) : null}
              {field.value ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={uploading}
                  onClick={() => field.onChange("")}
                >
                  <X aria-hidden />
                  {t("removeCover")}
                </Button>
              ) : null}
            </div>
          </div>
        </FormItem>
      )}
    />
  );
}
