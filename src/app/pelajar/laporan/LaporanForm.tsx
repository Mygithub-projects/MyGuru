"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Unit { jenisKoko: string; namaUnit: string; }
interface Projek { id: string; namaProjek: string; status: string; }
interface Sesi { id: string; namaUnit: string; bilPerjumpaan: number; }

export function LaporanForm({ units, projek, sesiList }: { units: Unit[]; projek: Projek[]; sesiList: Sesi[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"mingguan" | "projek">("mingguan");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>, url: string, hantar: boolean) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    form.set("hantar", String(hantar));
    try {
      const res = await fetch(url, { method: "POST", body: form });
      const json = await res.json();
      setMsg({ text: json.message, ok: json.success });
      if (json.success) { (e.target as HTMLFormElement).reset(); router.refresh(); }
    } catch {
      setMsg({ text: "Ralat rangkaian", ok: false });
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex gap-2">
        {(["mingguan", "projek"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === t ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>
            {t === "mingguan" ? "Laporan Mingguan" : "Laporan Projek"}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`mb-3 rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.text}
        </div>
      )}

      {tab === "mingguan" ? (
        <form onSubmit={(e) => submit(e, "/api/laporan/mingguan", true)} className="grid gap-3 sm:grid-cols-2">
          <select name="namaUnit" className={inputCls} required>
            {units.map((u, i) => <option key={i} value={u.namaUnit}>{u.jenisKoko}: {u.namaUnit}</option>)}
          </select>
          <input type="hidden" name="jenisKoko" value={units[0]?.jenisKoko ?? "Kelab"} />
          <input type="date" name="tarikh" className={inputCls} required />
          <input name="masa" placeholder="Masa (cth 2.30-4.30 ptg)" className={inputCls} />
          <select name="sesiId" className={inputCls} defaultValue="">
            <option value="">— Paut sesi kehadiran (pilihan) —</option>
            {sesiList.map((s) => <option key={s.id} value={s.id}>{s.namaUnit} · Perjumpaan {s.bilPerjumpaan}</option>)}
          </select>
          <input name="lampiran" type="file" className={`${inputCls} file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1`} />
          <textarea name="aktiviti" placeholder="Aktiviti / laporan ringkas" rows={3} className={`${inputCls} sm:col-span-2`} required />
          <div className="flex gap-2 sm:col-span-2">
            <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
              {busy ? "..." : "Hantar untuk Semakan"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={(e) => submit(e, "/api/laporan/projek", true)} className="grid gap-3 sm:grid-cols-2">
          <select name="projekId" className={inputCls} defaultValue="">
            <option value="">— Projek baharu (pra-program) —</option>
            {projek.map((p) => <option key={p.id} value={p.id}>Pasca: {p.namaProjek}</option>)}
          </select>
          <input name="namaProjek" placeholder="Nama projek (untuk projek baharu)" className={inputCls} />
          <div className="text-xs text-slate-500 sm:col-span-2">Pra-program: muat naik Kertas Kerja. Pasca-program: pilih projek di atas + muat naik Laporan Impak & isi maklumat.</div>
          <label className="text-sm">Kertas Kerja (pra)
            <input name="kertasKerja" type="file" className={`${inputCls} mt-1`} />
          </label>
          <label className="text-sm">Laporan Impak (pasca)
            <input name="laporanImpak" type="file" className={`${inputCls} mt-1`} />
          </label>
          <select name="sesiId" className={inputCls} defaultValue="">
            <option value="">— Paut sesi kehadiran program (pilihan) —</option>
            {sesiList.map((s) => <option key={s.id} value={s.id}>{s.namaUnit} · Perjumpaan {s.bilPerjumpaan}</option>)}
          </select>
          <input name="kewangan" placeholder="Ringkasan kewangan (RM)" className={inputCls} />
          <input name="kekuatan" placeholder="Kekuatan" className={inputCls} />
          <textarea name="kelemahan" placeholder="Kelemahan / penambahbaikan" rows={2} className={`${inputCls} sm:col-span-2`} />
          <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 sm:col-span-2 sm:w-auto">
            {busy ? "..." : "Hantar untuk Semakan"}
          </button>
        </form>
      )}
    </section>
  );
}
