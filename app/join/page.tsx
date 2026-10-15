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
import { LoadingShell } from "@/app/loading-shell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { joinHousehold } = useStore();
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

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
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-page px-6 py-12">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-ink">{t(lang, "appTitle")}</h1>
      </header>

      {status === "loading" && (
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-primary" />
          <p className="text-lg text-muted">{t(lang, "loading")}</p>
        </div>
      )}

      {status === "success" && (
        <Card className="w-full max-w-sm items-center text-center border-success-border bg-success-bg">
          <p className="text-xl font-bold text-success-text">
            {t(lang, "joinSuccess")}
          </p>
          <p className="text-base text-success-text">
            {t(lang, "redirecting")}
          </p>
        </Card>
      )}

      {status === "error" && (
        <Card className="w-full max-w-sm items-center text-center border-danger-border bg-danger-bg">
          <p className="text-xl font-bold text-danger-text">
            {t(lang, "joinFailed")}
          </p>
          <p className="text-base text-danger-text">{error}</p>
          <Button
            variant="primary"
            className="mt-4 w-full"
            onClick={() => router.push("/")}
          >
            {t(lang, "back")}
          </Button>
        </Card>
      )}
    </main>
  );
}

function JoinPageInner() {
  const { isHydrated } = useStore();

  // Neutral loading shell until hydrated; the content component holds all
  // other hooks so their order never changes between renders.
  if (!isHydrated) {
    return <LoadingShell />;
  }
  return <JoinPageContent />;
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page px-6 py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-primary" />
          <p className="text-lg text-muted">Loading…</p>
        </main>
      }
    >
      <JoinPageInner />
    </Suspense>
  );
}
