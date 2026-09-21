"use client";
import { useMemo, useState } from "react";

interface Row {
  nama: string;
  kelas: string | null;
  jenisKoko: string;
  namaUnit: string;
  jawatan: string;
  status: string;
}
interface Dict {
  colUnit: string;
  expandAll: string;
  collapseAll: string;
}
interface HeaderDict {
  roleStudent: string;
}
interface CommonDict {
  jawatan: string;
}

export function StatusPilihanTable({
  rows, t, header, common,
}: { rows: Row[]; t: Dict; header: HeaderDict; common: CommonDict }) {
  const kumpulan = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      if (!map.has(r.namaUnit)) map.set(r.namaUnit, []);
      map.get(r.namaUnit)!.push(r);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "ms"));
  }, [rows]);

  const [terbuka, setTerbuka] = useState<Set<string>>(() => new Set(kumpulan.length === 1 ? [kumpulan[0][0]] : []));

  function toggl(namaUnit: string) {
    setTerbuka((s) => {
      const n = new Set(s);
      if (n.has(namaUnit)) n.delete(namaUnit); else n.add(namaUnit);
      return n;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 text-xs">
        <button type="button" onClick={() => setTerbuka(new Set(kumpulan.map(([k]) => k)))} className="rounded-md bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200">
          {t.expandAll}
        </button>
        <button type="button" onClick={() => setTerbuka(new Set())} className="rounded-md bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200">
          {t.collapseAll}
        </button>
      </div>

      {kumpulan.map(([namaUnit, senarai]) => {
        const dibuka = terbuka.has(namaUnit);
        return (
          <div key={namaUnit} className="overflow-hidden rounded-xl border border-slate-100">
            <button
              type="button"
              onClick={() => toggl(namaUnit)}
              className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-2.5 text-left hover:bg-slate-100"
            >
              <span className="flex items-center gap-2">
                <span className={`text-xs text-slate-400 transition-transform ${dibuka ? "rotate-90" : ""}`}>▸</span>
                <span className="font-semibold text-slate-700">{namaUnit}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 ring-1 ring-slate-200">{senarai.length}</span>
              </span>
            </button>
            {dibuka && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                      <th className="py-2 pl-4 pr-3">{header.roleStudent}</th>
                      <th className="py-2 pr-3">{t.colUnit}</th>
                      <th className="py-2 pr-4">{common.jawatan}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {senarai.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pl-4 pr-3 font-medium text-slate-700">{r.nama}</td>
                        <td className="py-2 pr-3 text-slate-600">{r.jenisKoko}: {r.namaUnit}</td>
                        <td className="py-2 pr-4 text-slate-600">{r.jawatan}</td>
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
