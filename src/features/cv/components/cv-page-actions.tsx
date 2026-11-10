"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, Home, Loader2, Mail, Send, X } from "lucide-react";
import { TRPCClientError } from "@trpc/client";
import { AnimatePresence, motion } from "motion/react";

import { Link } from "@/i18n/routing";
import { Form, FormField } from "@/components/ui/form";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

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
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "min-h-11 gap-2 rounded-full",
          )}
        >
          <Home className="size-4 shrink-0" aria-hidden="true" />
          <span>{goBackLabel}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {downloadHref ? (
            <a
              id="dl"
              href={downloadHref}
              target="_blank"
              rel="noopener noreferrer"
              download={downloadFileName}
              onClick={handleDownloadClick}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "min-h-11 gap-2 rounded-full shadow-sm hover:-translate-y-0.5",
              )}
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
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-11 gap-2 rounded-full",
              )}
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
              className="border-border/80 bg-foreground/[0.04] rounded-3xl border p-6 shadow-sm sm:p-8"
            >
              <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_1.15fr] md:gap-8">
                <div>
                  <h2 className="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
                    {tPdf("title")}
                  </h2>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    {tPdf("description")}
                  </p>
                </div>

                <div>
                  <Form {...form}>
                    <form
                      onSubmit={(e) => void form.handleSubmit(handleSubmit)(e)}
                      className="flex flex-col gap-2"
                    >
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <div className="bg-background border-border/80 focus-within:border-primary focus-within:ring-primary/20 relative flex items-center rounded-full border p-1 pl-4 shadow-inner transition-all focus-within:ring-2">
                            <input
                              {...field}
                              id="cv-pdf-email"
                              type="email"
                              autoComplete="email"
                              inputMode="email"
                              autoCapitalize="none"
                              spellCheck={false}
                              autoFocus
                              disabled={isSending}
                              placeholder={tPdf("form.email.placeholder")}
                              className="text-foreground placeholder:text-muted-foreground w-full border-none bg-transparent text-sm outline-hidden focus:ring-0 focus:outline-hidden"
                            />
                            <Button
                              type="submit"
                              disabled={isSending}
                              size="sm"
                              className="min-h-9 shrink-0 gap-1.5 rounded-full px-5"
                              aria-busy={isSending}
                            >
                              {isSending ? (
                                <Loader2
                                  className="size-3.5 animate-spin"
                                  aria-hidden
                                />
                              ) : (
                                <Send className="size-3.5" aria-hidden />
                              )}
                              <span>
                                {isSending
                                  ? tPdf("form.sending")
                                  : tPdf("form.submit")}
                              </span>
                            </Button>
                          </div>
                        )}
                      />
                      <p className="text-muted-foreground pl-2 text-xs">
                        {tPdf("footnote", { fullName })}
                      </p>
                    </form>
                  </Form>
                </div>
              </div>
            </section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default CvPageActions;
