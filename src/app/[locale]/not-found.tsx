import { useTranslations } from 'next-intl';
import Layout from '@/components/Layout';

// Note that `app/[locale]/[...rest]/page.tsx`
// is necessary for this page to render.

export default function NotFoundPage() {
  const t = useTranslations("global");

  return (
    <Layout>
      <p className="max-w-[460px]">{t("fallback.noResults.title")}</p>
    </Layout>
  );
}
