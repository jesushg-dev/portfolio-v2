"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { api } from "@/trpc/react";

export function StartJobSearchButton() {
  const t = useTranslations("admin.jobTracker");
  const router = useRouter();
  const mutation = api.jobTrackerAdmin.startJobSearch.useMutation();

  return (
    <Button
      type="button"
      disabled={mutation.isPending}
      onClick={() => {
        void mutation
          .mutateAsync({})
          .then(() => router.refresh())
          .catch(() => toast.error(t("search.startError")));
      }}
    >
      <Plus aria-hidden /> {t("search.start")}
    </Button>
  );
}
