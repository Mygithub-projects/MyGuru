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

export function KehadiranTable({ rows, t }: { rows: Row[]; t: KehadiranDict }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);

  async function buka(id: string) {
    setOpenId(id);
    setDetail(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kehadiran/${id}`);
      const json = await res.json();
      if (json.success) setDetail(json.data);
    } finally {
      setLoading(false);
    }
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
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} onClick={() => buka(r.id)} className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="py-2 pr-3 font-medium text-slate-700">{r.namaUnit}</td>
                <td className="py-2 pr-3 text-slate-500">{r.jenisKoko}</td>
                <td className="py-2 pr-3 text-slate-600">{t.meeting} {r.bil}</td>
                <td className="py-2 pr-3 text-slate-600">{new Date(r.tarikh).toLocaleDateString("ms-MY")}</td>
                <td className="py-2 pr-3 text-slate-600">{r.hadir}/{r.total}</td>
                <td className="py-2 pr-3 font-semibold text-brand-dark">{r.peratus}%</td>
                <td className="py-2"><StatusBadge status={r.disahkan ? "Approved" : "Pending"} /></td>
              </tr>
            ))}
          </tbody>
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
              detail.ahli.map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-1.5 text-sm">
                  <span className="text-slate-700">{a.nama} <span className="text-xs text-slate-400">{a.kelas}</span></span>
                  <span className={`text-xs font-semibold ${a.hadir ? "text-emerald-600" : "text-red-600"}`}>
                    {a.hadir ? t.present : t.absent}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="text-sm text-red-600">{t.failedDetail}</p>
        )}
      </Modal>
    </>
  );
}
