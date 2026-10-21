import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Code2,
  Handshake,
  ListTodo,
  Phone,
  Users,
} from "lucide-react";

import type { EventType } from "@/features/job-tracker/types";

export const EVENT_TYPE_ICONS: Record<EventType, LucideIcon> = {
  INTERVIEW: Users,
  TECHNICAL_TEST: Code2,
  QUESTIONNAIRE: ClipboardList,
  PHONE_CALL: Phone,
  MEETING: Handshake,
  FOLLOW_UP: ListTodo,
};

export function EventTypeIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const Icon = EVENT_TYPE_ICONS[type as EventType] ?? Users;
  return <Icon className={className} aria-hidden />;
}
