import { useState, useEffect } from "react";

export interface VoiceStatus {
  voices: SpeechSynthesisVoice[];
  loading: boolean;
}

/**
 * Hook that loads speech synthesis voices reliably.
 * Browsers may return an empty list until the "voiceschanged" event fires.
 * We also retry after a short delay as a fallback.
 */
export function useVoices(): VoiceStatus {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    function load() {
      const list = window.speechSynthesis.getVoices();
      if (!cancelled) {
        setVoices(list);
        setLoading(false);
      }
    }

    load();

    // Some browsers (Chrome) need the event; others (Safari) may have voices immediately
    window.speechSynthesis.addEventListener("voiceschanged", load);

    // Fallback: retry after a short delay in case the event already fired before listener attached
    const fallbackId = setTimeout(() => {
      if (!cancelled && voices.length === 0) {
        load();
      }
    }, 500);

    return () => {
      cancelled = true;
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      clearTimeout(fallbackId);
    };
  }, []);

  return { voices, loading };
}
