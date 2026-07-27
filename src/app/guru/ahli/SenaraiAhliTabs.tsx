"use client";
import { useState } from "react";
import { JawatanAssign } from "./JawatanAssign";

interface Ahli {
  pelajarId: string;
  nama: string;
  kelas: string | null;
  jawatan: string | null;
  markahJawatan: number;
  subRole: string;
  markahPajskT6: number | null;
  gred: string | null;
}
interface Unit {
  namaUnit: string;
  jenisKoko: string;
  ahli: Ahli[];
}
interface Labels {
  name: string;
  kelas: string;
  currentPos: string;
  mark: string;
  setPos: string;
  members: string;
}
interface TabsDict {
  tabsAriaLabel: string; marksComputed: string; marksNotYet: string;
  jawatanAssign: { placeholder: string; assignTitle: string; networkError: string };
}

// §5 — senarai pelajar dashboard guru dipaparkan ikut TAB (satu tab per unit)
// bukan senarai panjang leper. Setiap tab papar kiraan & status ringkas.
export function SenaraiAhliTabs({ units, labels, t }: { units: Unit[]; labels: Labels; t: TabsDict }) {
  const [aktif, setAktif] = useState(0);
  const unit = units[aktif] ?? units[0];
  if (!unit) return null;

  const lengkap = unit.ahli.filter((a) => (a.markahPajskT6 ?? 0) > 0).length;
  const belum = unit.ahli.length - lengkap;

  return (
    <div className="space-y-4">
      {/* Tab bar — satu tab per unit seliaan */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.tabsAriaLabel}>
        {units.map((u, i) => {
          const on = i === aktif;
          return (
            <button
              key={u.namaUnit}
              role="tab"
              aria-selected={on}
              onClick={() => setAktif(i)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ring-1 ${
                on
                  ? "bg-brand text-white ring-brand shadow-sm"
                  : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                  on ? "bg-white/20 text-white" : "bg-brand-light text-brand-dark"
                }`}
              >
                {u.jenisKoko}
              </span>
              <span className="max-w-[14rem] truncate">{u.namaUnit}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  on ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {u.ahli.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status ringkas unit aktif */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-600">
          {unit.ahli.length} {labels.members}
        </span>
        <span className="rounded-md bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">
          ✓ {lengkap} {t.marksComputed}
        </span>
        {belum > 0 && (
          <span className="rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-700">
            ⏳ {belum} {t.marksNotYet}
          </span>
        )}
      </div>

      {/* Jadual ahli unit aktif */}
      <div className="overflow-x-auto rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <th className="py-2 pr-3">{labels.name}</th>
              <th className="py-2 pr-3">{labels.kelas}</th>
              <th className="py-2 pr-3">{labels.currentPos}</th>
              <th className="py-2 pr-3">{labels.mark}</th>
              <th className="py-2">{labels.setPos}</th>
            </tr>
          </thead>
          <tbody>
            {unit.ahli.map((a) => (
              <tr key={a.pelajarId} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-3 font-medium text-slate-700">
                  {a.nama}
                  {a.subRole !== "Pelajar" && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                      {a.subRole}
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3 text-slate-600">{a.kelas ?? "-"}</td>
                <td className="py-2 pr-3 text-slate-600">{a.jawatan ?? "-"}</td>
                <td className="py-2 pr-3 text-slate-600">
                  {a.markahJawatan}
                  {a.markahPajskT6 != null && (
                    <span className="ml-2 text-xs text-slate-400">
                      · {a.markahPajskT6}/100{a.gred ? ` (${a.gred})` : ""}
                    </span>
                  )}
                </td>
                <td className="py-2">
                  <JawatanAssign pelajarId={a.pelajarId} jenisKoko={unit.jenisKoko} current={a.jawatan} t={t.jawatanAssign} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
