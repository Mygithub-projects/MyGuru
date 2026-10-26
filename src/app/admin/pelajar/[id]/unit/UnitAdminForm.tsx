"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

// Satu kad bagi setiap bahagian: unit semasa + pilih unit baharu (Admin).
export function UnitAdminForm({
  pelajarId,
  jenisKoko,
  label,
  unitSemasa,
  jawatanSemasa,
  pending,
  pilihan,
  locale,
}: {
  pelajarId: string;
  jenisKoko: string;
  label: string;
  unitSemasa: string | null;
  jawatanSemasa: string | null;
  pending: boolean;
  pilihan: string[];
  locale: Locale;
}) {
  const L = (ms: string, en: string) => (locale === "en" ? en : ms);
  const router = useRouter();
  const KOSONG = "__kosong__";
  const [unit, setUnit] = useState("");
  const [sebab, setSebab] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; teks: string } | null>(null);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!unit) return;
    const unitBaru = unit === KOSONG ? null : unit;
    const sasaran = unitBaru ?? L("(dikosongkan)", "(cleared)");
    if (!confirm(L(`Tukar ${label}: ${unitSemasa ?? "—"} → ${sasaran}?`, `Change ${label}: ${unitSemasa ?? "—"} → ${sasaran}?`))) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/pelajar/${pelajarId}/unit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisKoko, unitBaru, sebab: sebab || undefined }),
      });
      const j = await res.json().catch(() => ({}));
      setMsg({ ok: res.ok, teks: j.message ?? (res.ok ? "OK" : L("Gagal", "Failed")) });
      if (res.ok) {
        setUnit("");
        setSebab("");
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, teks: L("Ralat rangkaian.", "Network error.") });
    } finally {
      setBusy(false);
    }
  }

  const inp = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
  return (
    <form onSubmit={simpan} className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div>
        <p className="text-xs font-semibold uppercase text-brand-dark">{label}</p>
        <p className="mt-1 font-medium text-slate-800">{unitSemasa ?? <span className="italic text-slate-400">{L("Belum berdaftar", "Not registered")}</span>}</p>
        {unitSemasa && <p className="text-xs text-slate-500">{L("Jawatan", "Position")}: {jawatanSemasa ?? "—"}</p>}
        {pending && (
          <p className="mt-1 text-xs text-amber-700">⏳ {L("Ada permohonan pelajar menunggu — akan ditutup jika anda menukar di sini.", "A student request is pending — it will be closed if you change it here.")}</p>
        )}
      </div>
      <label className="block text-xs font-medium text-slate-600">
        {L("Unit baharu", "New unit")}
        <select value={unit} onChange={(e) => setUnit(e.target.value)} className={`${inp} mt-1`}>
          <option value="">{L("— Pilih unit —", "— Select unit —")}</option>
          {pilihan.filter((u) => u !== unitSemasa).map((u) => <option key={u} value={u}>{u}</option>)}
          {unitSemasa && <option value={KOSONG}>{L("✕ Kosongkan penempatan", "✕ Clear placement")}</option>}
        </select>
      </label>
      <label className="block text-xs font-medium text-slate-600">
        {L("Sebab (pilihan)", "Reason (optional)")}
        <input value={sebab} onChange={(e) => setSebab(e.target.value)} maxLength={300} className={`${inp} mt-1`} placeholder={L("cth. Pelajar bukan ahli Kelab Komputer", "e.g. Student is not a Computer Club member")} />
      </label>
      {msg && (
        <p className={`rounded-md px-3 py-2 text-xs ${msg.ok ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>{msg.teks}</p>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={!unit || busy} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
          {busy ? L("Menyimpan…", "Saving…") : L("Kemas Kini Unit", "Update Unit")}
        </button>
      </div>
    </form>
  );
}
