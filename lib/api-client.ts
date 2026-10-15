import type {
  Medicine,
  DoseLogEntry,
  MissedReasonEntry,
  BPReading,
  BPTarget,
  CustomQuestion,
  RedirectedQuestion,
} from "@/lib/storage";

const BASE_URL = "";

export interface DeviceToken {
  token: string;
  role: "caregiver" | "senior";
  householdId: string;
}

const DEVICE_KEY = "tpb-device";

export function getDeviceToken(): DeviceToken | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEVICE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "token" in parsed &&
      "role" in parsed &&
      "householdId" in parsed &&
      typeof (parsed as Record<string, unknown>).token === "string" &&
      typeof (parsed as Record<string, unknown>).role === "string" &&
      typeof (parsed as Record<string, unknown>).householdId === "string"
    ) {
      return parsed as DeviceToken;
    }
    return null;
  } catch {
    return null;
  }
}

export function setDeviceToken(token: DeviceToken): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEVICE_KEY, JSON.stringify(token));
}

export function clearDeviceToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEVICE_KEY);
}

async function apiReq(
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; data: unknown }> {
  const token = getDeviceToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token.token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }
  return { status: res.status, data };
}

// ---------------------------------------------------------------------------
// Households
// ---------------------------------------------------------------------------

export async function createHousehold(
  displayName: string,
  language: string
): Promise<{ token: string; household: { id: string; display_name: string; language: string; is_demo: boolean } }> {
  const { status, data } = await apiReq("POST", "/api/v1/households", {
    displayName,
    language,
  });
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to create household");
  }
  return data as { token: string; household: { id: string; display_name: string; language: string; is_demo: boolean } };
}

export async function joinWithCode(code: string): Promise<{ token: string; role: string; household: { id: string } }> {
  const { status, data } = await apiReq("POST", "/api/v1/join", { code });
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Invalid or expired code.");
  }
  return data as { token: string; role: string; household: { id: string } };
}

export async function createDemo(): Promise<{ token: string; household: { id: string } }> {
  const { status, data } = await apiReq("POST", "/api/v1/demo");
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to create demo");
  }
  return data as { token: string; household: { id: string } };
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface RawState {
  household: {
    id: string;
    display_name: string;
    language: string;
    bp_target_systolic: number | null;
    bp_target_diastolic: number | null;
    is_demo: boolean;
    created_at: string;
  } | null;
  medicines: Array<{
    id: string;
    drug_name: string;
    strength: string;
    dose_per_time: string;
    times_per_day: number;
    time_slots: string[];
    food: Medicine["food"];
    special_instructions: string[];
    quantity_dispensed: number | null;
    dispensed_date: string | null;
    added_on: string;
    thumbnail: string | null;
    unclear_fields: string[];
    updated_at: string;
  }>;
  doseLogs: Array<{
    id: string;
    medicine_id: string;
    date: string;
    slot: string;
    taken_at: string;
  }>;
  missedReasons: Array<{
    id: string;
    medicine_id: string;
    reason: string;
    missed_count: number;
    recorded_on: string;
  }>;
  bpReadings: Array<{
    id: string;
    date: string;
    time: string;
    systolic: number;
    diastolic: number;
    pulse: number | null;
    created_at: string;
  }>;
  questions: Array<{
    id: string;
    kind: "redirected" | "custom";
    medicine_id: string | null;
    drug_name: string | null;
    text: string;
    asked_on: string;
    done: boolean;
  }>;
  devices: Array<{
    id: string;
    role: string;
    label: string | null;
    last_seen_at: string | null;
  }>;
}

export async function fetchState(): Promise<RawState> {
  const { status, data } = await apiReq("GET", "/api/v1/state");
  if (status !== 200) {
    throw new Error("Failed to fetch state");
  }
  return data as RawState;
}

// ---------------------------------------------------------------------------
// Medicines
// ---------------------------------------------------------------------------

export async function addMedicineApi(medicine: Omit<Medicine, "id" | "photo"> & { thumbnail?: string }): Promise<{ id: string }> {
  const { status, data } = await apiReq("POST", "/api/v1/medicines", {
    drugName: medicine.drug_name,
    strength: medicine.strength,
    dosePerTime: medicine.dose_per_time,
    timesPerDay: medicine.times_per_day,
    timeSlots: medicine.time_slots,
    food: medicine.food,
    specialInstructions: medicine.special_instructions,
    quantityDispensed: medicine.quantity_dispensed,
    dispensedDate: medicine.dispensed_date,
    thumbnail: (medicine as { thumbnail?: string }).thumbnail ?? null,
    unclearFields: medicine.unclear_fields,
  });
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to add medicine");
  }
  return (data as { medicine: { id: string } }).medicine;
}

export async function updateMedicineApi(id: string, medicine: Partial<Medicine>): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (medicine.drug_name !== undefined) payload.drugName = medicine.drug_name;
  if (medicine.strength !== undefined) payload.strength = medicine.strength;
  if (medicine.dose_per_time !== undefined) payload.dosePerTime = medicine.dose_per_time;
  if (medicine.times_per_day !== undefined) payload.timesPerDay = medicine.times_per_day;
  if (medicine.time_slots !== undefined) payload.timeSlots = medicine.time_slots;
  if (medicine.food !== undefined) payload.food = medicine.food;
  if (medicine.special_instructions !== undefined) payload.specialInstructions = medicine.special_instructions;
  if (medicine.quantity_dispensed !== undefined) payload.quantityDispensed = medicine.quantity_dispensed;
  if (medicine.dispensed_date !== undefined) payload.dispensedDate = medicine.dispensed_date;
  if ((medicine as { thumbnail?: string }).thumbnail !== undefined) payload.thumbnail = (medicine as { thumbnail?: string }).thumbnail;
  if (medicine.unclear_fields !== undefined) payload.unclearFields = medicine.unclear_fields;

  const { status, data } = await apiReq("PUT", `/api/v1/medicines/${id}`, payload);
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to update medicine");
  }
}

export async function deleteMedicineApi(id: string): Promise<void> {
  const { status, data } = await apiReq("DELETE", `/api/v1/medicines/${id}`);
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to delete medicine");
  }
}

// ---------------------------------------------------------------------------
// Doses
// ---------------------------------------------------------------------------

export async function markDoseApi(medicineId: string, date: string, slot: string): Promise<void> {
  const { status, data } = await apiReq("POST", "/api/v1/doses", { medicineId, date, slot });
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to mark dose");
  }
}

export async function unmarkDoseApi(medicineId: string, date: string, slot: string): Promise<void> {
  const { status, data } = await apiReq("DELETE", "/api/v1/doses", { medicineId, date, slot });
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to unmark dose");
  }
}

// ---------------------------------------------------------------------------
// Missed reasons
// ---------------------------------------------------------------------------

export async function recordMissedReasonApi(entry: MissedReasonEntry): Promise<void> {
  const { status, data } = await apiReq("POST", "/api/v1/missed-reasons", {
    medicineId: entry.medicineId,
    reason: entry.reason,
    missedCount: entry.missedCount,
    recordedOn: entry.recordedOn,
  });
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to record reason");
  }
}

// ---------------------------------------------------------------------------
// BP readings
// ---------------------------------------------------------------------------

export async function addBPReadingApi(reading: Omit<BPReading, "id">): Promise<{ id: string }> {
  const { status, data } = await apiReq("POST", "/api/v1/bp-readings", {
    date: reading.date,
    time: reading.time,
    systolic: reading.systolic,
    diastolic: reading.diastolic,
    pulse: reading.pulse,
  });
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to add BP reading");
  }
  return (data as { bpReading: { id: string } }).bpReading;
}

export async function deleteBPReadingApi(id: string): Promise<void> {
  const { status, data } = await apiReq("DELETE", `/api/v1/bp-readings/${id}`);
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to delete BP reading");
  }
}

export async function setBPTargetApi(target: BPTarget): Promise<void> {
  const { status, data } = await apiReq("PUT", "/api/v1/bp-target", target);
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to set BP target");
  }
}

export async function clearBPTargetApi(): Promise<void> {
  const { status, data } = await apiReq("PUT", "/api/v1/bp-target", { systolic: null, diastolic: null });
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to clear BP target");
  }
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export async function addQuestionApi(text: string, askedOn?: string): Promise<{ id: string }> {
  const { status, data } = await apiReq("POST", "/api/v1/questions", {
    kind: "custom",
    text,
    askedOn: askedOn || new Date().toISOString().slice(0, 10),
  });
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to add question");
  }
  return (data as { question: { id: string } }).question;
}

export async function addRedirectedQuestionApi(entry: {
  medicineId: string;
  drugName: string;
  text: string;
  askedOn: string;
}): Promise<{ id: string }> {
  const { status, data } = await apiReq("POST", "/api/v1/questions", {
    kind: "redirected",
    medicineId: entry.medicineId,
    drugName: entry.drugName,
    text: entry.text,
    askedOn: entry.askedOn,
  });
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to add question");
  }
  return (data as { question: { id: string } }).question;
}

export async function toggleQuestionDoneApi(id: string, done: boolean): Promise<void> {
  const { status, data } = await apiReq("PUT", `/api/v1/questions/${id}`, { done });
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to update question");
  }
}

export async function deleteQuestionApi(id: string): Promise<void> {
  const { status, data } = await apiReq("DELETE", `/api/v1/questions/${id}`);
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to delete question");
  }
}

// ---------------------------------------------------------------------------
// Household
// ---------------------------------------------------------------------------

export async function updateHouseholdApi(data: { displayName?: string; language?: string }): Promise<void> {
  const { status, data: resData } = await apiReq("PUT", "/api/v1/household", data);
  if (status !== 200) {
    throw new Error((resData as { error?: string })?.error || "Failed to update household");
  }
}

// ---------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------

export async function unlinkDeviceApi(id: string): Promise<void> {
  const { status, data } = await apiReq("DELETE", `/api/v1/devices/${id}`);
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to unlink device");
  }
}

// ---------------------------------------------------------------------------
// Pairing codes
// ---------------------------------------------------------------------------

export async function createPairingCodeApi(role: "caregiver" | "senior"): Promise<{
  shortCode: string;
  joinUrl: string;
  shortExpiresAt: string;
  longExpiresAt: string;
}> {
  const { status, data } = await apiReq("POST", "/api/v1/pairing-codes", { role });
  if (status !== 200) {
    throw new Error((data as { error?: string })?.error || "Failed to create pairing code");
  }
  return data as { shortCode: string; joinUrl: string; shortExpiresAt: string; longExpiresAt: string };
}
