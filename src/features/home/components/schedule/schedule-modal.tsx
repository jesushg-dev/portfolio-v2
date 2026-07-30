"use client";

import { useSyncExternalStore } from "react";
import { PopupModal } from "react-calendly";

import { useBodyOverlayLock } from "@/hooks/use-body-overlay-lock";
import { useRouter } from "@/i18n/routing";
import { CALENDLY_PAGE_SETTINGS } from "@/utils/calendly-url";

interface ScheduleModalProps {
  calendlyUrl: string;
}

const unsubscribe = () => undefined;
const subscribe = () => unsubscribe;
const getSnapshot = () => document.body;
const getServerSnapshot = () => null;

export function ScheduleModal({ calendlyUrl }: ScheduleModalProps) {
  const router = useRouter();
  const rootElement = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useBodyOverlayLock(Boolean(rootElement && calendlyUrl.trim()));

  if (!rootElement || !calendlyUrl.trim()) return null;

  return (
    <PopupModal
      url={calendlyUrl.trim()}
      onModalClose={() => router.back()}
      open={true}
      rootElement={rootElement}
      pageSettings={CALENDLY_PAGE_SETTINGS}
    />
  );
}
