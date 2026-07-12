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

export function KehadiranTable({ rows }: { rows: Row[] }) {
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
              <th className="py-2 pr-3">Unit</th>
              <th className="py-2 pr-3">Jenis</th>
              <th className="py-2 pr-3">Perjumpaan</th>
              <th className="py-2 pr-3">Tarikh</th>
              <th className="py-2 pr-3">Hadir</th>
              <th className="py-2 pr-3">%</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} onClick={() => buka(r.id)} className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="py-2 pr-3 font-medium text-slate-700">{r.namaUnit}</td>
                <td className="py-2 pr-3 text-slate-500">{r.jenisKoko}</td>
                <td className="py-2 pr-3 text-slate-600">Perjumpaan {r.bil}</td>
                <td className="py-2 pr-3 text-slate-600">{new Date(r.tarikh).toLocaleDateString("ms-MY")}</td>
                <td className="py-2 pr-3 text-slate-600">{r.hadir}/{r.total}</td>
                <td className="py-2 pr-3 font-semibold text-brand-dark">{r.peratus}%</td>
                <td className="py-2"><StatusBadge status={r.disahkan ? "Approved" : "Pending"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={openId !== null} onClose={() => setOpenId(null)} title={detail ? `${detail.namaUnit} · Perjumpaan ${detail.bilPerjumpaan}` : "Senarai Kehadiran"}>
        {loading ? (
          <p className="text-sm text-slate-400">Memuatkan…</p>
        ) : detail ? (
          <div className="space-y-1">
            <p className="mb-2 text-xs text-slate-500">
              {detail.ahli.filter((a) => a.hadir).length}/{detail.ahli.length} hadir
            </p>
            {detail.ahli.length === 0 ? (
              <p className="text-sm text-slate-400">Tiada rekod kehadiran ditanda.</p>
            ) : (
              detail.ahli.map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-1.5 text-sm">
                  <span className="text-slate-700">{a.nama} <span className="text-xs text-slate-400">{a.kelas}</span></span>
                  <span className={`text-xs font-semibold ${a.hadir ? "text-emerald-600" : "text-red-600"}`}>
                    {a.hadir ? "✓ Hadir" : "✗ Tidak Hadir"}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="text-sm text-red-600">Gagal memuat butiran.</p>
        )}
      </Modal>
    </>
  );
}
