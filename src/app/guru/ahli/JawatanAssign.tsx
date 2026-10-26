"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { JAWATAN_PELAJAR, JAWATAN_PELAJAR_LAMA, JAWATAN_PERKHIDMATAN } from "@/lib/enums";
import { nilaiEkstra } from "@/lib/pajsk";
import { labelJawatan, type Locale } from "@/lib/i18n";

interface JawatanAssignDict { placeholder: string; assignTitle: string; networkError: string }

export function JawatanAssign({
  pelajarId,
  jenisKoko,
  current,
  t,
  locale,
}: {
  pelajarId: string;
  jenisKoko: string;
  current: string | null;
  t: JawatanAssignDict;
  locale: Locale;
}) {
  const router = useRouter();
  // Unit Perkhidmatan: senarai Jadual 1 (skor ekstra); bidang lain: jawatan kelab/sukan/uniform.
  const up = jenisKoko === "Perkhidmatan";
  const pilihan: readonly string[] = up ? JAWATAN_PERKHIDMATAN : JAWATAN_PELAJAR;
  const semasa = up ? current ?? "" : JAWATAN_PELAJAR_LAMA[current ?? ""] ?? current ?? "";
  const [nilai, setNilai] = useState<string>(pilihan.includes(semasa) ? semasa : "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function simpan(jawatan: string) {
    if (!jawatan) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/guru/jawatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pelajarId, jenisKoko, jawatan }),
      });
      const json = await res.json();
      setMsg({ text: json.message, ok: json.success });
      if (json.success) router.refresh();
    } catch {
      setMsg({ text: t.networkError, ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={nilai}
        disabled={busy}
        onChange={(e) => {
          setNilai(e.target.value);
          simpan(e.target.value);
        }}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
        title={t.assignTitle}
      >
        <option value="">{t.placeholder}</option>
        {pilihan.map((j) => (
          <option key={j} value={j}>
            {labelJawatan(j, locale)}
            {up ? ` (${nilaiEkstra(j)})` : ""}
          </option>
        ))}
      </select>
      {msg && (
        <span className={`text-[11px] ${msg.ok ? "text-brand-dark" : "text-red-600"}`} title={msg.text}>
          {msg.ok ? "✓" : "✕"}
        </span>
      )}
    </div>
  );
}
