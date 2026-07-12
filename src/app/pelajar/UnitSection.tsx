"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { statusPilihanT6 } from "@/lib/pajsk";

interface U {
  jenisKoko: string;
  namaUnitT5: string | null;
  namaUnitT6: string | null;
  jawatanT6: string | null;
  peringkatT6: string | null;
  statusPertukaran: string;
}

const KATEGORI = [
  { v: "Sukan", l: "Sukan / Permainan" },
  { v: "Kelab", l: "Kelab / Persatuan" },
  { v: "Uniform", l: "Badan Beruniform" },
];

type Senarai = Record<string, string[]>;

export function UnitSection({ pelajarId, senarai, units }: { pelajarId: string; senarai: Senarai; units: U[] }) {
  const router = useRouter();
  const [openJenis, setOpenJenis] = useState<string | null>(null);
  const [pilihan, setPilihan] = useState(""); // unit dipilih dari dropdown
  const [sebab, setSebab] = useState("");
  const [sahkan, setSahkan] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const unitBaru = pilihan;
  const opsyen = openJenis ? senarai[openJenis] ?? [] : [];

  // Gabung 3 kategori tetap dengan baris sedia ada
  const kategori = KATEGORI.map((k) => ({
    ...k,
    unit: units.find((u) => u.jenisKoko === k.v) ?? null,
  }));

  const semasa = openJenis ? units.find((u) => u.jenisKoko === openJenis) ?? null : null;
  const mode = semasa?.namaUnitT6 ? "Pertukaran" : "Pendaftaran";
  const pending = semasa?.statusPertukaran === "Pending";

  function buka(jenis: string) {
    setOpenJenis(jenis);
    setPilihan("");
    setSebab("");
    setSahkan(false);
    setMsg(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!openJenis) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/pelajar/${pelajarId}/tukar-unit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisKoko: openJenis, unitBaru, sebab }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg({ text: `${mode} dihantar — menunggu kelulusan guru.`, ok: true });
        setPilihan("");
        setSebab("");
        setSahkan(false);
        router.refresh();
      } else {
        setMsg({ text: json.message, ok: false });
      }
    } catch {
      setMsg({ text: "Ralat rangkaian.", ok: false });
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";
  const bolehHantar = !busy && !pending && unitBaru.trim().length >= 2 && (mode === "Pendaftaran" || sahkan);

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Unit Kokurikulum Semasa (T6)</h2>
        <Link href="/pelajar/tukar-unit" className="text-xs font-semibold text-brand-dark hover:underline">Sejarah</Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {kategori.map((k) => {
          const u = k.unit;
          const berdaftar = !!u?.namaUnitT6;
          return (
            <div key={k.v} className="flex flex-col rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase text-brand-dark">{k.l}</p>
              <p className="mt-1 font-medium text-slate-800">{u?.namaUnitT6 ?? "Belum berdaftar"}</p>
              {berdaftar && <p className="text-xs text-slate-500">{u?.jawatanT6} · {u?.peringkatT6}</p>}
              <div className="mt-2 flex items-center justify-between gap-2">
                <StatusBadge status={u ? statusPilihanT6(u) : "Belum Pilih"} />
                <button
                  onClick={() => buka(k.v)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold text-white ${berdaftar ? "bg-ink hover:bg-ink-2" : "bg-brand hover:bg-brand-hover"}`}
                >
                  {berdaftar ? "Tukar" : "Daftar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={openJenis !== null} onClose={() => setOpenJenis(null)} title={`${mode} ${KATEGORI.find((k) => k.v === openJenis)?.l ?? ""}`}>
        <form onSubmit={submit} className="space-y-4">
          {msg && (
            <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
              {msg.text}
            </div>
          )}

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Unit semasa: <strong>{semasa?.namaUnitT6 ?? "Belum berdaftar"}</strong>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {mode === "Pendaftaran" ? "Unit Dipohon" : "Unit Baru"}
            </label>
            {opsyen.length === 0 ? (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
                Tiada unit dengan guru penasihat untuk kategori ini. Sila hubungi pentadbir.
              </p>
            ) : (
              <select value={pilihan} onChange={(e) => setPilihan(e.target.value)} required className={input} autoFocus>
                <option value="" disabled>— Pilih unit —</option>
                {opsyen.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
            <p className="mt-1 text-[11px] text-slate-400">Hanya unit yang mempunyai guru penasihat disenaraikan.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Sebab / Catatan (pilihan)</label>
            <textarea value={sebab} onChange={(e) => setSebab(e.target.value)} rows={2} className={input} />
          </div>

          {mode === "Pertukaran" && (
            <label className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
              <input type="checkbox" checked={sahkan} onChange={(e) => setSahkan(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" />
              <span>Saya faham unit semasa <strong>{semasa?.namaUnitT6}</strong> akan diganti, dan jawatan akan diset semula kepada &quot;Ahli Aktif&quot; selepas diluluskan.</span>
            </label>
          )}

          <p className="text-xs text-slate-500">
            ℹ️ Setiap kategori hanya satu unit. Permohonan perlu <strong>kelulusan guru</strong> sebelum unit dikemas kini.
          </p>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpenJenis(null)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">Batal</button>
            <button type="submit" disabled={!bolehHantar} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">
              {pending ? "Menunggu kelulusan" : busy ? "Menghantar..." : `Hantar ${mode}`}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
