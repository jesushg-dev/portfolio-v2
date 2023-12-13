'use client';

import {useEffect} from 'react';
import {useTranslations} from 'next-intl';
import Layout from '@/components/Layout';

type Props = {
  error: Error;
  reset(): void;
};

export default function Error({error, reset}: Props) {
  const t = useTranslations("global");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Layout>
      <div>
        <h1>{t("fallback.noResults.title")}</h1>
        <p>{t("fallback.noResults.description")}</p>
        <button
          className="text-white underline underline-offset-2"
          onClick={reset}
          type="button"
        >
          reset
        </button>
      </div>
    </Layout>
  );
}
