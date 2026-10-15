"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  type Language,
  languages,
  defaultLanguage,
  t,
} from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { LoadingShell } from "@/app/loading-shell";
import QRCode from "qrcode";

export default function FamilyPage() {
  const { isHydrated } = useStore();

  // Neutral loading shell until hydrated; the inner component holds all
  // other hooks so their order never changes between renders.
  if (!isHydrated) {
    return <LoadingShell />;
  }
  return <FamilyPageInner />;
}

// Label shown for a device that has no stored label — mirrors the server-side
// defaults in POST /api/v1/pairing-codes.
function fallbackDeviceLabel(
  lang: Language,
  device: { label: string | null; role: string },
  householdName: string
): string {
  if (device.label) return device.label;
  if (device.role === "senior") {
    return t(lang, "defaultDeviceLabelSenior").replace(
      "{name}",
      householdName || t(lang, "namePlaceholder")
    );
  }
  return t(lang, "defaultDeviceLabelCaregiver");
}

function FamilyPageInner() {
  const router = useRouter();
  const { state, actions } = useStore();
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [qrUrl, setQrUrl] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [expiryText, setExpiryText] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("tpb-lang") as Language | null;
    if (stored && languages.some((l) => l.code === stored)) {
      setLang(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  async function generateCode(role: "caregiver" | "senior") {
    setLoading(true);
    try {
      // No label sent — the server defaults it by role.
      const result = await actions.createPairingCode(role);
      setShortCode(result.shortCode);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const dataUrl = await QRCode.toDataURL(`${origin}/join?c=${result.shortCode}`, { width: 280, margin: 2 });
      setQrUrl(dataUrl);

      const expiry = new Date(result.shortExpiresAt);
      const now = new Date();
      const diffMin = Math.max(0, Math.round((expiry.getTime() - now.getTime()) / 60000));
      setExpiryText(String(diffMin));
      setShowCode(true);
    } catch (err) {
      console.error("Failed to create pairing code:", err);
    } finally {
      setLoading(false);
    }
  }

  const displayName = state.household?.displayName ?? "";

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-slate-50 px-4 py-6">
      <header className="flex w-full max-w-sm flex-col gap-2 self-center">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg px-3 py-2 text-lg text-slate-600 hover:bg-slate-100"
            aria-label={t(lang, "back")}
          >
            ← {t(lang, "back")}
          </button>
          <h1 className="text-xl font-bold text-slate-900">
            {t(lang, "familyPhones")}
          </h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Create code buttons */}
      <div className="flex w-full max-w-sm flex-col gap-3 self-center">
        {!showCode ? (
          <>
            <button
              onClick={() => generateCode("senior")}
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300"
              style={{ minHeight: 56 }}
            >
              {t(lang, "addPhone").replace("{name}", displayName || t(lang, "namePlaceholder"))}
            </button>
            <button
              onClick={() => generateCode("caregiver")}
              disabled={loading}
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-5 py-4 text-lg font-semibold text-slate-700 hover:bg-slate-50 disabled:bg-slate-100"
              style={{ minHeight: 56 }}
            >
              {t(lang, "addFamilyMember")}
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-4 rounded-xl border-2 border-slate-200 bg-white p-6">
            {qrUrl && (
              <div className="flex justify-center">
                <img src={qrUrl} alt="QR code" className="h-56 w-56" />
              </div>
            )}
            <div className="text-center">
              <p className="text-3xl font-bold tracking-widest text-slate-900">
                {shortCode}
              </p>
              <p className="mt-2 text-base text-slate-600">
                {t(lang, "codeExpiresIn").replace("{n}", expiryText)}
              </p>
            </div>
            <p className="text-center text-base text-slate-600">
              {t(lang, "qrInstructions").replace("{name}", displayName || t(lang, "namePlaceholder"))}
            </p>
            <button
              onClick={() => setShowCode(false)}
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t(lang, "close")}
            </button>
          </div>
        )}

        {/* PWA install hint */}
        <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
          <p className="text-base text-slate-600">
            {t(lang, "installPrompt")}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {t(lang, "installHintChrome")}
          </p>
          <p className="text-sm text-slate-500">
            {t(lang, "installHintIOS")}
          </p>
        </div>
      </div>

      {/* Device list */}
      <div className="flex w-full max-w-sm flex-col gap-3 self-center">
        <h2 className="text-lg font-bold text-slate-900">
          {t(lang, "linkedPhones")}
        </h2>
        {state.devices.length === 0 ? (
          <p className="py-4 text-center text-lg text-slate-500">
            {t(lang, "noDevices")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {state.devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between rounded-xl border-2 border-slate-200 bg-white p-4"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  {editingId === device.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        maxLength={40}
                        className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-lg text-slate-900"
                      />
                      <button
                        onClick={async () => {
                          if (editLabel.trim()) {
                            await actions.updateDeviceLabel(device.id, editLabel.trim());
                          }
                          setEditingId(null);
                        }}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-base font-semibold text-white hover:bg-blue-700"
                      >
                        {t(lang, "save")}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {t(lang, "cancel")}
                      </button>
                    </div>
                  ) : (
                    <p
                      className="text-lg font-semibold text-slate-900 cursor-pointer hover:text-blue-700"
                      onClick={() => {
                        setEditingId(device.id);
                        setEditLabel(fallbackDeviceLabel(lang, device, displayName));
                      }}
                    >
                      {device.isCurrent && device.label === "Primary caregiver"
                        ? t(lang, "you")
                        : fallbackDeviceLabel(lang, device, displayName)}
                    </p>
                  )}
                  <p className="text-base text-slate-600">
                    {t(lang, "roleLabel")}: {t(lang, device.role as "caregiver" | "senior")}
                  </p>
                  {device.lastSeenAt && (
                    <p className="text-sm text-slate-500">
                      {t(lang, "lastActive")}: {new Date(device.lastSeenAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={async () => {
                    if (window.confirm(t(lang, "unlinkConfirm"))) {
                      await actions.unlinkDevice(device.id);
                    }
                  }}
                  className="rounded-lg px-3 py-2 text-base font-semibold text-red-600 hover:bg-red-100"
                >
                  {t(lang, "unlink")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
