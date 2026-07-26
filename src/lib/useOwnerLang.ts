"use client";

import { useEffect, useState } from "react";

export type Lang = "en" | "ar";

const STORAGE_KEY = "ownerLang";

// Shared across dashboard/settings/billing so the toggle persists as the
// owner navigates between their own pages, instead of resetting to English
// on every page load like the customer-facing pages do.
export function useOwnerLang(): [Lang, (lang: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ar") setLangState(stored);
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return [lang, setLang];
}
