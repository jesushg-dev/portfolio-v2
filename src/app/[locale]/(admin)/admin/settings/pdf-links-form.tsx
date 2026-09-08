"use client";

import { useCallback, useState, useTransition } from "react";
import type { FC } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ExternalLink, FileText, Link2 } from "lucide-react";

import { api } from "@/trpc/react";
import { locales, localsDisplay } from "@/i18n/config";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
} from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PdfLinksSchema = z.object({
  links: z.record(z.string(), z.string()),
});

type PdfLinksInput = z.infer<typeof PdfLinksSchema>;

interface PdfLinksFormProps {
  initialLinks: Record<string, string>;
}

const PdfLinksForm: FC<PdfLinksFormProps> = ({ initialLinks }) => {
  const t = useTranslations("admin.settings");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const upsertPdfLink = api.cv.upsertPdfLink.useMutation();
  const deletePdfLink = api.cv.deletePdfLink.useMutation();
  const utils = api.useUtils();

  const defaultLinks = locales.reduce(
    (acc, locale) => {
      acc[locale] = initialLinks[locale] || "";
      return acc;
    },
    {} as Record<string, string>,
  );

  const form = useForm<PdfLinksInput>({
    resolver: zodResolver(PdfLinksSchema),
    defaultValues: { links: defaultLinks },
  });

  const watchedLinks = useWatch({
    control: form.control,
    name: "links",
  });

  const onSubmit = useCallback(
    (data: PdfLinksInput) => {
      startTransition(async () => {
        setSuccess(false);
        try {
          for (const locale of locales) {
            const url = data.links[locale];
            if (url && url.trim() !== "") {
              await upsertPdfLink.mutateAsync({
                locale,
                url: url.trim(),
              });
            } else if (initialLinks[locale] && (!url || url.trim() === "")) {
              await deletePdfLink.mutateAsync({ locale });
            }
          }
          await utils.cv.getPdfLinks.invalidate();
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
          console.error(err);
        }
      });
    },
    [deletePdfLink, initialLinks, upsertPdfLink, utils],
  );

  return (
    <Form {...form}>
      <FormRoot
        onSubmit={(e) => {
          void form.handleSubmit(onSubmit)(e);
        }}
        className="flex flex-col gap-6"
      >
        <FormContent className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                  <FileText className="size-4" aria-hidden />
                </div>
                <div>
                  <CardTitle>{t("pdfSectionTitle")}</CardTitle>
                  <CardDescription>
                    {t("pdfSectionDescription")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {locales.map((locale) => {
                const urlValue = watchedLinks?.[locale]?.trim();
                const isValidUrl =
                  Boolean(urlValue) &&
                  (urlValue?.startsWith("http://") ||
                    urlValue?.startsWith("https://"));

                return (
                  <div
                    key={locale}
                    className="border-border bg-card/50 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end"
                  >
                    <div className="min-w-0 flex-1">
                      <FormField
                        control={form.control}
                        name={`links.${locale}`}
                        render={({ field }) => (
                          <FormItem
                            label={
                              <span className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {locale.toUpperCase()}
                                </Badge>
                                <span>{localsDisplay[locale]}</span>
                              </span>
                            }
                            inputId={`settings-pdf-${locale}`}
                          >
                            <div className="relative">
                              <Link2
                                className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                                aria-hidden
                              />
                              <Input
                                type="url"
                                className="pl-9"
                                placeholder={t("pdfLinkPlaceholder", {
                                  locale,
                                })}
                                {...field}
                              />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    {isValidUrl && (
                      <a
                        href={urlValue}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className: "h-10 shrink-0 gap-1.5 text-xs",
                        })}
                      >
                        <span>{t("testLink")}</span>
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <FormStatus success={success} successMessage={t("saved")} />
        </FormContent>

        <FormActions
          isPending={form.formState.isSubmitting || isPending}
          title={t("save")}
        />
      </FormRoot>
    </Form>
  );
};

export default PdfLinksForm;
