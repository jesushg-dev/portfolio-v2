"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2, Globe, Mail } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { Form, FormField } from "@/components/ui/form";
import {
  type CompanyCreateFormDTO,
  type CompanyEditorDTO,
} from "@/features/job-tracker/lib/company-editor-dto";
import {
  FormRoot,
  FormContent,
  FormSection,
  FormItem,
  FormActions,
} from "@/components/shared/form-root";

interface CompanyFormProps {
  initialData: CompanyEditorDTO | CompanyCreateFormDTO;
}

export const CompanyForm: FC<CompanyFormProps> = ({ initialData }) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.jobTrackerCompany");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const utils = api.useUtils();
  const createCompany = api.jobTrackerAdmin.createCompany.useMutation();
  const updateCompany = api.jobTrackerAdmin.updateCompany.useMutation();

  const companySchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("validation.nameRequired")),
        email: z
          .string()
          .email(t("validation.emailInvalid"))
          .optional()
          .or(z.literal("")),
        website: z
          .string()
          .url(t("validation.urlInvalid"))
          .optional()
          .or(z.literal("")),
        description: z.string().optional(),
      }),
    [t],
  );

  type CompanyFormData = z.infer<typeof companySchema>;

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: initialData as CompanyFormData,
    mode: "onBlur",
  });

  const handleSubmit = useCallback(
    (data: CompanyFormData) => {
      startTransition(async () => {
        setServerError(null);
        try {
          if (isEditMode) {
            await updateCompany.mutateAsync({
              id: initialData.id,
              name: data.name,
              email: data.email ?? undefined,
              website: data.website ?? undefined,
              description: data.description ?? undefined,
            });
          } else {
            await createCompany.mutateAsync({
              name: data.name,
              email: data.email ?? undefined,
              website: data.website ?? undefined,
              description: data.description ?? undefined,
            });
          }

          toast.success(t("toast.success.title"), {
            description: t("toast.success.description", { name: data.name }),
          });

          await utils.jobTrackerAdmin.getCompanies.invalidate();
          await utils.jobTrackerAdmin.getDashboardStats.invalidate();
          router.back();
        } catch (err) {
          setServerError(
            err instanceof Error ? err.message : t("errors.unknown"),
          );
          toast.error(t("toast.error.title"), {
            description: t("toast.error.description"),
          });
        }
      });
    },
    [createCompany, initialData, isEditMode, router, t, updateCompany, utils],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent error={serverError ? new Error(serverError) : null}>
          <FormSection title={t("sections.info")}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem
                  label={t("fields.name")}
                  inputId="company-name"
                  required
                >
                  <Input
                    id="company-name"
                    placeholder={t("placeholders.name")}
                    icon={<Building2 className="h-4 w-4" />}
                    {...field}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem label={t("fields.email")} inputId="company-email">
                  <Input
                    id="company-email"
                    type="email"
                    placeholder={t("placeholders.email")}
                    icon={<Mail className="h-4 w-4" />}
                    {...field}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem label={t("fields.website")} inputId="company-website">
                  <Input
                    id="company-website"
                    type="url"
                    placeholder={t("placeholders.website")}
                    icon={<Globe className="h-4 w-4" />}
                    {...field}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem
                  label={t("fields.description")}
                  inputId="company-description"
                >
                  <Textarea
                    id="company-description"
                    placeholder={t("placeholders.description")}
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormItem>
              )}
            />
          </FormSection>
        </FormContent>

        <FormActions
          isPending={isPending}
          title={isEditMode ? t("actions.save") : t("actions.submit")}
          submitId="company-submit"
        >
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t("actions.cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
