"use client";
import { useState } from "react";

// Salin ringkasan kehadiran (format mesej WhatsApp) ke papan keratan.
export function SalinTeks({ teks, label, labelDisalin, utama = false }: {
  teks: string; label: string; labelDisalin: string; utama?: boolean;
}) {
  const [disalin, setDisalin] = useState(false);

  async function salin() {
    try {
      await navigator.clipboard.writeText(teks);
    } catch {
      // Pelayar lama / tanpa HTTPS: guna textarea tersembunyi.
      const ta = document.createElement("textarea");
      ta.value = teks;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setDisalin(true);
    setTimeout(() => setDisalin(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={salin}
      className={utama
        ? "rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        : "rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"}
    >
      {disalin ? `✓ ${labelDisalin}` : `📋 ${label}`}
    </button>
  );
}
