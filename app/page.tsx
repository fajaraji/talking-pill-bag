"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  type Language,
  languages,
  defaultLanguage,
  t,
} from "@/lib/i18n";
import { getMedicines } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [hasMedicines, setHasMedicines] = useState(false);

  // Load persisted language choice on mount
  useEffect(() => {
    const stored = localStorage.getItem("tpb-lang") as Language | null;
    if (stored && languages.some((l) => l.code === stored)) {
      setLang(stored);
      document.documentElement.lang = stored;
    }
    setHasMedicines(getMedicines().length > 0);
  }, []);

  function selectLanguage(code: Language) {
    setLang(code);
    localStorage.setItem("tpb-lang", code);
    document.documentElement.lang = code;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12">
      {/* App title */}
      <header className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          {t(lang, "appTitle")}
        </h1>
        <p className="mt-3 text-base text-slate-600">
          {t(lang, "tagline")}
        </p>
      </header>

      {/* Language selector */}
      <section className="w-full max-w-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">
          {t(lang, "chooseLanguage")}
        </h2>
        <div className="flex flex-col gap-3">
          {languages.map((l) => {
            const selected = lang === l.code;
            return (
              <button
                key={l.code}
                onClick={() => selectLanguage(l.code)}
                className={`flex items-center justify-between rounded-xl border-2 px-5 py-4 text-left text-lg transition-colors ${
                  selected
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                }`}
                aria-pressed={selected}
              >
                <span className="font-medium">{l.nativeLabel}</span>
                <span className="text-sm text-slate-500">{l.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Navigation buttons */}
      <div className="flex w-full max-w-sm flex-col gap-4">
        {hasMedicines && (
          <button
            className="w-full rounded-xl bg-green-600 px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-green-700 active:bg-green-800"
            onClick={() => router.push("/today")}
            aria-label={t(lang, "todaysMedicines")}
          >
            {t(lang, "todaysMedicines")}
          </button>
        )}
        <button
          className="w-full rounded-xl bg-blue-600 px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800"
          onClick={() => router.push("/add")}
          aria-label={t(lang, "addMedicine")}
        >
          {t(lang, "addMedicine")}
        </button>
      </div>
    </main>
  );
}
