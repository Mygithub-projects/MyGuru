"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dict } from "@/lib/i18n";
import { MARKAH_PERINGKAT_PROGRAM, PERINGKAT_PROGRAM } from "@/lib/projek-jawatan";
import type { CalonPelajar } from "./CariPelajar";

type T = Dict["laporan"]["programKolej"];
interface ProgramRow { id: string; nama: string; tarikh: string | null; peringkat: string; peserta: string[]; }

async function hantar(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return (await res.json()) as { success: boolean; message: string };
}

const label = (p: string, t: T) => (p === "Sekolah" ? t.collegeLevel : p);
const inp = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

export function ProgramKolej({ program, pelajar, t }: { program: ProgramRow[]; pelajar: CalonPelajar[]; t: T }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [baru, setBaru] = useState({ nama: "", tarikh: "", peringkat: "Sekolah" });

  async function laksana(fn: () => Promise<{ success: boolean; message: string }>, selepas?: () => void) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fn();
      setMsg({ text: r.message, ok: r.success });
      if (r.success) { selepas?.(); router.refresh(); }
    } catch {
      setMsg({ text: t.networkError, ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">{t.sub}</p>
      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>{msg.text}</div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); laksana(() => hantar("/api/program-kolej", "POST", baru), () => setBaru({ nama: "", tarikh: "", peringkat: "Sekolah" })); }}
        className="grid gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
      >
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600 sm:col-span-4">{t.newTitle}</h2>
        <label className="text-sm">{t.nameLabel}
          <input value={baru.nama} onChange={(e) => setBaru({ ...baru, nama: e.target.value })} maxLength={200} required className={`${inp} mt-1 w-full`} />
        </label>
        <label className="text-sm">{t.dateLabel}
          <input type="date" value={baru.tarikh} onChange={(e) => setBaru({ ...baru, tarikh: e.target.value })} className={`${inp} mt-1 w-full`} />
        </label>
        <label className="text-sm">{t.levelLabel}
          <select value={baru.peringkat} onChange={(e) => setBaru({ ...baru, peringkat: e.target.value })} className={`${inp} mt-1 w-full`}>
            {PERINGKAT_PROGRAM.map((p) => <option key={p} value={p}>{label(p, t)} ({MARKAH_PERINGKAT_PROGRAM[p]})</option>)}
          </select>
        </label>
        <button disabled={busy || !baru.nama.trim()} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
          {busy ? t.creating : t.create}
        </button>
      </form>

      {program.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">{t.empty}</p>
      ) : program.map((p) => (
        <KadProgram key={`${p.id}:${p.peringkat}:${p.peserta.length}:${p.peserta.slice(0, 3).join()}`} p={p} pelajar={pelajar} t={t} busy={busy} laksana={laksana} />
      ))}
    </div>
  );
}

function KadProgram({ p, pelajar, t, busy, laksana }: {
  p: ProgramRow; pelajar: CalonPelajar[]; t: T; busy: boolean;
  laksana: (fn: () => Promise<{ success: boolean; message: string }>, selepas?: () => void) => Promise<void>;
}) {
  const [pilih, setPilih] = useState<Set<string>>(() => new Set(p.peserta));
  const [buka, setBuka] = useState(false);
  const [edit, setEdit] = useState(false);
  const [b, setB] = useState({ nama: p.nama, tarikh: p.tarikh?.slice(0, 10) ?? "", peringkat: p.peringkat });
  const [kelas, setKelas] = useState("");
  const [q, setQ] = useState("");

  const senaraiKelas = useMemo(() => [...new Set(pelajar.map((x) => x.kelas ?? "-"))].sort(), [pelajar]);
  const ditapis = useMemo(() => {
    const k = q.trim().toLowerCase();
    return pelajar.filter((x) => (!kelas || (x.kelas ?? "-") === kelas) && (!k || x.nama.toLowerCase().includes(k)));
  }, [pelajar, kelas, q]);
  const berubah = pilih.size !== p.peserta.length || p.peserta.some((id) => !pilih.has(id));
  const namaDipilih = pelajar.filter((x) => pilih.has(x.id));

  const togol = (id: string) => setPilih((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const pukal = (on: boolean) => setPilih((s) => { const n = new Set(s); for (const x of ditapis) { if (on) n.add(x.id); else n.delete(x.id); } return n; });

  return (
    <article className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      {edit ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end">
          <input value={b.nama} onChange={(e) => setB({ ...b, nama: e.target.value })} className={inp} aria-label={t.nameLabel} />
          <input type="date" value={b.tarikh} onChange={(e) => setB({ ...b, tarikh: e.target.value })} className={inp} aria-label={t.dateLabel} />
          <select value={b.peringkat} onChange={(e) => setB({ ...b, peringkat: e.target.value })} className={inp} aria-label={t.levelLabel}>
            {PERINGKAT_PROGRAM.map((x) => <option key={x} value={x}>{label(x, t)} ({MARKAH_PERINGKAT_PROGRAM[x]})</option>)}
          </select>
          <button type="button" disabled={busy || !b.nama.trim()}
            onClick={() => laksana(() => hantar(`/api/program-kolej/${p.id}`, "PATCH", b), () => setEdit(false))}
            className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{t.save.split(" ")[0]}</button>
          <button type="button" onClick={() => setEdit(false)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">{t.cancel}</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-800">{p.nama}</h2>
            <p className="text-xs text-slate-500">
              {p.tarikh ? `${new Date(p.tarikh).toLocaleDateString("ms-MY")} · ` : ""}
              <span className="rounded bg-brand-light px-1.5 py-0.5 font-semibold text-brand-dark">{label(p.peringkat, t)}</span>
              {" "}= {MARKAH_PERINGKAT_PROGRAM[p.peringkat] ?? 0} {t.marks}
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={() => setEdit(true)} className="font-semibold text-brand-dark hover:underline">{t.edit}</button>
            <button type="button" disabled={busy}
              onClick={() => { if (confirm(t.confirmDelete)) laksana(() => hantar(`/api/program-kolej/${p.id}`, "DELETE")); }}
              className="font-semibold text-red-600 hover:underline">{t.delete}</button>
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{t.participants} ({pilih.size})</h3>
          <button type="button" onClick={() => setBuka((v) => !v)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
            {buka ? t.close : t.choose}
          </button>
        </div>
        {!buka && namaDipilih.length > 0 && (
          <p className="mt-1 line-clamp-3 text-xs text-slate-600">{namaDipilih.map((x) => `${x.nama} (${x.kelas ?? "-"})`).join(", ")}</p>
        )}

        {buka && (
          <div className="mt-2 space-y-2 rounded-lg border border-slate-200 p-3">
            <div className="flex flex-wrap gap-2">
              <select value={kelas} onChange={(e) => setKelas(e.target.value)} className={`${inp} py-1.5`} aria-label={t.classFilter}>
                <option value="">{t.allClasses}</option>
                {senaraiKelas.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className={`${inp} min-w-40 flex-1 py-1.5`} />
              <button type="button" onClick={() => pukal(true)} className="rounded-lg bg-brand-light px-3 py-1.5 text-xs font-semibold text-brand-dark">{t.selectFiltered} ({ditapis.length})</button>
              <button type="button" onClick={() => pukal(false)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{t.clearFiltered}</button>
            </div>
            <ul className="grid max-h-80 gap-x-4 overflow-auto text-sm sm:grid-cols-2 lg:grid-cols-3">
              {ditapis.map((x) => (
                <li key={x.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-slate-50">
                    <input type="checkbox" checked={pilih.has(x.id)} onChange={() => togol(x.id)} />
                    <span className="truncate text-slate-700">{x.nama}</span>
                    <span className="ml-auto shrink-0 text-xs text-slate-400">{x.kelas ?? "-"}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy || !berubah}
            onClick={() => laksana(() => hantar(`/api/program-kolej/${p.id}/peserta`, "PUT", { pelajarIds: [...pilih] }), () => setBuka(false))}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
            {busy ? t.saving : t.save}
          </button>
          {berubah && (
            <>
              <span className="text-xs font-semibold text-amber-600">● {t.unsaved} ({pilih.size} {t.selected})</span>
              <button type="button" onClick={() => setPilih(new Set(p.peserta))} className="text-xs text-slate-500 hover:underline">{t.cancel}</button>
            </>
          )}
          {!berubah && p.peserta.length > 0 && <span className="text-xs text-slate-400">{t.recalcNote}</span>}
        </div>
      </div>
    </article>
  );
}
