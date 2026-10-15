"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  type Language,
  languages,
  defaultLanguage,
  t,
} from "@/lib/i18n";
import { useStore } from "@/lib/store";

function JoinPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { joinHousehold, isHydrated } = useStore();
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  // Show neutral loading shell until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6 py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <p className="text-lg text-slate-500">Loading…</p>
      </main>
    );
  }

  useEffect(() => {
    const stored = localStorage.getItem("tpb-lang") as Language | null;
    if (stored && languages.some((l) => l.code === stored)) {
      setLang(stored);
      document.documentElement.lang = stored;
    }

    const code = searchParams.get("c");
    if (!code) {
      setStatus("error");
      setError(t(lang, "invalidCode"));
      return;
    }

    joinHousehold(code)
      .then(() => {
        setStatus("success");
        setTimeout(() => {
          router.push("/today");
        }, 2000);
      })
      .catch((err) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : t(lang, "invalidCode"));
      });
  }, [searchParams, joinHousehold, router, lang]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6 py-12">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">{t(lang, "appTitle")}</h1>
      </header>

      {status === "loading" && (
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-lg text-slate-600">{t(lang, "loading")}</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border-2 border-green-200 bg-green-50 p-6 text-center">
          <p className="text-xl font-bold text-green-800">
            {t(lang, "joinSuccess")}
          </p>
          <p className="text-base text-green-700">
            {t(lang, "redirecting")}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center">
          <p className="text-xl font-bold text-red-800">
            {t(lang, "joinFailed")}
          </p>
          <p className="text-base text-red-700">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white hover:bg-blue-700"
          >
            {t(lang, "back")}
          </button>
        </div>
      )}
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-lg text-slate-600">Loading…</p>
        </main>
      }
    >
      <JoinPageInner />
    </Suspense>
  );
}
