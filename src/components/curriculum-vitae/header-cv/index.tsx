import type { FC } from "react";
import type { LocalizedCvData } from "../types";
import ClientImage from "./client-image";

interface IHeaderCvProps {
  header?: LocalizedCvData["header"];
  fallbackName?: string | null;
}

const HeaderCV: FC<IHeaderCvProps> = ({ header, fallbackName }) => {
  const rawName = header?.fullName;
  const fullName =
    rawName != null && rawName.length > 0 ? rawName : (fallbackName ?? "");
  const degree = header?.degree ?? "";
  const alt = header?.clientImageAlt ?? fullName;

  return (
    <div className="bg-cv flex flex-row items-center justify-between border-b-2 px-8 py-4 text-white">
      <div className="flex flex-col items-start">
        <h1 className="mb-2 text-4xl font-normal">{degree}</h1>
        <h2 className="text-xl font-normal">{fullName}</h2>
      </div>
      {header?.photoUrl ? (
        <div>
          <ClientImage src={header.photoUrl} alt={alt || fullName} />
        </div>
      ) : null}
    </div>
  );
};

export default HeaderCV;
