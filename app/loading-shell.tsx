// Neutral loading shell rendered identically on server and client
// to prevent hydration mismatches while the store reads localStorage.

export function LoadingShell() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-page px-6 py-12">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-primary" />
      <p className="text-lg text-muted">Loading…</p>
    </main>
  );
}
