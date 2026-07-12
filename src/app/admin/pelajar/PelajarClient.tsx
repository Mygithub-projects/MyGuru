"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { getDict, type Locale } from "@/lib/i18n";

interface P {
  id: string;
  nama: string;
  noIc: string;
  kelasT6: string | null;
  markahPajskT6: number | null;
  peratusPajskT6: number | null;
  statusAktif: boolean;
  kelab: string | null;
  sukan: string | null;
  badan: string | null;
}

export function PelajarClient({ pelajar: initial, locale = "ms" }: { pelajar: P[]; locale?: Locale }) {
  const t = getDict(locale);
  const L = (ms: string, en: string) => (locale === "en" ? en : ms);
  const [rows, setRows] = useState(initial);
  const [cari, setCari] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; teks: string } | null>(null);

  const ditapis = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        p.noIc.includes(q) ||
        (p.kelasT6 ?? "").toLowerCase().includes(q)
    );
  }, [rows, cari]);

  async function padam(p: P) {
    if (!window.confirm(`Padam pelajar "${p.nama}"?\n\nTindakan ini KEKAL dan akan memadam akaun log masuk serta semua rekod berkaitan (markah, kehadiran, pencapaian, laporan). Tidak boleh dibatalkan.`)) {
      return;
    }
    setBusyId(p.id);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/pelajar/${p.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setRows((r) => r.filter((x) => x.id !== p.id));
        setMsg({ ok: true, teks: j.message ?? "Pelajar dipadam." });
      } else {
        setMsg({ ok: false, teks: j.message ?? "Gagal memadam pelajar." });
      }
    } catch {
      setMsg({ ok: false, teks: "Ralat rangkaian." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder={L("Cari nama, No. IC, atau kelas…", "Search name, IC, or class…")}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <span className="shrink-0 text-xs text-slate-400">{ditapis.length} / {rows.length}</span>
      </div>

      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.teks}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">{t.guru.colName}</th>
              <th className="px-4 py-3">{L("No. IC", "IC No.")}</th>
              <th className="px-4 py-3">{L("Kelas T6", "Class F6")}</th>
              <th className="px-4 py-3">{t.admin.colUnits}</th>
              <th className="px-4 py-3">{t.admin.colPajsk}</th>
              <th className="px-4 py-3">{t.admin.colStatus}</th>
              <th className="px-4 py-3 text-right">{t.admin.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {ditapis.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{p.nama}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.noIc}</td>
                <td className="px-4 py-3 text-slate-600">{p.kelasT6 ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <div className="space-y-0.5">
                    <div>🎭 {p.kelab ?? "—"}</div>
                    <div>⚽ {p.sukan ?? "—"}</div>
                    <div>🎖️ {p.badan ?? "—"}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {p.markahPajskT6 != null ? `${p.markahPajskT6} (${p.peratusPajskT6 ?? 0}%)` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.statusAktif ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {p.statusAktif ? L("Aktif", "Active") : L("Tidak aktif", "Inactive")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/pelajar/${p.id}`}
                      className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200"
                    >
                      {t.admin.detail}
                    </Link>
                    <a
                      href={`/api/pelajar/${p.id}/butiran-diri?download=1`}
                      className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200"
                    >
                      ⬇ PDF
                    </a>
                    <Link
                      href={`/admin/pelajar/${p.id}/edit`}
                      className="rounded-md bg-brand-light px-3 py-1.5 text-xs font-semibold text-brand-dark ring-1 ring-brand/20 hover:bg-brand hover:text-white"
                    >
                      {t.admin.edit}
                    </Link>
                    <button
                      onClick={() => padam(p)}
                      disabled={busyId === p.id}
                      className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-600 hover:text-white disabled:opacity-50"
                    >
                      {busyId === p.id ? L("Memadam…", "Deleting…") : L("Padam", "Delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {ditapis.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                  {L("Tiada pelajar dijumpai.", "No students found.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
