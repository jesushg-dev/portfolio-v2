import type { ComponentType, FC } from "react";
import {
  BookOpen,
  ClipboardList,
  Library,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

// Generic Icon Component
const IconComponent: FC<{ Icon: ComponentType<{ className?: string }> }> = ({
  Icon,
}) => {
  return <Icon className="text-xs" />;
};

// Specific Icon Exports
export const ClientLocalImportContactsIcon: FC = () => (
  <IconComponent Icon={BookOpen} />
);

export const ClientLocalLibraryIcon: FC = () => (
  <IconComponent Icon={Library} />
);

export const ClientLocalAssignmentIcon: FC = () => (
  <IconComponent Icon={ClipboardList} />
);

export const ClientLocalGroupsIcon: FC = () => <IconComponent Icon={Users} />;

export const ClientLocalInsightsIcon: FC = () => (
  <IconComponent Icon={TrendingUp} />
);

export const ClientLocalSettingsIcon: FC = () => (
  <IconComponent Icon={Settings} />
);
