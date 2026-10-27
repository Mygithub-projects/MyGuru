"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

type Jumlah = { Kelab: number; Sukan: number; Uniform: number };

// Tetapan jumlah aktiviti penuh setiap bahagian (KP / SP / BU). Pengiraan kekal
// kaedah KTE Desa Mahkota: 2 aktiviti = 1 perjumpaan PAJSK.
export function KehadiranTetapan({
  awal,
  kohort,
  label,
  locale,
}: {
  awal: Jumlah;
  /** Kohort yang dipilih di header — tetapan disimpan bagi kohort ini sahaja. */
  kohort: string | null;
  label: Record<keyof Jumlah, string>;
  locale: Locale;
}) {
  const L = (ms: string, en: string) => (locale === "en" ? en : ms);
  const router = useRouter();
  const [j, setJ] = useState<Jumlah>(awal);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; teks: string } | null>(null);
  const jumlah = j.Kelab + j.Sukan + j.Uniform;
  const berubah = j.Kelab !== awal.Kelab || j.Sukan !== awal.Sukan || j.Uniform !== awal.Uniform;

  async function simpan() {
    if (!confirm(L(
      `Simpan jumlah aktiviti (jumlah ${jumlah})? Markah semua pelajar akan dikira semula.`,
      `Save activity totals (total ${jumlah})? All students' marks will be recalculated.`,
    ))) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/tetapan/kehadiran", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(j),
      });
      const json = await res.json().catch(() => ({}));
      setMsg({ ok: res.ok, teks: json.message ?? (res.ok ? "OK" : L("Gagal", "Failed")) });
      if (res.ok) router.refresh();
    } catch {
      setMsg({ ok: false, teks: L("Ralat rangkaian.", "Network error.") });
    } finally {
      setBusy(false);
    }
  }

  const inp = "w-24 rounded-md border border-slate-300 px-3 py-2 text-right text-sm";
  return (
    <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">{L("Jumlah Aktiviti Kehadiran (Penuh)", "Full Attendance Activity Totals")}{kohort ? ` · ${kohort}` : ""}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {L(
            "Bilangan aktiviti kokurikulum (80 minit) penuh bagi setiap bahagian. Kehadiran dikira GABUNGAN semua bahagian: hadir KP + SP + BU ÷ 2 = perjumpaan PAJSK, maksimum 15 (KPM); markah = perjumpaan ÷ 15 × 50, dipakai dalam skor setiap bidang.",
            "Full number of co-curricular activities (80 min) per division. Attendance is COMBINED across divisions: attended KP + SP + BU ÷ 2 = PAJSK meetings, max 15 (KPM); mark = meetings ÷ 15 × 50, used in every division score.",
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        {(Object.keys(label) as (keyof Jumlah)[]).map((b) => (
          <label key={b} className="text-xs font-medium text-slate-600">
            {label[b]}
            <input
              type="number"
              min={2}
              max={200}
              value={j[b]}
              onChange={(e) => setJ((s) => ({ ...s, [b]: Number(e.target.value) }))}
              className={`${inp} mt-1 block`}
            />
          </label>
        ))}
        <div className="pb-2 text-sm">
          <span className="text-slate-500">{L("Jumlah", "Total")}: </span>
          <strong className="text-lg text-brand-dark">{jumlah}</strong>
          <span className="ml-2 text-xs text-slate-500">
            → {L("maks", "max")} {Math.min(15, Math.floor(jumlah / 2))} {L("perjumpaan PAJSK", "PAJSK meetings")}
            {Math.floor(jumlah / 2) < 15 && (
              <span className="ml-1 text-amber-700">({L("kurang daripada 15 — markah kehadiran penuh tidak boleh dicapai", "below 15 — full attendance mark unreachable")})</span>
            )}
          </span>
        </div>
      </div>
      {msg && (
        <p className={`rounded-md px-3 py-2 text-xs ${msg.ok ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>{msg.teks}</p>
      )}
      <div className="flex justify-end">
        <button
          onClick={simpan}
          disabled={busy || !berubah}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {busy ? L("Menyimpan…", "Saving…") : L("Simpan Jumlah Aktiviti", "Save Activity Totals")}
        </button>
      </div>
    </section>
  );
}
