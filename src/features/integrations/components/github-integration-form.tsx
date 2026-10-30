"use client";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api, type RouterOutputs } from "@/trpc/react";
import { Form, FormControl, FormField } from "@/components/ui/form";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
} from "@/components/shared/form-root";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
interface Props {
  status: RouterOutputs["integrationsAdmin"]["getConfigs"]["github"];
  onSuccess: () => void;
  onCancel: () => void;
}
export function GithubIntegrationForm({ status, onSuccess, onCancel }: Props) {
  const t = useTranslations("adminCredentials.github");
  const utils = api.useUtils();
  const router = useRouter();
  const form = useForm<{ accessToken: string }>({
    defaultValues: { accessToken: "" },
  });
  const token = useWatch({ control: form.control, name: "accessToken" });
  const save = api.integrationsAdmin.saveGithub.useMutation();
  const onSubmit = async (input: { accessToken: string }) => {
    try {
      await save.mutateAsync({ accessToken: input.accessToken.trim() });
      form.reset({ accessToken: "" });
      await Promise.all([
        utils.integrationsAdmin.getConfigs.invalidate(),
        utils.nowAdmin.invalidate(),
      ]);
      router.refresh();
      toast.success(t("saved"));
      onSuccess();
    } catch {
      toast.error(t("failed"));
    }
  };
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <Form {...form}>
        <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
          <FormContent error={save.error}>
            <div className="border-border bg-muted/30 flex items-start gap-3 rounded-xl border p-4">
              <ShieldCheck
                aria-hidden
                className="text-primary size-5 shrink-0"
              />
              <p className="text-muted-foreground text-sm">{t("private")}</p>
            </div>
            {status.isConfigured ? (
              <p className="text-sm font-medium">
                {t("connected", { login: status.login })}
              </p>
            ) : null}
            <FormField
              control={form.control}
              name="accessToken"
              render={({ field }) => (
                <FormItem label={t("token")} description={t("tokenHint")}>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      spellCheck={false}
                      minLength={20}
                      maxLength={300}
                      required
                      placeholder={status.maskedAccessToken || "github_pat_…"}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </FormContent>
          <FormActions
            isPending={save.isPending}
            disabled={save.isPending || token.trim().length < 20}
            title={t("save")}
          >
            <Button
              type="button"
              variant="outline"
              disabled={save.isPending}
              onClick={onCancel}
            >
              {t("cancel")}
            </Button>
          </FormActions>
        </FormRoot>
      </Form>
      <aside className="border-border bg-muted/20 space-y-4 rounded-xl border p-4 sm:p-5">
        <h2 className="text-base font-semibold">{t("guideTitle")}</h2>
        <ol className="text-muted-foreground list-decimal space-y-3 pl-5 text-sm">
          <li>{t("step1")}</li>
          <li>{t("step2")}</li>
          <li>{t("step3")}</li>
          <li>{t("step4")}</li>
          <li>{t("step5")}</li>
        </ol>
        <a
          href="https://github.com/settings/personal-access-tokens/new"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline"
        >
          {t("createToken")}
          <ExternalLink aria-hidden className="size-3.5" />
        </a>
        <p className="text-muted-foreground text-xs">{t("fallback")}</p>
        <a
          href="https://docs.github.com/en/graphql/guides/forming-calls-with-graphql"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex text-xs font-medium hover:underline"
        >
          {t("documentation")}
        </a>
      </aside>
    </div>
  );
}
