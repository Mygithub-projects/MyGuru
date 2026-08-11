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

type SortKey = "nama" | "noIc" | "kelasT6" | "markahPajskT6" | "statusAktif";
type SortDir = "asc" | "desc";

function cmpValues(a: P, b: P, key: SortKey): number {
  switch (key) {
    case "markahPajskT6": {
      if (a.markahPajskT6 == null && b.markahPajskT6 == null) return 0;
      if (a.markahPajskT6 == null) return 1;
      if (b.markahPajskT6 == null) return -1;
      return a.markahPajskT6 - b.markahPajskT6;
    }
    case "statusAktif":
      return Number(b.statusAktif) - Number(a.statusAktif);
    case "kelasT6":
      return (a.kelasT6 ?? "").localeCompare(b.kelasT6 ?? "");
    default:
      return a[key].localeCompare(b[key]);
  }
}

export function PelajarClient({ pelajar: initial, locale = "ms" }: { pelajar: P[]; locale?: Locale }) {
  const t = getDict(locale);
  const L = (ms: string, en: string) => (locale === "en" ? en : ms);
  const [rows, setRows] = useState(initial);
  const [cari, setCari] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "nama", dir: "asc" });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; teks: string } | null>(null);

  const senaraiKelas = useMemo(
    () => [...new Set(rows.map((p) => p.kelasT6).filter((k): k is string => !!k))].sort(),
    [rows]
  );

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }
  function sortIcon(sortKey: SortKey) {
    if (sort.key !== sortKey) return <span className="text-slate-300">↕</span>;
    return <span className="text-brand-dark">{sort.dir === "asc" ? "↑" : "↓"}</span>;
  }

  const ditapis = useMemo(() => {
    const q = cari.trim().toLowerCase();
    let hasil = rows;
    if (q) {
      hasil = hasil.filter(
        (p) =>
          p.nama.toLowerCase().includes(q) ||
          p.noIc.includes(q) ||
          (p.kelasT6 ?? "").toLowerCase().includes(q)
      );
    }
    if (kelasFilter) hasil = hasil.filter((p) => p.kelasT6 === kelasFilter);
    const dirMul = sort.dir === "asc" ? 1 : -1;
    return [...hasil].sort((a, b) => cmpValues(a, b, sort.key) * dirMul);
  }, [rows, cari, kelasFilter, sort]);

  async function resetKataLaluan(p: P) {
    if (!window.confirm(`Reset kata laluan "${p.nama}"?\n\nKata laluan akan ditetapkan semula kepada No. IC (${p.noIc}). Pelajar dipaksa menukar kata laluan semasa log masuk berikutnya.`)) {
      return;
    }
    setBusyId(p.id);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/pelajar/${p.id}/reset-kata-laluan`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ ok: true, teks: j.message ?? `Kata laluan direset kepada No. IC (${p.noIc}).` });
      } else {
        setMsg({ ok: false, teks: j.message ?? "Gagal reset kata laluan." });
      }
    } catch {
      setMsg({ ok: false, teks: "Ralat rangkaian." });
    } finally {
      setBusyId(null);
    }
  }

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
        <select
          value={kelasFilter}
          onChange={(e) => setKelasFilter(e.target.value)}
          className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">{L("Semua Kelas", "All Classes")}</option>
          {senaraiKelas.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
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
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort("nama")} className="inline-flex items-center gap-1 hover:text-slate-700">
                  {t.guru.colName} {sortIcon("nama")}
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort("noIc")} className="inline-flex items-center gap-1 hover:text-slate-700">
                  {L("No. IC", "IC No.")} {sortIcon("noIc")}
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort("kelasT6")} className="inline-flex items-center gap-1 hover:text-slate-700">
                  {L("Kelas T6", "Class F6")} {sortIcon("kelasT6")}
                </button>
              </th>
              <th className="px-4 py-3">{t.admin.colUnits}</th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort("markahPajskT6")} className="inline-flex items-center gap-1 hover:text-slate-700">
                  {t.admin.colPajsk} {sortIcon("markahPajskT6")}
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort("statusAktif")} className="inline-flex items-center gap-1 hover:text-slate-700">
                  {t.admin.colStatus} {sortIcon("statusAktif")}
                </button>
              </th>
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
                      onClick={() => resetKataLaluan(p)}
                      disabled={busyId === p.id}
                      title={L("Reset kata laluan kepada No. IC", "Reset password to IC No.")}
                      className="rounded-md bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-500 hover:text-white disabled:opacity-50"
                    >
                      {busyId === p.id ? L("Menetapkan…", "Resetting…") : L("Reset KL", "Reset PW")}
                    </button>
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
