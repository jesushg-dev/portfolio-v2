"use client";

import { useCallback, useState, useTransition } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { api } from "@/trpc/react";
import { locales, localsDisplay } from "@/i18n/config";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
  FormSection,
} from "@/components/shared/form-root";
import FormStatus from "@/components/admin/shared/form-status";

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
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg-card scroll-mt-24 rounded-xl p-6 shadow-sm"
      >
        <FormContent>
          <FormSection
            title={t("pdfSectionTitle")}
            description={t("pdfSectionDescription")}
          >
            {locales.map((locale) => (
              <FormField
                key={locale}
                control={form.control}
                name={`links.${locale}`}
                render={({ field }) => (
                  <FormItem label={localsDisplay[locale]}>
                    <Input
                      type="url"
                      placeholder={t("pdfLinkPlaceholder", { locale })}
                      {...field}
                    />
                  </FormItem>
                )}
              />
            ))}
          </FormSection>

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
