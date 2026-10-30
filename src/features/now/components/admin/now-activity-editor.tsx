"use client";
import { isAbsoluteOrLocalImagePath } from "@/utils/tools/image";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { BookOpen, Film, ImageIcon, Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormControl, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormItem } from "@/components/shared/form-root";
import { MediaImage } from "@/components/shared/media-image";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { NowSettingsFormValues } from "../../lib/now-settings-schema";
import { NowNumberField, NowTextField } from "./now-settings-fields";
import { NowCoverField } from "./now-cover-field";
export function NowActivityEditor() {
  const t = useTranslations("admin.forms.nowSettings");
  const { control, setValue } = useFormContext<NowSettingsFormValues>();
  const progress = useWatch({ control, name: "readingProgress" });
  const rating = useWatch({ control, name: "watchedRating" });
  const photos = useWatch({ control, name: "photoUrls" });
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="border-border bg-muted/20 space-y-4 rounded-xl border p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary rounded-xl p-3">
              <BookOpen aria-hidden className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">{t("sectionReading")}</h2>
              <p className="text-muted-foreground text-xs">
                {t("readingCardHint")}
              </p>
            </div>
          </div>
          <NowCoverField name="readingCoverUrl" label={t("readingCover")} />
          <NowTextField name="readingTitle" label={t("readingTitle")} />
          <NowTextField name="readingAuthors" label={t("readingAuthors")} />
          <NowNumberField
            name="readingProgress"
            label={t("readingProgress")}
            max={100}
          />
          <Progress
            value={Math.max(
              0,
              Math.min(100, Number.isFinite(progress) ? progress : 0),
            )}
          />
        </section>
        <section className="border-border bg-muted/20 space-y-4 rounded-xl border p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary rounded-xl p-3">
              <Film aria-hidden className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">{t("sectionWatched")}</h2>
              <p className="text-muted-foreground text-xs">
                {t("watchedCardHint")}
              </p>
            </div>
          </div>
          <NowCoverField name="watchedCoverUrl" label={t("watchedCover")} />
          <NowTextField name="watchedTitle" label={t("watchedTitle")} />
          <NowNumberField
            name="watchedRating"
            label={t("watchedRating")}
            max={5}
          />
          <div className="flex gap-1" aria-hidden>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "size-5",
                  star <= rating
                    ? "fill-warning text-warning"
                    : "text-muted-foreground/30",
                )}
              />
            ))}
          </div>
        </section>
      </div>
      <section className="border-border bg-muted/20 space-y-4 rounded-xl border p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <ImageIcon aria-hidden className="text-primary size-5" />
            {t("sectionPhotos")}
          </h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={photos.length >= 6}
            onClick={() =>
              setValue("photoUrls", [...photos, ""], { shouldDirty: true })
            }
          >
            <Plus aria-hidden />
            {t("addPhoto")}
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((url, index) => (
            <div
              key={index}
              className="border-border bg-card overflow-hidden rounded-xl border"
            >
              <div className="bg-muted relative flex aspect-video items-center justify-center">
                {url && isAbsoluteOrLocalImagePath(url) ? (
                  <MediaImage
                    src={url}
                    alt={t("photoNumber", { number: index + 1 })}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
                  />
                ) : (
                  <ImageIcon
                    aria-hidden
                    className="text-muted-foreground size-8"
                  />
                )}
              </div>
              <div className="flex items-end gap-2 p-3">
                <FormField
                  control={control}
                  name={`photoUrls.${index}`}
                  render={({ field }) => (
                    <FormItem
                      label={t("photoNumber", { number: index + 1 })}
                      className="min-w-0 flex-1"
                    >
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="https://"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t("removePhoto")}
                  onClick={() =>
                    setValue(
                      "photoUrls",
                      photos.filter((_, item) => item !== index),
                      { shouldDirty: true },
                    )
                  }
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {!photos.length ? (
          <p className="text-muted-foreground text-sm">{t("noPhotos")}</p>
        ) : null}
      </section>
    </div>
  );
}
