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
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
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
    <main className="flex min-h-screen flex-col gap-6 bg-page px-4 py-6">
      <div className="flex w-full max-w-sm flex-col gap-2 self-center">
        <AppHeader
          title={t(lang, "familyPhones")}
          back={{ label: t(lang, "back"), onClick: () => router.push("/") }}
        />
      </div>

      {/* Create code buttons */}
      <div className="flex w-full max-w-sm flex-col gap-3 self-center">
        {!showCode ? (
          <>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => generateCode("senior")}
              disabled={loading}
            >
              {t(lang, "addPhone").replace("{name}", displayName || t(lang, "namePlaceholder"))}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => generateCode("caregiver")}
              disabled={loading}
            >
              {t(lang, "addFamilyMember")}
            </Button>
          </>
        ) : (
          <Card className="flex flex-col gap-4 items-center text-center">
            {qrUrl && (
              <img src={qrUrl} alt="QR code" className="h-56 w-56" />
            )}
            <div>
              <p className="text-4xl font-bold tracking-[0.25em] text-ink font-mono">
                {shortCode}
              </p>
              <p className="mt-2 text-base text-muted">
                {t(lang, "codeExpiresIn").replace("{n}", expiryText)}
              </p>
            </div>
            <p className="text-base text-muted">
              {t(lang, "qrInstructions").replace("{name}", displayName || t(lang, "namePlaceholder"))}
            </p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowCode(false)}
            >
              {t(lang, "close")}
            </Button>
          </Card>
        )}

        {/* PWA install hint */}
        <Card>
          <p className="text-base text-muted">
            {t(lang, "installPrompt")}
          </p>
          <p className="mt-1 text-sm text-muted">
            {t(lang, "installHintChrome")}
          </p>
          <p className="text-sm text-muted">
            {t(lang, "installHintIOS")}
          </p>
        </Card>
      </div>

      {/* Device list */}
      <div className="flex w-full max-w-sm flex-col gap-3 self-center">
        <h2 className="text-lg font-bold text-ink">
          {t(lang, "linkedPhones")}
        </h2>
        {state.devices.length === 0 ? (
          <p className="py-4 text-center text-lg text-muted">
            {t(lang, "noDevices")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {state.devices.map((device) => (
              <Card key={device.id}>
                <div className="flex flex-col gap-2">
                  {editingId === device.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        maxLength={40}
                        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-lg text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <Button
                        variant="primary"
                        onClick={async () => {
                          if (editLabel.trim()) {
                            await actions.updateDeviceLabel(device.id, editLabel.trim());
                          }
                          setEditingId(null);
                        }}
                      >
                        {t(lang, "save")}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setEditingId(null)}
                      >
                        {t(lang, "cancel")}
                      </Button>
                    </div>
                  ) : (
                    <p
                      className="text-lg font-semibold text-ink cursor-pointer hover:text-primary"
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
                  <p className="text-base text-muted">
                    {t(lang, "roleLabel")}: {t(lang, device.role as "caregiver" | "senior")}
                  </p>
                  {device.lastSeenAt && (
                    <p className="text-sm text-muted">
                      {t(lang, "lastActive")}: {new Date(device.lastSeenAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={async () => {
                      if (window.confirm(t(lang, "unlinkConfirm"))) {
                        await actions.unlinkDevice(device.id);
                      }
                    }}
                    className="min-h-12 rounded-lg px-3 py-2 text-base font-semibold text-danger-text hover:bg-danger-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {t(lang, "unlink")}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
