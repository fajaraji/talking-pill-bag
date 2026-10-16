"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type {
  Medicine,
  DoseLogEntry,
  MissedReasonEntry,
  BPReading,
  BPTarget,
  CustomQuestion,
  RedirectedQuestion,
} from "@/lib/storage";
import {
  getDeviceToken,
  setDeviceToken,
  fetchState,
  type DeviceToken,
  addMedicineApi,
  updateMedicineApi,
  deleteMedicineApi,
  markDoseApi,
  unmarkDoseApi,
  recordMissedReasonApi,
  addBPReadingApi,
  deleteBPReadingApi,
  setBPTargetApi,
  clearBPTargetApi,
  addQuestionApi,
  addRedirectedQuestionApi,
  toggleQuestionDoneApi,
  deleteQuestionApi,
  updateHouseholdApi,
  unlinkDeviceApi,
  updateDeviceLabelApi,
  createPairingCodeApi,
  createDemo,
  joinWithCode,
  createHousehold,
  regenerateRecoveryCodeApi,
  type RawState,
} from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Normalized state shape (matches what existing pages expect)
// ---------------------------------------------------------------------------

export interface AppState {
  household: {
    id: string;
    displayName: string;
    language: string;
    bpTarget: BPTarget | null;
    isDemo: boolean;
  } | null;
  medicines: Medicine[];
  doseLogs: DoseLogEntry[];
  missedReasons: MissedReasonEntry[];
  bpReadings: BPReading[];
  customQuestions: CustomQuestion[];
  redirectedQuestions: RedirectedQuestion[];
  doneQuestionIds: string[];
  devices: Array<{ id: string; role: string; label: string | null; lastSeenAt: string | null; isCurrent: boolean }>;
  role: "caregiver" | "senior" | null;
  loading: boolean;
  syncError: string | null;
  isHydrated: boolean;
}

interface StoreContextValue {
  state: AppState;
  refresh: () => Promise<void>;
  dismissError: () => void;
  isAuthenticated: boolean;
  isHydrated: boolean;
  // Onboarding
  setupHousehold: (displayName: string, language: string) => Promise<void>;
  joinHousehold: (code: string, name?: string) => Promise<void>;
  loadDemo: () => Promise<void>;
  logout: () => void;
  // Actions
  actions: {
    addMedicine: (medicine: Omit<Medicine, "id" | "photo"> & { thumbnail?: string }) => Promise<string>;
    updateMedicine: (medicine: Medicine) => Promise<void>;
    deleteMedicine: (id: string) => Promise<void>;
    markDose: (medicineId: string, date: string, slot: string) => Promise<void>;
    unmarkDose: (medicineId: string, date: string, slot: string) => Promise<void>;
    recordMissedReason: (entry: MissedReasonEntry) => Promise<void>;
    addBPReading: (reading: Omit<BPReading, "id">) => Promise<string>;
    deleteBPReading: (id: string) => Promise<void>;
    setBPTarget: (target: BPTarget) => Promise<void>;
    clearBPTarget: () => Promise<void>;
    addCustomQuestion: (text: string) => Promise<void>;
    deleteCustomQuestion: (id: string) => Promise<void>;
    saveRedirectedQuestion: (entry: RedirectedQuestion) => Promise<void>;
    toggleDoneQuestion: (id: string) => Promise<void>;
    updateHousehold: (data: { displayName?: string; language?: string }) => Promise<void>;
    unlinkDevice: (id: string) => Promise<void>;
    createPairingCode: (role: "caregiver" | "senior", label?: string) => Promise<{ shortCode: string; joinUrl: string; shortExpiresAt: string; longExpiresAt: string }>;
    updateDeviceLabel: (id: string, label: string) => Promise<void>;
    regenerateRecoveryCode: () => Promise<{ recoveryCode: string }>;
  };
}

const StoreContext = createContext<StoreContextValue | null>(null);

function normalizeState(raw: RawState, role: string | null): AppState {
  const household = raw.household
    ? {
        id: raw.household.id,
        displayName: raw.household.display_name,
        language: raw.household.language,
        bpTarget:
          raw.household.bp_target_systolic != null &&
          raw.household.bp_target_diastolic != null
            ? {
                systolic: raw.household.bp_target_systolic,
                diastolic: raw.household.bp_target_diastolic,
              }
            : null,
        isDemo: raw.household.is_demo,
      }
    : null;

  const medicines: Medicine[] = raw.medicines.map((m) => ({
    id: m.id,
    readable: true,
    confidence: 1,
    drug_name: m.drug_name,
    strength: m.strength,
    dose_per_time: m.dose_per_time,
    times_per_day: m.times_per_day,
    time_slots: m.time_slots as ("morning" | "afternoon" | "evening" | "bedtime")[],
    food: m.food,
    special_instructions: m.special_instructions,
    quantity_dispensed: m.quantity_dispensed ?? 0,
    dispensed_date: m.dispensed_date ?? "",
    unclear_fields: m.unclear_fields,
    photo: m.thumbnail ?? "",
    addedOn: m.added_on,
  }));

  const doseLogs: DoseLogEntry[] = raw.doseLogs.map((d) => ({
    medicineId: d.medicine_id,
    date: d.date,
    slot: d.slot,
    takenAt: d.taken_at,
    takenByDevice: d.taken_by_device ?? null,
    takenByLabel: d.taken_by_label ?? null,
  }));

  const missedReasons: MissedReasonEntry[] = raw.missedReasons.map((r) => ({
    medicineId: r.medicine_id,
    reason: r.reason,
    missedCount: r.missed_count,
    recordedOn: r.recorded_on,
  }));

  const bpReadings: BPReading[] = raw.bpReadings.map((r) => ({
    id: r.id,
    date: r.date,
    time: r.time,
    systolic: r.systolic,
    diastolic: r.diastolic,
    pulse: r.pulse,
  }));

  const customQuestions: CustomQuestion[] = raw.questions
    .filter((q) => q.kind === "custom")
    .map((q) => ({
      id: q.id,
      text: q.text,
      addedOn: q.asked_on,
    }));

  const redirectedQuestions: RedirectedQuestion[] = raw.questions
    .filter((q) => q.kind === "redirected")
    .map((q) => ({
      medicineId: q.medicine_id ?? "unknown",
      drugName: q.drug_name ?? "Unknown",
      question: q.text,
      askedOn: q.asked_on,
    }));

  const doneQuestionIds = raw.questions
    .filter((q) => q.done)
    .map((q) => q.id);

  const devices = raw.devices.map((d) => ({
    id: d.id,
    role: d.role,
    label: d.label,
    lastSeenAt: d.last_seen_at,
    isCurrent: d.is_current,
  }));

  return {
    household,
    medicines,
    doseLogs,
    missedReasons,
    bpReadings,
    customQuestions,
    redirectedQuestions,
    doneQuestionIds,
    devices,
    role: role as "caregiver" | "senior" | null,
    loading: false,
    syncError: null,
    isHydrated: true,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    household: null,
    medicines: [],
    doseLogs: [],
    missedReasons: [],
    bpReadings: [],
    customQuestions: [],
    redirectedQuestions: [],
    doneQuestionIds: [],
    devices: [],
    role: null,
    loading: true,
    syncError: null,
    isHydrated: false,
  });

  // Token is read only inside effects so that the server render and the
  // first client render match (localStorage is not touched during render).
  const [authToken, setAuthToken] = useState<DeviceToken | null>(null);

  const lastFailedAction = useRef<(() => Promise<void>) | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAuthenticated = !!authToken;

  const load = useCallback(async () => {
    if (!getDeviceToken()) {
      setState((s) => ({ ...s, isHydrated: true, loading: false }));
      return;
    }
    try {
      setState((s) => ({ ...s, loading: true }));
      const raw = await fetchState();
      const normalized = normalizeState(raw, getDeviceToken()?.role ?? null);
      setState((s) => ({ ...s, ...normalized, loading: false, syncError: null, isHydrated: true }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      setState((s) => ({ ...s, loading: false, syncError: message, isHydrated: true }));
    }
  }, []);

  // Initial load + periodic refresh
  useEffect(() => {
    setAuthToken(getDeviceToken());
    load();

    // Refresh every 60s while visible
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        load();
      }
    }, 60_000);

    // Refresh on window focus
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const dismissError = useCallback(() => {
    setState((s) => ({ ...s, syncError: null }));
  }, []);

  const withOptimistic = useCallback(
    async <T,>(
      optimistic: (prev: AppState) => AppState,
      apiCall: () => Promise<T>,
      rollback: (prev: AppState) => AppState
    ): Promise<T> => {
      let previousState = state;
      setState((s) => {
        previousState = s;
        return optimistic(s);
      });
      try {
        const result = await apiCall();
        setState((s) => ({ ...s, syncError: null }));
        lastFailedAction.current = null;
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Couldn't save. Check your connection and try again.";
        setState((s) => ({ ...rollback(s), syncError: message }));
        lastFailedAction.current = async () => {
          await apiCall();
          await load();
        };
        throw err;
      }
    },
    [state, load]
  );

  const setupHousehold = useCallback(
    async (displayName: string, language: string) => {
      const res = await createHousehold(displayName, language);
      const token: DeviceToken = { token: res.token, role: "caregiver", householdId: res.household.id };
      setDeviceToken(token);
      setAuthToken(token);
      // Keep the one-time recovery code until the caregiver has seen it.
      if (res.recoveryCode && typeof window !== "undefined") {
        localStorage.setItem("tpb-recovery-code", res.recoveryCode);
      }
      await load();
    },
    [load]
  );

  const joinHousehold = useCallback(
    async (code: string, name?: string) => {
      const res = await joinWithCode(code, name);
      const token: DeviceToken = { token: res.token, role: res.role as "caregiver" | "senior", householdId: res.household.id };
      setDeviceToken(token);
      setAuthToken(token);
      await load();
    },
    [load]
  );

  const loadDemo = useCallback(async () => {
    const res = await createDemo();
    const token: DeviceToken = { token: res.token, role: "caregiver", householdId: res.household.id };
    setDeviceToken(token);
    setAuthToken(token);
    await load();
  }, [load]);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tpb-device");
      window.location.reload();
    }
  }, []);

  const addMedicine = useCallback(
    async (medicine: Omit<Medicine, "id" | "photo"> & { thumbnail?: string }) => {
      const id = await withOptimistic(
        (prev) => prev,
        () => addMedicineApi(medicine),
        (prev) => prev
      );
      await load();
      return id.id;
    },
    [withOptimistic, load]
  );

  const updateMedicine = useCallback(
    async (medicine: Medicine) => {
      await withOptimistic(
        (prev) => ({
          ...prev,
          medicines: prev.medicines.map((m) => (m.id === medicine.id ? medicine : m)),
        }),
        () => updateMedicineApi(medicine.id, medicine),
        (prev) => prev
      );
      await load();
    },
    [withOptimistic, load]
  );

  const deleteMedicine = useCallback(
    async (id: string) => {
      const removed = state.medicines.find((m) => m.id === id);
      await withOptimistic(
        (prev) => ({
          ...prev,
          medicines: prev.medicines.filter((m) => m.id !== id),
        }),
        () => deleteMedicineApi(id),
        (prev) => (removed ? { ...prev, medicines: [...prev.medicines, removed] } : prev)
      );
      await load();
    },
    [withOptimistic, load, state.medicines]
  );

  const markDose = useCallback(
    async (medicineId: string, date: string, slot: string) => {
      const entry: DoseLogEntry = {
        medicineId,
        date,
        slot,
        takenAt: new Date().toISOString(),
      };
      await withOptimistic(
        (prev) => ({
          ...prev,
          doseLogs: [...prev.doseLogs, entry],
        }),
        () => markDoseApi(medicineId, date, slot),
        (prev) => ({
          ...prev,
          doseLogs: prev.doseLogs.filter(
            (d) => !(d.medicineId === medicineId && d.date === date && d.slot === slot)
          ),
        })
      );
      await load();
    },
    [withOptimistic, load]
  );

  const unmarkDose = useCallback(
    async (medicineId: string, date: string, slot: string) => {
      const removed = state.doseLogs.find(
        (d) => d.medicineId === medicineId && d.date === date && d.slot === slot
      );
      await withOptimistic(
        (prev) => ({
          ...prev,
          doseLogs: prev.doseLogs.filter(
            (d) => !(d.medicineId === medicineId && d.date === date && d.slot === slot)
          ),
        }),
        () => unmarkDoseApi(medicineId, date, slot),
        (prev) => (removed ? { ...prev, doseLogs: [...prev.doseLogs, removed] } : prev)
      );
      await load();
    },
    [withOptimistic, load, state.doseLogs]
  );

  const recordMissedReason = useCallback(
    async (entry: MissedReasonEntry) => {
      await withOptimistic(
        (prev) => ({
          ...prev,
          missedReasons: [...prev.missedReasons, entry],
        }),
        () => recordMissedReasonApi(entry),
        (prev) => prev
      );
      await load();
    },
    [withOptimistic, load]
  );

  const addBPReading = useCallback(
    async (reading: Omit<BPReading, "id">) => {
      const id = await withOptimistic(
        (prev) => prev,
        () => addBPReadingApi(reading),
        (prev) => prev
      );
      await load();
      return id.id;
    },
    [withOptimistic, load]
  );

  const deleteBPReading = useCallback(
    async (id: string) => {
      const removed = state.bpReadings.find((r) => r.id === id);
      await withOptimistic(
        (prev) => ({
          ...prev,
          bpReadings: prev.bpReadings.filter((r) => r.id !== id),
        }),
        () => deleteBPReadingApi(id),
        (prev) => (removed ? { ...prev, bpReadings: [...prev.bpReadings, removed] } : prev)
      );
      await load();
    },
    [withOptimistic, load, state.bpReadings]
  );

  const setBPTarget = useCallback(
    async (target: BPTarget) => {
      await withOptimistic(
        (prev) => ({
          ...prev,
          household: prev.household ? { ...prev.household, bpTarget: target } : null,
        }),
        () => setBPTargetApi(target),
        (prev) => prev
      );
      await load();
    },
    [withOptimistic, load]
  );

  const clearBPTarget = useCallback(async () => {
    await withOptimistic(
      (prev) => ({
        ...prev,
        household: prev.household ? { ...prev.household, bpTarget: null } : null,
      }),
      () => clearBPTargetApi(),
      (prev) => prev
    );
    await load();
  }, [withOptimistic, load]);

  const addCustomQuestion = useCallback(
    async (text: string) => {
      await withOptimistic(
        (prev) => prev,
        () => addQuestionApi(text),
        (prev) => prev
      );
      await load();
    },
    [withOptimistic, load]
  );

  const deleteCustomQuestion = useCallback(
    async (id: string) => {
      await withOptimistic(
        (prev) => ({
          ...prev,
          customQuestions: prev.customQuestions.filter((q) => q.id !== id),
        }),
        () => deleteQuestionApi(id),
        (prev) => prev
      );
      await load();
    },
    [withOptimistic, load]
  );

  const saveRedirectedQuestion = useCallback(
    async (entry: RedirectedQuestion) => {
      await withOptimistic(
        (prev) => prev,
        () =>
          addRedirectedQuestionApi({
            medicineId: entry.medicineId,
            drugName: entry.drugName,
            text: entry.question,
            askedOn: entry.askedOn,
          }),
        (prev) => prev
      );
      await load();
    },
    [withOptimistic, load]
  );

  const toggleDoneQuestion = useCallback(
    async (id: string) => {
      const currentlyDone = state.doneQuestionIds.includes(id);
      await withOptimistic(
        (prev) => ({
          ...prev,
          doneQuestionIds: currentlyDone
            ? prev.doneQuestionIds.filter((d) => d !== id)
            : [...prev.doneQuestionIds, id],
        }),
        () => toggleQuestionDoneApi(id, !currentlyDone),
        (prev) => prev
      );
      await load();
    },
    [withOptimistic, load, state.doneQuestionIds]
  );

  const updateHouseholdAction = useCallback(
    async (data: { displayName?: string; language?: string }) => {
      await withOptimistic(
        (prev) => ({
          ...prev,
          household: prev.household ? { ...prev.household, ...data } : null,
        }),
        () => updateHouseholdApi(data),
        (prev) => prev
      );
      await load();
    },
    [withOptimistic, load]
  );

  const unlinkDeviceAction = useCallback(
    async (id: string) => {
      await withOptimistic(
        (prev) => ({
          ...prev,
          devices: prev.devices.filter((d) => d.id !== id),
        }),
        () => unlinkDeviceApi(id),
        (prev) => prev
      );
      await load();
    },
    [withOptimistic, load]
  );

  const createPairingCodeAction = useCallback(
    async (role: "caregiver" | "senior", label?: string) => {
      return createPairingCodeApi(role, label);
    },
    []
  );

  const updateDeviceLabelAction = useCallback(
    async (id: string, label: string) => {
      await withOptimistic(
        (prev) => ({
          ...prev,
          devices: prev.devices.map((d) => (d.id === id ? { ...d, label } : d)),
        }),
        () => updateDeviceLabelApi(id, label),
        (prev) => prev
      );
      await load();
    },
    [withOptimistic, load]
  );

  const regenerateRecoveryCode = useCallback(async () => {
    return regenerateRecoveryCodeApi();
  }, []);

  const retry = useCallback(async () => {
    if (lastFailedAction.current) {
      setState((s) => ({ ...s, syncError: null }));
      try {
        await lastFailedAction.current();
        lastFailedAction.current = null;
      } catch {
        // error remains
      }
    }
  }, []);

  const value: StoreContextValue = {
    state,
    refresh: load,
    dismissError,
    isAuthenticated,
    isHydrated: state.isHydrated,
    setupHousehold,
    joinHousehold,
    loadDemo,
    logout,
    actions: {
      addMedicine,
      updateMedicine,
      deleteMedicine,
      markDose,
      unmarkDose,
      recordMissedReason,
      addBPReading,
      deleteBPReading,
      setBPTarget,
      clearBPTarget,
      addCustomQuestion,
      deleteCustomQuestion,
      saveRedirectedQuestion,
      toggleDoneQuestion,
      updateHousehold: updateHouseholdAction,
      unlinkDevice: unlinkDeviceAction,
      createPairingCode: createPairingCodeAction,
      updateDeviceLabel: updateDeviceLabelAction,
      regenerateRecoveryCode,
    },
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
      {state.syncError && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-red-600 px-4 py-3 text-white">
          <div className="mx-auto flex max-w-sm items-center justify-between gap-3">
            <p className="text-base font-medium">{state.syncError}</p>
            <button
              onClick={() => {
                dismissError();
                retry();
              }}
              className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-600"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return ctx;
}
