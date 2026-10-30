"use client";

import { useState, useTransition, type FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, ArrowUpDown, CheckSquare } from "lucide-react";
import { api } from "@/trpc/react";

import { Form, FormField, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkillPicker } from "@/components/admin/skill-picker";
import { CvOrderedSkillSelection } from "./cv-ordered-skill-selection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormActions,
  FormContent,
  FormItem,
  FormRoot,
} from "@/components/shared/form-root";

export const CATEGORIES = [
  "FRONTEND",
  "BACKEND",
  "DATABASE",
  "TOOLS",
  "MOBILE",
  "DESKTOP",
  "DEVOPS",
  "CYBERSECURITY",
  "OTHER",
] as const;

export const SkillSchema = z.object({
  category: z.enum(CATEGORIES),
  skillIds: z.array(z.string()),
});

export type SkillInput = z.infer<typeof SkillSchema>;

export const SkillForm: FC<{
  initial?: {
    id: string;
    category: (typeof CATEGORIES)[number];
    skillIds: string[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ initial, onSuccess, onCancel }) => {
  const t = useTranslations("admin.forms.skills");
  const utils = api.useUtils();
  const create = api.cv.createTechnicalSkill.useMutation();
  const update = api.cv.updateTechnicalSkill.useMutation();
  const [activeTab, setActiveTab] = useState<"select" | "order">("select");
  const [isPending, startTransition] = useTransition();
  const {
    data: { data: availableSkills = [] } = {},
    isLoading: skillsLoading,
    error: skillsError,
  } = api.skillsAdmin.getMine.useQuery({});

  const form = useForm<SkillInput>({
    resolver: zodResolver(SkillSchema),
    defaultValues: {
      category: initial?.category ?? "FRONTEND",
      skillIds: initial?.skillIds ?? [],
    },
  });

  const handleSubmit = (input: SkillInput) => {
    startTransition(async () => {
      try {
        if (initial?.id) {
          await update.mutateAsync({
            id: initial.id,
            category: input.category,
            skillIds: input.skillIds,
          });
        } else {
          await create.mutateAsync({
            category: input.category,
            skillIds: input.skillIds,
          });
        }
        await utils.cv.getMine.invalidate();
        toast.success(t("save") || "Saved successfully");
        onSuccess();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("saveFailed") || "Save failed",
        );
      }
    });
  };

  const handleFormSubmit = form.handleSubmit(handleSubmit, (errors) => {
    if (errors.skillIds) {
      setActiveTab("select");
    }
  });

  return (
    <Form {...form}>
      <FormRoot id="cv-skill-form" onSubmit={handleFormSubmit}>
        <FormContent error={skillsError}>
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem label={t("category")} inputId="cv-skill-category">
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger id="cv-skill-category" className="w-full">
                      <SelectValue placeholder={t("category")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem
                        key={c}
                        value={c}
                        id={`cv-skill-category-option-${c}`}
                      >
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="skillIds"
            render={({ field }) => {
              const selectedCount = field.value.length;

              return (
                <FormItem label={t("items")} inputId="cv-skill-items">
                  <div className="space-y-4">
                    <Tabs
                      value={activeTab}
                      onValueChange={(val) =>
                        setActiveTab(val as "select" | "order")
                      }
                      className="w-full"
                    >
                      <TabsList
                        variant="line"
                        className="border-border/60 mb-4 w-full justify-start border-b"
                      >
                        <TabsTrigger value="select" className="text-sm">
                          <CheckSquare className="size-4" aria-hidden />
                          <span>{t("tabSelect")}</span>
                        </TabsTrigger>
                        <TabsTrigger value="order" className="text-sm">
                          <ArrowUpDown className="size-4" aria-hidden />
                          <span>{t("tabOrder")}</span>
                          {selectedCount > 0 && (
                            <span className="bg-primary/10 text-primary ml-1.5 rounded-full px-2 py-0.5 text-xs font-semibold">
                              {selectedCount}
                            </span>
                          )}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="select" className="mt-0 space-y-4">
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          {t("catalogHint")}
                        </p>
                        <SkillPicker
                          availableSkills={availableSkills}
                          selectedSkillIds={field.value}
                          onChange={field.onChange}
                        />
                        {selectedCount > 0 && (
                          <div className="border-border/60 flex justify-end border-t pt-3">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setActiveTab("order")}
                              className="gap-2 text-xs"
                            >
                              <span>
                                {t("continueToOrder", { count: selectedCount })}
                              </span>
                              <ArrowRight className="size-3.5" aria-hidden />
                            </Button>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="order" className="mt-0 space-y-4">
                        {selectedCount === 0 ? (
                          <div className="border-border flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
                            <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
                              <ArrowUpDown className="size-5" aria-hidden />
                            </div>
                            <div className="space-y-1">
                              <p className="text-foreground text-sm font-medium">
                                {t("emptyOrderTitle")}
                              </p>
                              <p className="text-muted-foreground max-w-sm text-xs">
                                {t("emptyOrderDescription")}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveTab("select")}
                              className="gap-2 text-xs"
                            >
                              <CheckSquare className="size-3.5" aria-hidden />
                              <span>{t("goToSelect")}</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              {t("orderHint")}
                            </p>
                            <CvOrderedSkillSelection
                              availableSkills={availableSkills}
                              selectedSkillIds={field.value}
                              onChange={field.onChange}
                            />
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </FormItem>
              );
            }}
          />
        </FormContent>
        <FormActions
          isPending={
            form.formState.isSubmitting ||
            isPending ||
            skillsLoading ||
            Boolean(skillsError)
          }
          title={t("save")}
          submitId="cv-skill-form-submit"
        >
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </FormActions>
      </FormRoot>
    </Form>
  );
};

export default SkillForm;
