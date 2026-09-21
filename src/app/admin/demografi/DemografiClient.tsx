"use client";
import { useMemo, useState } from "react";

interface P { id: string; nama: string; noIc: string; kelasT6: string | null; jantina: string | null; kaum: string | null; agama: string | null; }
interface DemografiDict {
  colName: string; colGender: string; colRace: string; colReligion: string;
  male: string; female: string; save: string;
  kaum: { melayu: string; cina: string; india: string; lainLain: string };
  agama: { islam: string; buddha: string; hindu: string; kristian: string; lainLain: string };
}

const TIADA_KELAS = "__tiada__";

export function DemografiClient({ pelajar: initial, t, locale = "ms" }: { pelajar: P[]; t: DemografiDict; locale?: "ms" | "en" }) {
  const L = (ms: string, en: string) => (locale === "en" ? en : ms);
  const KAUM = [
    { v: "Melayu", l: t.kaum.melayu }, { v: "Cina", l: t.kaum.cina },
    { v: "India", l: t.kaum.india }, { v: "Lain-lain", l: t.kaum.lainLain },
  ];
  const AGAMA = [
    { v: "Islam", l: t.agama.islam }, { v: "Buddha", l: t.agama.buddha }, { v: "Hindu", l: t.agama.hindu },
    { v: "Kristian", l: t.agama.kristian }, { v: "Lain-lain", l: t.agama.lainLain },
  ];
  const [rows, setRows] = useState(initial);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const kumpulan = useMemo(() => {
    const map = new Map<string, P[]>();
    for (const p of rows) {
      const kunci = p.kelasT6 ?? TIADA_KELAS;
      if (!map.has(kunci)) map.set(kunci, []);
      map.get(kunci)!.push(p);
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === TIADA_KELAS) return 1;
      if (b === TIADA_KELAS) return -1;
      return a.localeCompare(b);
    });
  }, [rows]);

  const [terbuka, setTerbuka] = useState<Set<string>>(() => new Set(kumpulan.slice(0, 1).map(([k]) => k)));

  function togglKelas(kunci: string) {
    setTerbuka((s) => {
      const n = new Set(s);
      if (n.has(kunci)) n.delete(kunci); else n.add(kunci);
      return n;
    });
  }

  function bukaSemua() {
    setTerbuka(new Set(kumpulan.map(([k]) => k)));
  }
  function tutupSemua() {
    setTerbuka(new Set());
  }

  function belumLengkap(p: P) {
    return !p.jantina || !p.kaum || !p.agama;
  }

  function update(id: string, field: keyof P, value: string) {
    setRows((r) => r.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  async function simpan(p: P) {
    setSavingId(p.id);
    setSavedId(null);
    try {
      const res = await fetch(`/api/admin/demografi/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jantina: p.jantina || null, kaum: p.kaum || null, agama: p.agama || null }),
      });
      if (res.ok) { setSavedId(p.id); setTimeout(() => setSavedId(null), 1500); }
    } finally {
      setSavingId(null);
    }
  }

  const sel = "rounded-md border border-slate-300 px-2 py-1 text-sm";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 text-xs">
        <button type="button" onClick={bukaSemua} className="rounded-md bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200">
          {L("Buka Semua", "Expand All")}
        </button>
        <button type="button" onClick={tutupSemua} className="rounded-md bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200">
          {L("Tutup Semua", "Collapse All")}
        </button>
      </div>

      {kumpulan.map(([kunci, senarai]) => {
        const dibuka = terbuka.has(kunci);
        const kekuranganCount = senarai.filter(belumLengkap).length;
        const labelKelas = kunci === TIADA_KELAS ? L("Tiada Kelas", "No Class") : kunci;
        return (
          <div key={kunci} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <button
              type="button"
              onClick={() => togglKelas(kunci)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <span className={`text-slate-400 transition-transform ${dibuka ? "rotate-90" : ""}`}>▶</span>
                <span className="font-semibold text-slate-800">{labelKelas}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{senarai.length}</span>
              </span>
              {kekuranganCount > 0 && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                  {L(`${kekuranganCount} belum lengkap`, `${kekuranganCount} incomplete`)}
                </span>
              )}
            </button>
            {dibuka && (
              <div className="overflow-x-auto border-t border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                      <th className="py-2 pl-4 pr-3">{t.colName}</th>
                      <th className="py-2 pr-3">{t.colGender}</th>
                      <th className="py-2 pr-3">{t.colRace}</th>
                      <th className="py-2 pr-3">{t.colReligion}</th>
                      <th className="py-2 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {senarai.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pl-4 pr-3">
                          <span className="font-medium text-slate-700">{p.nama}</span>
                          <span className="block text-xs text-slate-400">{p.noIc}</span>
                        </td>
                        <td className="py-2 pr-3">
                          <select className={sel} value={p.jantina ?? ""} onChange={(e) => update(p.id, "jantina", e.target.value)}>
                            <option value="">—</option>
                            <option value="L">L</option>
                            <option value="P">P</option>
                          </select>
                        </td>
                        <td className="py-2 pr-3">
                          <select className={sel} value={p.kaum ?? ""} onChange={(e) => update(p.id, "kaum", e.target.value)}>
                            <option value="">—</option>
                            {KAUM.map((k) => <option key={k.v} value={k.v}>{k.l}</option>)}
                          </select>
                        </td>
                        <td className="py-2 pr-3">
                          <select className={sel} value={p.agama ?? ""} onChange={(e) => update(p.id, "agama", e.target.value)}>
                            <option value="">—</option>
                            {AGAMA.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}
                          </select>
                        </td>
                        <td className="py-2 pr-4">
                          <button onClick={() => simpan(p)} disabled={savingId === p.id}
                            className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
                            {savingId === p.id ? "..." : savedId === p.id ? "✓" : t.save}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
