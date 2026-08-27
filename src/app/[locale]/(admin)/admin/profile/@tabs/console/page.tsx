import type { FC } from "react";

export { generateMetadata } from "./metadata";

import { db } from "@/server/db";
import { ConsoleForm } from "@/features/profile/components/console-form";

const ConsolePage: FC = async () => {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });

  return <ConsoleForm languages={languages} />;
};

export default ConsolePage;
