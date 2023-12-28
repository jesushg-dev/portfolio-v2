import React, { FC } from 'react';

import { MdOutlineGroups3, MdInsights, MdSettings } from 'react-icons/md';
import { MdAssignment, MdImportContacts, MdLocalLibrary } from 'react-icons/md';

import { useCvContext } from '@/hoc/CvContextProvider';

import type { IconType } from 'react-icons/lib';

// Generic Icon Component
const IconComponent: FC<{ Icon: IconType }> = ({ Icon }) => {
  const { showSectionIcons } = useCvContext();
  return <>{showSectionIcons && <Icon className="text-xs" />}</>;
};

// Specific Icon Exports
export const ClientLocalImportContactsIcon: FC = () => <IconComponent Icon={MdImportContacts} />;

export const ClientLocalLibraryIcon: FC = () => <IconComponent Icon={MdLocalLibrary} />;

export const ClientLocalAssignmentIcon: FC = () => <IconComponent Icon={MdAssignment} />;

export const ClientLocalGroupsIcon: FC = () => <IconComponent Icon={MdOutlineGroups3} />;

export const ClientLocalInsightsIcon: FC = () => <IconComponent Icon={MdInsights} />;

export const ClientLocalSettingsIcon: FC = () => <IconComponent Icon={MdSettings} />;
