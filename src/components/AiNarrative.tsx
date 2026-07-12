"use client";
import { useEffect, useState } from "react";

// Memuat ringkasan AI (jika dikonfigur) secara client-side supaya SSR tidak
// tersekat menunggu panggilan model yang mungkin lambat.
export function AiNarrative() {
  const [state, setState] = useState<"loading" | "ok" | "off">("loading");
  const [teks, setTeks] = useState("");

  useEffect(() => {
    let batal = false;
    fetch("/api/insights/ai")
      .then((r) => r.json())
      .then((j) => {
        if (batal) return;
        if (j.success && j.data.ai && j.data.ringkasan) {
          setTeks(j.data.ringkasan);
          setState("ok");
        } else {
          setState("off");
        }
      })
      .catch(() => !batal && setState("off"));
    return () => { batal = true; };
  }, []);

  if (state === "off") return null;

  return (
    <div className="mb-3 rounded-lg border border-brand/20 bg-brand-light/50 p-3">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-dark">
        <span>✨</span> Ringkasan AI
      </p>
      {state === "loading" ? (
        <p className="animate-pulse text-sm text-slate-400">Menjana ringkasan…</p>
      ) : (
        <p className="text-sm leading-relaxed text-slate-700">{teks}</p>
      )}
    </div>
  );
}
