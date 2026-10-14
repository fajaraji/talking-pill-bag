const DEMO_OFFSET_KEY = "tpb-demo-offset-days";
const DEMO_FLAG_KEY = "tpb-demo";

function getOffsetDays(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(DEMO_OFFSET_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * Return today's date shifted by the demo offset.
 * Format: YYYY-MM-DD
 */
export function getToday(): string {
  const now = getNow();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Return the current Date shifted by the demo offset.
 */
export function getNow(): Date {
  const offsetDays = getOffsetDays();
  const now = new Date();
  if (offsetDays === 0) return now;
  now.setDate(now.getDate() + offsetDays);
  return now;
}

/**
 * Advance the demo clock by n days.
 */
export function advanceDemoDays(n: number): void {
  if (typeof window === "undefined") return;
  const current = getOffsetDays();
  localStorage.setItem(DEMO_OFFSET_KEY, String(current + n));
}

/**
 * Reset the demo clock to the real date.
 */
export function resetDemoClock(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_OFFSET_KEY, "0");
}

/**
 * Check whether demo mode is active (URL ?demo=1 or localStorage flag).
 */
export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") {
      localStorage.setItem(DEMO_FLAG_KEY, "1");
      return true;
    }
    return localStorage.getItem(DEMO_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}
