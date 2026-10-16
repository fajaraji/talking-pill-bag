// Pure helpers that make the vision model's label output safe to validate.
//
// The model is instructed to return a strict JSON shape, but in practice it
// sometimes returns messy-but-usable values: numbers as strings ("30 TAB"),
// null for unknown string/array fields, uppercase enums, or JSON wrapped in
// markdown fences. These helpers normalise that output BEFORE zod validation so
// a clearly readable label is not rejected just because of formatting.
//
// Everything here is pure (no I/O, no Next.js imports) so it can be unit tested
// from scripts/test-label-normalise.ts.

export const TIME_SLOTS = ["morning", "afternoon", "evening", "bedtime"] as const;
export const FOOD_VALUES = ["after_food", "before_food", "with_food", "any"] as const;

// ---------------------------------------------------------------------------
// Primitive coercion
// ---------------------------------------------------------------------------

function toTrimmedString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "yes", "y", "1"].includes(v)) return true;
    if (["false", "no", "n", "0"].includes(v)) return false;
  }
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (cleaned === "") return null;
    const direct = Number(cleaned);
    if (Number.isFinite(direct)) return direct;
    // "30 TAB" -> 30, "1 time daily" -> 1
    const match = cleaned.match(/-?\d+(?:\.\d+)?/);
    if (match) {
      const parsed = Number(match[0]);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  return null;
}

function toInteger(value: unknown): number | null {
  const n = toNumber(value);
  if (n === null) return null;
  return Math.max(0, Math.round(n));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => toTrimmedString(item)).filter((s) => s.length > 0);
}

function has(obj: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

// ---------------------------------------------------------------------------
// JSON parsing
// ---------------------------------------------------------------------------

// Parse model content that may be wrapped in markdown fences or surrounded by
// prose. Returns null when no JSON object can be recovered.
export function parseModelJson(raw: unknown): unknown | null {
  if (typeof raw !== "string") return null;
  let text = raw.trim();
  if (text.length === 0) return null;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) text = fenced[1].trim();

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

// Coerce a model output object into values the zod schema accepts.
//
// - numbers given as strings ("30 TAB") become numbers
// - null strings become "", null arrays become []
// - strings are trimmed, enum values are lower-cased
// - keys the model did not send are left out, so zod still fails and the route
//   can retry (a missing key is invalid output, not a readability problem)
// - if `readable` or `confidence` cannot be interpreted at all, the whole
//   object is discarded ({}), which also fails validation
export function normaliseLabelOutput(raw: unknown): Record<string, unknown> {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const obj = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  if (has(obj, "readable")) {
    const readable = toBoolean(obj.readable);
    if (readable === null) return {};
    out.readable = readable;
  }

  if (has(obj, "confidence")) {
    const confidence = toNumber(obj.confidence);
    if (confidence === null) return {};
    out.confidence = clamp(confidence, 0, 1);
  }

  if (has(obj, "drug_name")) out.drug_name = toTrimmedString(obj.drug_name);
  if (has(obj, "strength")) out.strength = toTrimmedString(obj.strength);
  if (has(obj, "dose_per_time")) out.dose_per_time = toTrimmedString(obj.dose_per_time);
  if (has(obj, "times_per_day")) out.times_per_day = toInteger(obj.times_per_day) ?? 0;
  if (has(obj, "time_slots")) {
    out.time_slots = toStringArray(obj.time_slots).map((slot) => slot.toLowerCase());
  }
  if (has(obj, "food")) out.food = toTrimmedString(obj.food).toLowerCase();
  if (has(obj, "special_instructions")) {
    out.special_instructions = toStringArray(obj.special_instructions);
  }
  if (has(obj, "quantity_dispensed")) {
    out.quantity_dispensed = toInteger(obj.quantity_dispensed) ?? 0;
  }
  if (has(obj, "dispensed_date")) out.dispensed_date = toTrimmedString(obj.dispensed_date);
  if (has(obj, "unclear_fields")) out.unclear_fields = toStringArray(obj.unclear_fields);

  return out;
}

// ---------------------------------------------------------------------------
// Date guard
// ---------------------------------------------------------------------------

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

function ymdToUtc(value: string): number | null {
  const match = YMD.exec(value);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

// A real calendar date in YYYY-MM-DD form (e.g. rejects "2026-02-30").
export function isValidYmd(value: string): boolean {
  const match = YMD.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// True only when the date is a valid calendar date, not in the future, and not
// more than two years before `today`.
export function isPlausibleDispensedDate(value: string, today: string): boolean {
  if (!isValidYmd(value)) return false;
  const valueUtc = ymdToUtc(value);
  if (valueUtc === null) return false;

  const todayUtc = ymdToUtc(today);
  if (todayUtc === null) return true; // no usable reference date: accept format only

  if (valueUtc > todayUtc) return false; // future

  const [year, month, day] = today.split("-").map(Number);
  const threshold = Date.UTC(year - 2, month - 1, day);
  return valueUtc >= threshold;
}

// Clear a dispensed_date we cannot trust and record it as an unclear field.
export function applyDateGuard<
  T extends { dispensed_date: string; unclear_fields: string[] }
>(result: T, today: string): T {
  if (isPlausibleDispensedDate(result.dispensed_date, today)) return result;
  const unclear = new Set(result.unclear_fields);
  unclear.add("dispensed_date");
  return { ...result, dispensed_date: "", unclear_fields: Array.from(unclear) };
}
