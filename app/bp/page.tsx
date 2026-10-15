"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  type Language,
  languages,
  defaultLanguage,
  t,
} from "@/lib/i18n";
import { getToday, getNow } from "@/lib/clock";
import { resizeImage } from "@/lib/image";
import { useStore } from "@/lib/store";
import { LoadingShell } from "@/app/loading-shell";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { AlertIcon, CameraIcon, LineIcon, UploadIcon } from "@/components/icons";

type View = "main" | "add" | "confirm";

function formatDateShort(lang: Language, dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  switch (lang) {
    case "zh":
      return `${m}/${d}`;
    case "ms":
    case "id":
      return `${d}/${m}`;
    default:
      return `${d}/${m}`;
  }
}

// ---------------------------------------------------------------------------
// SVG line chart
// ---------------------------------------------------------------------------
function BPChart({
  data,
  target,
  lang,
}: {
  data: Array<{ date: string; systolic: number | null; diastolic: number | null }>;
  target: { systolic: number; diastolic: number } | null;
  lang: Language;
}) {
  const width = 340;
  const height = 220;
  const left = 44;
  const right = 12;
  const top = 16;
  const bottom = 36;
  const plotW = width - left - right;
  const plotH = height - top - bottom;

  const values = data
    .flatMap((d) => [d.systolic, d.diastolic])
    .filter((v): v is number => v !== null);

  if (values.length === 0) {
    return (
      <Card className="flex h-48 items-center justify-center">
        <p className="text-lg text-muted">{t(lang, "noReadingsYet")}</p>
      </Card>
    );
  }

  const yMinRaw = Math.min(...values, target?.diastolic ?? Infinity) - 10;
  const yMaxRaw = Math.max(...values, target?.systolic ?? -Infinity) + 10;
  const yMin = Math.max(0, Math.floor(yMinRaw / 10) * 10);
  const yMax = Math.ceil(yMaxRaw / 10) * 10;
  const yRange = yMax - yMin || 1;

  const toX = (i: number) => left + (i / (data.length - 1)) * plotW;
  const toY = (val: number) => top + plotH - ((val - yMin) / yRange) * plotH;

  const yTicks = [0, 1, 2, 3].map((i) => yMin + (i * yRange) / 3);

  let systolicPath = "";
  let diastolicPath = "";
  data.forEach((d, i) => {
    const x = toX(i);
    if (d.systolic !== null) {
      const y = toY(d.systolic);
      systolicPath += systolicPath ? ` L ${x} ${y}` : `M ${x} ${y}`;
    }
    if (d.diastolic !== null) {
      const y = toY(d.diastolic);
      diastolicPath += diastolicPath ? ` L ${x} ${y}` : `M ${x} ${y}`;
    }
  });

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxWidth: 380 }}
        role="img"
        aria-label={t(lang, "trend14Days")}
      >
        <rect x={left} y={top} width={plotW} height={plotH} fill="#F8FAF9" rx={4} />
        {yTicks.map((val, i) => {
          const y = toY(val);
          return (
            <g key={i}>
              <line x1={left} y1={y} x2={left + plotW} y2={y} stroke="#E2E8F0" strokeWidth={1} />
              <text x={left - 6} y={y + 4} textAnchor="end" fontSize={12} fill="#475569">
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {target && (
          <>
            <line x1={left} y1={toY(target.systolic)} x2={left + plotW} y2={toY(target.systolic)} stroke="#475569" strokeWidth={2} strokeDasharray="6 4" />
            <text x={left + 4} y={toY(target.systolic) - 4} fontSize={10} fill="#475569">
              {target.systolic}
            </text>
          </>
        )}

        {systolicPath && <path d={systolicPath} fill="none" stroke="#B91C1C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
        {diastolicPath && <path d={diastolicPath} fill="none" stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}

        {data.map((d, i) => {
          const x = toX(i);
          return (
            <g key={d.date}>
              {d.systolic !== null && <circle cx={x} cy={toY(d.systolic)} r={4} fill="#B91C1C" stroke="white" strokeWidth={1.5} />}
              {d.diastolic !== null && <circle cx={x} cy={toY(d.diastolic)} r={4} fill="#0F766E" stroke="white" strokeWidth={1.5} />}
            </g>
          );
        })}

        {(() => {
          const indices: number[] = [];
          const n = data.length;
          if (n <= 5) {
            for (let i = 0; i < n; i++) indices.push(i);
          } else {
            const step = (n - 1) / 4;
            for (let i = 0; i < 5; i++) {
              const idx = Math.round(i * step);
              if (!indices.includes(idx)) indices.push(idx);
            }
          }
          return indices.map((i) => (
            <text key={`x-${data[i].date}`} x={toX(i)} y={top + plotH + 18} textAnchor="middle" fontSize={11} fill="#475569">
              {formatDateShort(lang, data[i].date)}
            </text>
          ));
        })()}
      </svg>

      <div className="flex flex-wrap items-center gap-4">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted">
          <LineIcon className="h-4 w-4 text-danger-text" />
          {t(lang, "systolic")}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted">
          <LineIcon className="h-4 w-4 text-primary" />
          {t(lang, "diastolic")}
        </span>
        {target && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <span className="inline-block h-0 w-4 border-t-2 border-dashed border-muted" />
            {t(lang, "targetFromDoctor")}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BP page
// ---------------------------------------------------------------------------
export default function BPPage() {
  const { isHydrated } = useStore();

  // Neutral loading shell until hydrated; the inner component holds all
  // other hooks so their order never changes between renders.
  if (!isHydrated) {
    return <LoadingShell />;
  }
  return <BPPageInner />;
}

function BPPageInner() {
  const router = useRouter();
  const { state, actions } = useStore();
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [view, setView] = useState<View>("main");
  const [today, setToday] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [photo, setPhoto] = useState<string | null>(null);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [bpError, setBpError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showTargetForm, setShowTargetForm] = useState(false);
  const [targetSys, setTargetSys] = useState("");
  const [targetDia, setTargetDia] = useState("");

  const isSenior = state.role === "senior";

  useEffect(() => {
    const stored = localStorage.getItem("tpb-lang") as Language | null;
    if (stored && languages.some((l) => l.code === stored)) {
      setLang(stored);
      document.documentElement.lang = stored;
    }
    setToday(getToday());
    setIsLoading(false);
  }, []);

  const readings = state.bpReadings;
  const target = state.household?.bpTarget ?? null;

  const chartData = useMemo(() => {
    if (!today) return [];
    const days: Array<{ date: string; systolic: number | null; diastolic: number | null }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today + "T00:00:00");
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      days.push({ date: `${y}-${m}-${day}`, systolic: null, diastolic: null });
    }

    const dailySums: Record<string, { sys: number; dia: number; count: number }> = {};
    for (const r of readings) {
      if (!dailySums[r.date]) dailySums[r.date] = { sys: 0, dia: 0, count: 0 };
      dailySums[r.date].sys += r.systolic;
      dailySums[r.date].dia += r.diastolic;
      dailySums[r.date].count += 1;
    }

    return days.map((d) => {
      const s = dailySums[d.date];
      if (!s || s.count === 0) return d;
      return {
        date: d.date,
        systolic: Math.round(s.sys / s.count),
        diastolic: Math.round(s.dia / s.count),
      };
    });
  }, [readings, today]);

  const summary = useMemo(() => {
    if (!today || readings.length === 0) return null;
    const cutoff = new Date(today + "T00:00:00");
    cutoff.setDate(cutoff.getDate() - 6);
    const y = cutoff.getFullYear();
    const m = String(cutoff.getMonth() + 1).padStart(2, "0");
    const d = String(cutoff.getDate()).padStart(2, "0");
    const cutoffStr = `${y}-${m}-${d}`;

    const weekReadings = readings.filter((r) => r.date >= cutoffStr);
    if (weekReadings.length === 0) return null;

    const avgSys = Math.round(weekReadings.reduce((sum, r) => sum + r.systolic, 0) / weekReadings.length);
    const avgDia = Math.round(weekReadings.reduce((sum, r) => sum + r.diastolic, 0) / weekReadings.length);

    let aboveTargetDays = 0;
    let daysWithReadings = 0;
    if (target) {
      const daily: Record<string, { sys: number; dia: number; count: number }> = {};
      for (const r of weekReadings) {
        if (!daily[r.date]) daily[r.date] = { sys: 0, dia: 0, count: 0 };
        daily[r.date].sys += r.systolic;
        daily[r.date].dia += r.diastolic;
        daily[r.date].count += 1;
      }
      for (const date of Object.keys(daily)) {
        daysWithReadings++;
        const avgSysDay = daily[date].sys / daily[date].count;
        const avgDiaDay = daily[date].dia / daily[date].count;
        if (avgSysDay > target.systolic || avgDiaDay > target.diastolic) {
          aboveTargetDays++;
        }
      }
    }

    return {
      avgText: `${avgSys}/${avgDia}`,
      aboveTargetDays,
      daysWithReadings,
    };
  }, [readings, today, target]);

  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;
  const isVeryHigh = latestReading
    ? latestReading.systolic >= 180 || latestReading.diastolic >= 120
    : false;

  function resetForm() {
    setPhoto(null);
    setSystolic("");
    setDiastolic("");
    setPulse("");
    setBpError(false);
    setAnalyzing(false);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const resized = await resizeImage(file, 1280, 0.8);
      setPhoto(resized.dataUrl);
      setAnalyzing(true);
      setBpError(false);

      const res = await fetch("/api/read-bp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: resized.dataUrl }),
      });
      const data = (await res.json()) as {
        result?: { systolic: number; diastolic: number; pulse: number | null };
        error?: string;
        rejected?: boolean;
      };

      if (!res.ok || data.rejected) {
        setBpError(true);
        setSystolic("");
        setDiastolic("");
        setPulse("");
      } else if (data.result) {
        setSystolic(String(data.result.systolic));
        setDiastolic(String(data.result.diastolic));
        setPulse(data.result.pulse !== null && data.result.pulse !== undefined ? String(data.result.pulse) : "");
      }
      setView("confirm");
    } catch {
      setBpError(true);
      setView("confirm");
    } finally {
      setAnalyzing(false);
    }
  }

  function openCamera() {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
      fileInputRef.current.click();
    }
  }

  function openGallery() {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  }

  function handleManualEntry() {
    resetForm();
    setView("confirm");
  }

  async function handleSave() {
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    const pul = pulse ? parseInt(pulse, 10) : null;

    if (
      Number.isNaN(sys) ||
      Number.isNaN(dia) ||
      sys < 60 ||
      sys > 260 ||
      dia < 30 ||
      dia > 160 ||
      sys <= dia
    ) {
      return;
    }
    if (pul !== null && (pul < 30 || pul > 220)) {
      return;
    }

    const now = getNow();
    const h = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");

    await actions.addBPReading({
      date: today,
      time: `${h}:${min}`,
      systolic: sys,
      diastolic: dia,
      pulse: pul,
    });
    resetForm();
    setView("main");
  }

  async function handleDelete(id: string) {
    if (typeof window !== "undefined" && window.confirm(t(lang, "delete"))) {
      await actions.deleteBPReading(id);
    }
  }

  async function handleSetTarget() {
    const sys = parseInt(targetSys, 10);
    const dia = parseInt(targetDia, 10);
    if (
      !Number.isNaN(sys) &&
      !Number.isNaN(dia) &&
      sys >= 60 &&
      sys <= 260 &&
      dia >= 30 &&
      dia <= 160 &&
      sys > dia
    ) {
      await actions.setBPTarget({ systolic: sys, diastolic: dia });
      setShowTargetForm(false);
      setTargetSys("");
      setTargetDia("");
    }
  }

  async function handleClearTarget() {
    await actions.clearBPTarget();
  }

  if (view === "add") {
    return (
      <main className="flex min-h-screen flex-col gap-6 bg-page px-4 py-6">
        <div className="flex w-full max-w-sm flex-col gap-2 self-center">
          <AppHeader
            title={t(lang, "addBPReading")}
            back={{ label: t(lang, "back"), onClick: () => { resetForm(); setView("main"); } }}
          />
        </div>

        <div className="flex w-full max-w-sm flex-col gap-4 self-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button variant="primary" className="w-full" onClick={openCamera}>
            <CameraIcon className="h-5 w-5" />
            {t(lang, "takePhoto")}
          </Button>
          <Button variant="secondary" className="w-full" onClick={openGallery}>
            <UploadIcon className="h-5 w-5" />
            {t(lang, "uploadPhoto")}
          </Button>
          <Button variant="secondary" className="w-full" onClick={handleManualEntry}>
            {t(lang, "enterManually")}
          </Button>
        </div>
      </main>
    );
  }

  if (view === "confirm") {
    return (
      <main className="flex min-h-screen flex-col gap-6 bg-page px-4 py-6">
        <div className="flex w-full max-w-sm flex-col gap-2 self-center">
          <AppHeader
            title={t(lang, "confirm")}
            back={{ label: t(lang, "back"), onClick: () => { resetForm(); setView("main"); } }}
          />
        </div>

        {analyzing && (
          <div className="flex w-full max-w-sm flex-col items-center gap-3 self-center py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-primary" />
            <p className="text-lg text-muted">{t(lang, "analyzing")}</p>
          </div>
        )}

        {bpError && !analyzing && (
          <Card className="w-full max-w-sm self-center text-center">
            <p className="flex items-start justify-center gap-2 text-lg font-semibold text-attention-text">
              <AlertIcon className="h-6 w-6 shrink-0" />
              {t(lang, "bpCouldNotRead")}
            </p>
          </Card>
        )}

        {!analyzing && (
          <div className="flex w-full max-w-sm flex-col gap-6 self-center">
            {photo && (
              <div className="overflow-hidden rounded-xl border border-line">
                <img src={photo} alt="BP monitor" className="w-full object-contain" />
              </div>
            )}

            <p className="text-lg text-ink">{t(lang, "bpConfirmPrompt")}</p>

            <Card className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-base font-semibold text-ink">{t(lang, "systolic")}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="rounded-xl border border-line bg-white px-4 py-3 text-2xl font-bold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="120"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-base font-semibold text-ink">{t(lang, "diastolic")}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="rounded-xl border border-line bg-white px-4 py-3 text-2xl font-bold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="80"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-base font-semibold text-ink">{t(lang, "pulse")}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="rounded-xl border border-line bg-white px-4 py-3 text-2xl font-bold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="72"
                />
              </div>
            </Card>

            <div className="flex flex-col gap-3 pt-2">
              <Button variant="success" className="w-full" onClick={handleSave}>
                {t(lang, "save")}
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => { resetForm(); setView("main"); }}
              >
                {t(lang, "cancel")}
              </Button>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-page px-4 py-6">
      <div className="flex w-full max-w-sm flex-col gap-2 self-center">
        <AppHeader
          title={t(lang, "bpTitle")}
          back={{ label: t(lang, "back"), onClick: () => router.push("/") }}
        />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4 self-center">
        <Button variant="primary" className="w-full" onClick={() => setView("add")}>
          {t(lang, "addBPReading")}
        </Button>
      </div>

      {/* Target section (caregiver only) */}
      {!isSenior && (
        <Card className="w-full max-w-sm self-center">
          {target ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted">{t(lang, "targetFromDoctor")}</p>
                <p className="text-2xl font-bold text-ink">
                  {target.systolic}/{target.diastolic}
                </p>
              </div>
              <Button variant="secondary" onClick={handleClearTarget}>
                {t(lang, "clearTarget")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {!showTargetForm ? (
                <Button variant="secondary" className="w-full" onClick={() => setShowTargetForm(true)}>
                  {t(lang, "setTarget")}
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold text-muted">{t(lang, "targetFromDoctor")}</p>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={targetSys}
                      onChange={(e) => setTargetSys(e.target.value)}
                      placeholder={t(lang, "systolic")}
                      className="w-full rounded-xl border border-line bg-white px-3 py-2 text-lg text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      value={targetDia}
                      onChange={(e) => setTargetDia(e.target.value)}
                      placeholder={t(lang, "diastolic")}
                      className="w-full rounded-xl border border-line bg-white px-3 py-2 text-lg text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="success" onClick={handleSetTarget}>
                      {t(lang, "save")}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => { setShowTargetForm(false); setTargetSys(""); setTargetDia(""); }}
                    >
                      {t(lang, "cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Chart */}
      {!isLoading && (
        <Card className="w-full max-w-sm self-center">
          <h2 className="text-lg font-bold text-ink">{t(lang, "trend14Days")}</h2>
          <BPChart data={chartData} target={target} lang={lang} />
        </Card>
      )}

      {/* Summary sentence */}
      {summary && (
        <div className="flex w-full max-w-sm flex-col gap-1 self-center">
          <p className="text-lg text-ink">
            {t(lang, "averageThisWeek").replace("{avg}", summary.avgText)}
          </p>
          {target && summary.daysWithReadings > 0 && (
            <p className="text-lg text-ink">
              {t(lang, "higherThanTarget")
                .replace("{count}", String(summary.aboveTargetDays))
                .replace("{total}", String(summary.daysWithReadings))}{" "}
              {t(lang, "noteForDoctor")}
            </p>
          )}
        </div>
      )}

      {/* Very high notice */}
      {isVeryHigh && latestReading && (
        <Card className="w-full max-w-sm self-center border-danger-border bg-danger-bg">
          <p className="flex items-start gap-2 text-lg font-bold text-danger-text">
            <AlertIcon className="mt-0.5 h-6 w-6 shrink-0" />
            {t(lang, "veryHighReading")}
          </p>
          <p className="text-lg text-danger-text">{t(lang, "contactDoctorToday")}</p>
          <p className="text-lg font-semibold text-danger-text">{t(lang, "callEmergency")}</p>
        </Card>
      )}

      {/* Recent readings list */}
      <div className="flex w-full max-w-sm flex-col gap-3 self-center">
        <h2 className="text-lg font-bold text-ink">{t(lang, "readings")}</h2>
        {readings.length === 0 ? (
          <p className="py-6 text-center text-lg text-muted">{t(lang, "noReadingsYet")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {[...readings].reverse().map((r) => (
              <Card
                key={r.id}
                className={r.systolic >= 180 || r.diastolic >= 120 ? "border-danger-border bg-danger-bg" : ""}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-2xl font-bold text-ink">
                      {r.systolic}/{r.diastolic}
                    </p>
                    <p className="text-base text-muted">
                      {formatDateShort(lang, r.date)} {r.time}
                      {r.pulse !== null && ` · ${r.pulse} ${t(lang, "pulse")}`}
                    </p>
                  </div>
                  {!isSenior && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="min-h-12 shrink-0 rounded-lg px-3 py-2 text-base font-semibold text-danger-text hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {t(lang, "delete")}
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
