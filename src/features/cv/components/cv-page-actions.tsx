"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { FaDownload, FaHome } from "react-icons/fa";
import { Loader2, Mail, Send, X } from "lucide-react";
import { TRPCClientError } from "@trpc/client";
import { AnimatePresence, motion } from "motion/react";

import { Link } from "@/i18n/routing";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormItem, FormRoot } from "@/components/shared/form-root";
import { api } from "@/trpc/react";

interface CvPageActionsProps {
  fullName: string;
  canSendByEmail: boolean;
  downloadHref: string | null;
  downloadFileName: string;
  goBackLabel: string;
  downloadLabel: string;
  paginatePdfPages?: boolean;
}

function getTrpcErrorCode(data: unknown): string | null {
  if (typeof data !== "object" || data === null || !("code" in data)) {
    return null;
  }

  const code = data.code;
  return typeof code === "string" ? code : null;
}

function isRateLimitTrpcError(error: unknown): boolean {
  return (
    error instanceof TRPCClientError &&
    getTrpcErrorCode(error.data) === "TOO_MANY_REQUESTS"
  );
}

export const CvPageActions: FC<CvPageActionsProps> = ({
  fullName,
  canSendByEmail,
  downloadHref,
  downloadFileName,
  goBackLabel,
  downloadLabel,
  paginatePdfPages = false,
}) => {
  const locale = useLocale();
  const t = useTranslations("curriculum.pdfDelivery");
  const [emailOpen, setEmailOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sendPdf = api.cvPublic.sendPdfByEmail.useMutation();

  const emailSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, t("form.email.errors.required"))
          .email(t("form.email.errors.pattern")),
      }),
    [t],
  );

  type EmailInput = z.infer<typeof emailSchema>;

  const form = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const handleToggleEmail = useCallback(() => {
    setEmailOpen((open) => !open);
  }, []);

  const handleSubmit = useCallback(
    (values: EmailInput) => {
      startTransition(async () => {
        try {
          await sendPdf.mutateAsync({
            locale,
            email: values.email,
            paginatePages: paginatePdfPages,
          });
          form.reset();
          setEmailOpen(false);
          toast.success(t("form.success"));
        } catch (error) {
          const message = isRateLimitTrpcError(error)
            ? t("form.rateLimited")
            : t("form.error");
          toast.error(message);
        }
      });
    },
    [form, locale, paginatePdfPages, sendPdf, t],
  );

  const isSending = isPending || sendPdf.isPending;

  return (
    <div className="md:max-w-letter mx-4 flex flex-col gap-3 md:mx-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/"
          className="pressable border-primary-800 text-primary-800 hover:bg-primary-900 inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg hover:text-white"
        >
          {goBackLabel} <FaHome className="size-4" aria-hidden />
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {downloadHref ? (
            <a
              href={downloadHref}
              download={downloadFileName}
              className="pressable bg-primary-800 hover:bg-primary-900 inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg"
            >
              {downloadLabel} <FaDownload className="size-4" aria-hidden />
            </a>
          ) : null}

          {canSendByEmail ? (
            <Button
              type="button"
              variant={emailOpen ? "secondary" : "outline"}
              className="pressable h-auto min-h-11 gap-2 rounded-lg px-4 py-3 text-sm shadow-lg"
              onClick={handleToggleEmail}
              aria-expanded={emailOpen}
              aria-controls="cv-email-panel"
            >
              {emailOpen ? (
                <X className="size-4" aria-hidden />
              ) : (
                <Mail className="size-4" aria-hidden />
              )}
              {emailOpen ? t("toggleClose") : t("toggleSend")}
            </Button>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {emailOpen && canSendByEmail ? (
          <motion.div
            key="cv-email-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.22, ease: "easeOut", delay: 0.04 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.18, ease: "easeIn" },
              },
            }}
            className="-m-1 overflow-hidden p-1"
          >
            <section
              id="cv-email-panel"
              className="bg-card text-card-foreground border-border rounded-lg border p-5 shadow-sm"
            >
              <div className="mb-4">
                <h2 className="text-foreground text-base font-semibold">
                  {t("title")}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("description")}
                </p>
              </div>

              <Form {...form}>
                <FormRoot
                  className="flex flex-col gap-3 overflow-visible p-0.5 sm:flex-row sm:items-end"
                  onSubmit={form.handleSubmit(handleSubmit)}
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem
                        label={t("form.email.label")}
                        inputId="cv-pdf-email"
                        className="flex-1"
                      >
                        <Input
                          {...field}
                          id="cv-pdf-email"
                          type="email"
                          name="email"
                          autoComplete="email"
                          inputMode="email"
                          autoCapitalize="none"
                          spellCheck={false}
                          autoFocus
                          disabled={isSending}
                          placeholder={t("form.email.placeholder")}
                        />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSending}
                    className="sm:mb-0.5"
                    aria-busy={isSending}
                  >
                    {isSending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Send className="size-4" aria-hidden />
                    )}
                    {isSending ? t("form.sending") : t("form.submit")}
                  </Button>
                </FormRoot>
              </Form>

              <p className="text-muted-foreground mt-3 text-xs">
                {t("footnote", { fullName })}
              </p>
            </section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default CvPageActions;
