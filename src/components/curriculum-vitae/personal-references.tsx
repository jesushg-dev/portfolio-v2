import type { FC } from "react";
import { useTranslations } from "next-intl";

import type { LocalizedCvData } from "./types";

interface IPersonalReferencesProps {
  personalReferences: LocalizedCvData["personalReferences"];
}

function PersonalReferenceItem({
  item,
}: {
  item: LocalizedCvData["personalReferences"][number];
}) {
  return (
    <div className="flex text-sm text-[#1a1a1a]">
      <p className="mr-1">-</p>
      <p className="m-0">
        {item.name}
        {item.role ? ` - ${item.role}` : ""}
        {item.contact ? ` - ${item.contact}` : ""}
      </p>
    </div>
  );
}

const PersonalReferences: FC<IPersonalReferencesProps> = ({
  personalReferences,
}) => {
  const t = useTranslations("curriculum");

  if (!personalReferences.length) return null;

  return (
    <>
      <h5 className="text-cv mb-1 flex items-center gap-1 text-lg font-semibold tracking-tight uppercase">
        {t("header.personalReferences")}
      </h5>

      <div className="mb-2">
        {personalReferences.map((item) => (
          <PersonalReferenceItem key={item.id} item={item} />
        ))}
      </div>
    </>
  );
};

export default PersonalReferences;
