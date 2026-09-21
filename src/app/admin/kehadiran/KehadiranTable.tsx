"use client";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/StatusBadge";

interface Row {
  id: string;
  jenisKoko: string;
  namaUnit: string;
  bil: number;
  tarikh: string; // ISO
  hadir: number;
  total: number;
  peratus: number;
  disahkan: boolean;
}
interface Detail {
  namaUnit: string;
  bilPerjumpaan: number;
  ahli: { nama: string; kelas: string | null; hadir: boolean }[];
}
interface KehadiranDict {
  colUnit: string; colType: string; colMeeting: string; colDate: string; colPresent: string;
  colPercent: string; colStatus: string; meeting: string; loading: string; presentCount: string;
  noAttendanceRecords: string; failedDetail: string; present: string; absent: string; closeLabel: string;
}

function kumpulKelas(ahli: Detail["ahli"]): [string, Detail["ahli"]][] {
  const kumpulan = new Map<string, Detail["ahli"]>();
  for (const a of ahli) {
    const kelas = a.kelas || "—";
    if (!kumpulan.has(kelas)) kumpulan.set(kelas, []);
    kumpulan.get(kelas)!.push(a);
  }
  return [...kumpulan.entries()].sort(([a], [b]) => a.localeCompare(b, "ms"));
}

function kumpulUnit(rows: Row[]): [string, Row[]][] {
  const kumpulan = new Map<string, Row[]>();
  for (const r of rows) {
    if (!kumpulan.has(r.namaUnit)) kumpulan.set(r.namaUnit, []);
    kumpulan.get(r.namaUnit)!.push(r);
  }
  return [...kumpulan.entries()];
}

export function KehadiranTable({ rows, t, expandAll }: { rows: Row[]; t: KehadiranDict; expandAll?: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [kelasDibuka, setKelasDibuka] = useState<Set<string>>(new Set());
  const [unitDibuka, setUnitDibuka] = useState<Set<string>>(() => {
    const semuaUnit = new Set(rows.map((r) => r.namaUnit));
    if (expandAll) return semuaUnit;
    return semuaUnit.size === 1 ? semuaUnit : new Set();
  });

  function togglUnit(namaUnit: string) {
    setUnitDibuka((prev) => {
      const next = new Set(prev);
      if (next.has(namaUnit)) next.delete(namaUnit);
      else next.add(namaUnit);
      return next;
    });
  }

  async function buka(id: string) {
    setOpenId(id);
    setDetail(null);
    setLoading(true);
    setKelasDibuka(new Set());
    try {
      const res = await fetch(`/api/admin/kehadiran/${id}`);
      const json = await res.json();
      if (json.success) setDetail(json.data);
    } finally {
      setLoading(false);
    }
  }

  function togglKelas(kelas: string) {
    setKelasDibuka((prev) => {
      const next = new Set(prev);
      if (next.has(kelas)) next.delete(kelas);
      else next.add(kelas);
      return next;
    });
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <th className="py-2 pr-3">{t.colUnit}</th>
              <th className="py-2 pr-3">{t.colType}</th>
              <th className="py-2 pr-3">{t.colMeeting}</th>
              <th className="py-2 pr-3">{t.colDate}</th>
              <th className="py-2 pr-3">{t.colPresent}</th>
              <th className="py-2 pr-3">{t.colPercent}</th>
              <th className="py-2">{t.colStatus}</th>
            </tr>
          </thead>
          {kumpulUnit(rows).map(([namaUnit, rowsUnit]) => {
            const dibuka = unitDibuka.has(namaUnit);
            const hadirUnit = rowsUnit.reduce((a, r) => a + r.hadir, 0);
            const totalUnit = rowsUnit.reduce((a, r) => a + r.total, 0);
            const peratusUnit = totalUnit ? Math.round((hadirUnit / totalUnit) * 1000) / 10 : 0;
            return (
              <tbody key={namaUnit}>
                <tr onClick={() => togglUnit(namaUnit)} className="cursor-pointer border-b border-slate-200 bg-slate-50 hover:bg-slate-100">
                  <td colSpan={7} className="py-2 pr-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <span className={`inline-block text-xs text-slate-400 transition-transform ${dibuka ? "rotate-90" : ""}`}>▸</span>
                        {namaUnit} <span className="font-normal text-slate-400">({rowsUnit[0].jenisKoko})</span>
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {rowsUnit.length} {t.meeting} · {peratusUnit}%
                      </span>
                    </div>
                  </td>
                </tr>
                {dibuka &&
                  rowsUnit.map((r) => (
                    <tr key={r.id} onClick={() => buka(r.id)} className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="py-2 pr-3 pl-6 text-slate-300">—</td>
                      <td className="py-2 pr-3 text-slate-500">{r.jenisKoko}</td>
                      <td className="py-2 pr-3 text-slate-600">{t.meeting} {r.bil}</td>
                      <td className="py-2 pr-3 text-slate-600">{new Date(r.tarikh).toLocaleDateString("ms-MY")}</td>
                      <td className="py-2 pr-3 text-slate-600">{r.hadir}/{r.total}</td>
                      <td className="py-2 pr-3 font-semibold text-brand-dark">{r.peratus}%</td>
                      <td className="py-2"><StatusBadge status={r.disahkan ? "Approved" : "Pending"} /></td>
                    </tr>
                  ))}
              </tbody>
            );
          })}
        </table>
      </div>

      <Modal open={openId !== null} onClose={() => setOpenId(null)} title={detail ? `${detail.namaUnit} · ${t.meeting} ${detail.bilPerjumpaan}` : t.loading} closeLabel={t.closeLabel}>
        {loading ? (
          <p className="text-sm text-slate-400">{t.loading}</p>
        ) : detail ? (
          <div className="space-y-1">
            <p className="mb-2 text-xs text-slate-500">
              {detail.ahli.filter((a) => a.hadir).length}/{detail.ahli.length} {t.presentCount}
            </p>
            {detail.ahli.length === 0 ? (
              <p className="text-sm text-slate-400">{t.noAttendanceRecords}</p>
            ) : (
              kumpulKelas(detail.ahli).map(([kelas, ahliKelas]) => {
                const dibuka = kelasDibuka.has(kelas);
                const hadirKelas = ahliKelas.filter((a) => a.hadir).length;
                return (
                  <div key={kelas} className="overflow-hidden rounded-md border border-slate-100">
                    <button
                      type="button"
                      onClick={() => togglKelas(kelas)}
                      className="flex w-full items-center justify-between gap-2 bg-slate-50 px-3 py-1.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`inline-block text-xs text-slate-400 transition-transform ${dibuka ? "rotate-90" : ""}`}>▸</span>
                        {kelas}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{hadirKelas}/{ahliKelas.length} {t.presentCount}</span>
                    </button>
                    {dibuka && (
                      <div className="space-y-1 p-1.5">
                        {ahliKelas.map((a, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-1.5 text-sm">
                            <span className="text-slate-700">{a.nama}</span>
                            <span className={`text-xs font-semibold ${a.hadir ? "text-emerald-600" : "text-red-600"}`}>
                              {a.hadir ? t.present : t.absent}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <p className="text-sm text-red-600">{t.failedDetail}</p>
        )}
      </Modal>
    </>
  );
}
