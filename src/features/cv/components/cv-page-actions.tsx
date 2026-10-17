"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { FC, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, Home, Loader2, Mail, Send, X } from "lucide-react";
import { TRPCClientError } from "@trpc/client";
import { AnimatePresence, motion } from "motion/react";

import { Link, useRouter } from "@/i18n/routing";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormItem, FormRoot } from "@/components/shared/form-root";
import { api } from "@/trpc/react";
import type { Locale } from "@/i18n/config";

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
  const router = useRouter();
  const tPdf = useTranslations("curriculum.pdfDelivery");
  const [emailOpen, setEmailOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sendPdf = api.cvPublic.sendPdfByEmail.useMutation();

  const emailSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, tPdf("form.email.errors.required"))
          .email(tPdf("form.email.errors.pattern")),
      }),
    [tPdf],
  );

  type EmailInput = z.infer<typeof emailSchema>;

  const form = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadClick = useCallback(() => {
    setIsDownloading(true);
    const timer = setTimeout(() => {
      setIsDownloading(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleEmail = useCallback(() => {
    setEmailOpen((open) => !open);
  }, []);

  const handleLocaleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const targetLocale = e.target.value as Locale;
      router.replace("/curriculum-vitae", { locale: targetLocale });
    },
    [router],
  );

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
          toast.success(tPdf("form.success"));
        } catch (error) {
          const message = isRateLimitTrpcError(error)
            ? tPdf("form.rateLimited")
            : tPdf("form.error");
          toast.error(message);
        }
      });
    },
    [form, locale, paginatePdfPages, sendPdf, tPdf],
  );

  const isSending = isPending || sendPdf.isPending;

  return (
    <div className="mx-auto flex w-full max-w-[51rem] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-blue-800 bg-white px-5 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-50"
        >
          <Home className="size-4 shrink-0" aria-hidden="true" />
          <span>{goBackLabel}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="cv-locale-select">
            <span className="sr-only">Language</span>
            <select
              id="cv-locale-select"
              value={locale}
              onChange={handleLocaleChange}
              className="min-h-11 cursor-pointer rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-800"
            >
              <option value="nl">Nederlands</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </label>

          {downloadHref ? (
            <a
              id="dl"
              href={downloadHref}
              target="_blank"
              rel="noopener noreferrer"
              download={downloadFileName}
              onClick={handleDownloadClick}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-800/20 transition hover:-translate-y-0.5 hover:bg-blue-900"
              aria-busy={isDownloading}
            >
              <span>{isDownloading ? tPdf("generating") : downloadLabel}</span>
              {isDownloading ? (
                <Loader2
                  className="size-4 shrink-0 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Download className="size-4 shrink-0" aria-hidden="true" />
              )}
            </a>
          ) : null}

          {canSendByEmail ? (
            <button
              id="mail"
              type="button"
              onClick={handleToggleEmail}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-800 hover:text-blue-800"
              aria-expanded={emailOpen}
              aria-controls="cv-email-panel"
            >
              {emailOpen ? (
                <X className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <Mail className="size-4 shrink-0" aria-hidden="true" />
              )}
              <span>
                {emailOpen ? tPdf("toggleClose") : tPdf("toggleSend")}
              </span>
            </button>
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
              className="bg-card text-card-foreground border-border rounded-2xl border p-5 shadow-sm"
            >
              <div className="mb-4">
                <h2 className="text-foreground text-base font-semibold">
                  {tPdf("title")}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {tPdf("description")}
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
                        label={tPdf("form.email.label")}
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
                          placeholder={tPdf("form.email.placeholder")}
                        />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSending}
                    className="rounded-full sm:mb-0.5"
                    aria-busy={isSending}
                  >
                    {isSending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Send className="size-4" aria-hidden />
                    )}
                    {isSending ? tPdf("form.sending") : tPdf("form.submit")}
                  </Button>
                </FormRoot>
              </Form>

              <p className="text-muted-foreground mt-3 text-xs">
                {tPdf("footnote", { fullName })}
              </p>
            </section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default CvPageActions;
