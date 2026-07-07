"use client";

import { useOptimistic, useCallback, useTransition } from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";

import { api } from "@/trpc/react";
import SimpleLocalizedList from "@/components/admin/shared/simple-localized-list";
import type { IItem } from "@/components/admin/shared/simple-localized-form";
import type { z } from "zod";
import type { LocalizedTextSchema } from "@/lib/i18n/localized";

type LocalizedText = z.infer<typeof LocalizedTextSchema>;
import type { Locale } from "@/i18n/config";
import { toast } from "sonner";
import { CvListSkeleton } from "./cv-list-skeleton";

const AdditionalList: FC = () => {
  const t = useTranslations("admin.forms.additional");
  const { data, isLoading } = api.cv.getMine.useQuery();
  const utils = api.useUtils();
  const create = api.cv.createAdditionalInfo.useMutation();
  const update = api.cv.updateAdditionalInfo.useMutation();
  const remove = api.cv.deleteAdditionalInfo.useMutation();
  const reorder = api.cv.reorderAdditionalInfo.useMutation();

  const [optimisticItems, setOptimisticItems] = useOptimistic(
    data?.additionalInformation ?? [],
    (state, newItems: NonNullable<typeof data>["additionalInformation"]) =>
      newItems,
  );

  const [, startTransition] = useTransition();

  const handleReorder = useCallback(
    (newItems: IItem[]) => {
      startTransition(async () => {
        const itemMap = new Map(
          (data?.additionalInformation ?? []).map((i) => [i.id, i]),
        );
        setOptimisticItems(
          newItems.map((ni) => itemMap.get(ni.id)!).filter(Boolean),
        );
        const payload = newItems.map((item, index) => ({
          id: item.id,
          order: index,
        }));
        try {
          await reorder.mutateAsync(payload);
          await utils.cv.getMine.invalidate();
        } catch {
          toast.error(t("saveFailed"));
        }
      });
    },
    [reorder, utils, data, setOptimisticItems, t],
  );

  const handleCreate = useCallback(
    (input: { text: LocalizedText }) => {
      startTransition(async () => {
        try {
          await create.mutateAsync({ text: input.text });
          await utils.cv.getMine.invalidate();
        } catch {
          toast.error(t("saveFailed"));
        }
      });
    },
    [create, utils, t],
  );

  const handleUpdate = useCallback(
    (id: string, input: { text: LocalizedText }) => {
      startTransition(async () => {
        try {
          await update.mutateAsync({ id, text: input.text });
          await utils.cv.getMine.invalidate();
        } catch {
          toast.error(t("saveFailed"));
        }
      });
    },
    [update, utils, t],
  );

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        try {
          await remove.mutateAsync({ id });
          await utils.cv.getMine.invalidate();
        } catch {
          toast.error(t("deleteFailed"));
        }
      });
    },
    [remove, utils, t],
  );

  if (isLoading || !data) return <CvListSkeleton />;

  const defaultLocale = (data.profile?.defaultLocale as Locale) ?? "en";

  return (
    <SimpleLocalizedList
      fieldLabel={t("label")}
      addLabel={t("add")}
      defaultLocale={defaultLocale}
      items={optimisticItems.map((s) => ({
        id: s.id,
        text: s.text,
      }))}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onReorder={handleReorder}
      onChanged={async () => undefined}
    />
  );
};

export default AdditionalList;
