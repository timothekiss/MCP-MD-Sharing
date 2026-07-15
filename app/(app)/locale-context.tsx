"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";
import { t as translate, type Locale, type TranslationKey } from "@/lib/i18n/dictionary";

interface LocaleContextValue {
  locale: Locale;
  t: (key: TranslationKey) => string;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  function setLocale(next: Locale) {
    setLocaleState(next);
    // Persisted on the user's own account (Supabase Auth user_metadata), so it
    // follows them across sign-out/sign-in and devices — not just this browser.
    getBrowserClient()
      .auth.updateUser({ data: { locale: next } })
      .then(() => router.refresh());
  }

  return (
    <LocaleContext.Provider value={{ locale, t: (key) => translate(locale, key), setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
