export { generateMetadata } from "./metadata";

import { IntegrationsPage } from "@/features/integrations/components/integrations-page";

export default function AdminCredentialsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <IntegrationsPage />
    </div>
  );
}
