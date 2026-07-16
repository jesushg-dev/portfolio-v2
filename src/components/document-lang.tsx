"use client";

import { useEffect } from "react";

interface DocumentLangProps {
  locale: string;
}

/** Keeps `<html lang>` in sync when locale changes client-side. */
export function DocumentLang({ locale }: DocumentLangProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
