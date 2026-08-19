"use client";

import { useCallback, useMemo, useState, useTransition, type FC } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarIcon, MapPin, DollarSign, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { FileUpload } from "@/components/file-upload";
import { UploadThingRequiredNotice } from "@/features/integrations/components/uploadthing-required-notice";
import { fileToBase64 } from "@/lib/uploadthing/file-to-base64";
import type { ApplicationStatus } from "@/features/job-tracker/types";
import type { Locale } from "@/i18n/config";
import {
  type ApplicationCreateFormDTO,
  type ApplicationEditorDTO,
} from "@/features/job-tracker/lib/application-editor-dto";
import { CompanyCombobox } from "@/features/job-tracker/components/company-combobox";
import { decodeNewCompanyName } from "@/features/job-tracker/lib/company-combobox";
import type { CompanyEditorDTO } from "@/features/job-tracker/lib/company-editor-dto";
import { getDateFnsLocale } from "@/features/job-tracker/lib/date-locale";
import { Form, FormControl, FormField } from "@/components/ui/form";
import {
  FormRoot,
  FormContent,
  FormSection,
  FormItem,
  FormActions,
} from "@/components/shared/form-root";

const APPLICATION_STATUSES = [
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "GHOSTED",
  "REJECTED",
  "HIRED",
] as const satisfies readonly ApplicationStatus[];

interface ApplicationFormProps {
  initialData: ApplicationEditorDTO | ApplicationCreateFormDTO;
  companies: CompanyEditorDTO[];
  locale: Locale;
}

export const ApplicationForm: FC<ApplicationFormProps> = ({
  initialData,
  companies,
  locale,
}) => {
  const isEditMode = "id" in initialData;
  const t = useTranslations("admin.forms.jobTrackerApplication");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploadUrl, setCvUploadUrl] = useState<string | null>(null);
  const [cvUploadName, setCvUploadName] = useState<string | null>(null);

  const configs = api.integrationsAdmin.getConfigs.useQuery();
  const uploadFile = api.integrationsAdmin.uploadFile.useMutation();
  const uploadEnabled = configs.data?.uploadthing.isConfigured ?? false;

  const utils = api.useUtils();
  const createApplication = api.jobTrackerAdmin.createApplication.useMutation();
  const updateApplication = api.jobTrackerAdmin.updateApplication.useMutation();
  const createCompany = api.jobTrackerAdmin.createCompany.useMutation();

  const statusItems = useMemo(
    () =>
      APPLICATION_STATUSES.map((status) => ({
        value: status,
        label: t(`status.${status}`),
      })),
    [t],
  );

  const dateFnsLocale = getDateFnsLocale(locale);

  const applicationSchema = useMemo(
    () =>
      z.object({
        position: z.string().min(1, t("validation.positionRequired")),
        companyId: z.string().min(1, t("validation.companyRequired")),
        status: z.enum(APPLICATION_STATUSES),
        appliedDate: z.date(),
        salary: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
        description: z.string().optional(),
      }),
    [t],
  );

  type ApplicationFormData = z.infer<typeof applicationSchema>;

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: initialData as ApplicationFormData,
    mode: "onBlur",
  });

  const handleSubmit = useCallback(
    (data: ApplicationFormData) => {
      startTransition(async () => {
        setServerError(null);
        try {
          let companyId = data.companyId;
          const newCompanyName = decodeNewCompanyName(companyId);
          if (newCompanyName) {
            const company = await createCompany.mutateAsync({
              name: newCompanyName,
            });
            companyId = company.id;
            await utils.jobTrackerAdmin.getCompanies.invalidate();
          }

          let cvFileObj = undefined;
          if (cvFile) {
            if (!uploadEnabled) {
              throw new Error(t("uploadthingRequired"));
            }

            let url = cvUploadUrl;
            if (!url) {
              const dataBase64 = await fileToBase64(cvFile);
              const uploaded = await uploadFile.mutateAsync({
                fileName: cvFile.name,
                mimeType: cvFile.type || "application/pdf",
                dataBase64,
              });
              url = uploaded.url;
              setCvUploadUrl(url);
              setCvUploadName(cvFile.name);
            }
            cvFileObj = {
              name: cvUploadName ?? cvFile.name,
              url,
              uploadedAt: new Date(),
            };
          }

          const payload = {
            position: data.position,
            companyId,
            status: data.status,
            appliedDate: data.appliedDate,
            salary: data.salary ?? undefined,
            location: data.location ?? undefined,
            notes: data.notes ?? undefined,
            description: data.description ?? undefined,
            cvFile: cvFileObj,
          };

          let createdId: string | null = null;
          if (isEditMode) {
            await updateApplication.mutateAsync({
              id: initialData.id,
              ...payload,
            });
          } else {
            const created = await createApplication.mutateAsync(payload);
            createdId = created.id;
          }

          toast.success(t("toast.success.title"), {
            description: t("toast.success.description"),
          });
          await utils.jobTrackerAdmin.getApplications.invalidate();
          await utils.jobTrackerAdmin.getDashboardStats.invalidate();

          if (createdId) {
            router.replace({
              pathname: "/admin/job-tracker/applications/[id]",
              params: { id: createdId },
            });
          } else {
            router.back();
          }
        } catch (err) {
          setServerError(
            err instanceof Error ? err.message : t("toast.error.description"),
          );
          toast.error(t("toast.error.title"), {
            description: t("toast.error.description"),
          });
        }
      });
    },
    [
      createApplication,
      createCompany,
      cvFile,
      cvUploadName,
      cvUploadUrl,
      initialData,
      isEditMode,
      router,
      t,
      updateApplication,
      uploadEnabled,
      uploadFile,
      utils,
    ],
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(handleSubmit)}>
        <FormContent error={serverError ? new Error(serverError) : null}>
          <FormSection title={t("sections.info")}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem
                    label={t("fields.position")}
                    inputId="position"
                    required
                  >
                    <Input
                      id="position"
                      placeholder={t("placeholders.position")}
                      icon={<Briefcase className="h-4 w-4" />}
                      {...field}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem
                    label={t("fields.company")}
                    inputId="companyId"
                    required
                  >
                    <CompanyCombobox
                      id="companyId"
                      value={field.value}
                      onChange={field.onChange}
                      companies={companies}
                    />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem label={t("fields.description")} inputId="description">
                  <Textarea
                    id="description"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title={t("sections.details")}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem
                    label={t("fields.status")}
                    inputId="status"
                    required
                  >
                    <Select
                      items={statusItems}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger id="status" className="w-full">
                          <SelectValue placeholder={t("fields.status")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {APPLICATION_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`status.${status}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appliedDate"
                render={({ field }) => (
                  <FormItem
                    label={t("fields.appliedDate")}
                    inputId="appliedDate"
                    required
                  >
                    <Popover>
                      <PopoverTrigger
                        render={
                          <FormControl>
                            <Button
                              id="appliedDate"
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value
                                ? format(field.value, "PPP", {
                                    locale: dateFnsLocale,
                                  })
                                : t("placeholders.date")}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        }
                      />
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem label={t("fields.salary")} inputId="salary">
                    <Input
                      id="salary"
                      placeholder={t("placeholders.salary")}
                      icon={<DollarSign className="h-4 w-4" />}
                      {...field}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem label={t("fields.location")} inputId="location">
                    <Input
                      id="location"
                      placeholder={t("placeholders.location")}
                      icon={<MapPin className="h-4 w-4" />}
                      {...field}
                    />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem label={t("fields.notes")} inputId="notes">
                  <Textarea id="notes" className="min-h-[100px]" {...field} />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title={t("sections.documents")}>
            <FormItem
              label={t("fields.cv")}
              inputId="cv"
              description={t("descriptions.cvUpload")}
            >
              {!configs.isLoading && !uploadEnabled ? (
                <UploadThingRequiredNotice />
              ) : (
                <FileUpload
                  onFileSelect={(file) => {
                    setCvFile(file);
                    setCvUploadUrl(null);
                    setCvUploadName(null);
                  }}
                  currentFile={
                    cvFile
                      ? {
                          name: cvFile.name,
                          url: cvUploadUrl ?? "#",
                        }
                      : "cvFile" in initialData && initialData.cvFile
                        ? {
                            name: initialData.cvFile.name,
                            url: initialData.cvFile.url,
                          }
                        : undefined
                  }
                  onFileRemove={() => {
                    setCvFile(null);
                    setCvUploadUrl(null);
                    setCvUploadName(null);
                  }}
                />
              )}
            </FormItem>
          </FormSection>
        </FormContent>

        <FormActions
          isPending={isPending || uploadFile.isPending}
          title={isEditMode ? t("actions.save") : t("actions.submit")}
          submitId="application-submit"
        >
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t("actions.cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};
