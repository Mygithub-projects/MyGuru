"use client";
import { useCallback, useEffect, useState } from "react";

interface ImportDict {
  pajskTab: string; guruTab: string; choosePajskInfo: string; guruUpsertInfo: string;
  previewBtn: string; uploadBtn: string; processing: string; previewTitle: string;
  totalRecords: string; newLabel: string; changedLabel: string; unchangedLabel: string;
  warningPrefix: string; warningWillRecalcTpl: string; warningSuffix: string;
  studentCol: string; statusCol: string; changesCol: string; parseWarningsTpl: string;
  cancel: string; confirmImport: string; confirming: string;
  importDoneTpl: string; recalcedTpl: string;
  warningsCountTpl: string; historyTitle: string; noHistory: string;
  dateCol: string; fileCol: string; typeCol: string; recordsCol: string; newChangedCol: string;
  networkError: string;
  pelajarBaruTab: string; pelajarBaruInfo: string; pelajarBaruWarningTpl: string;
  noFileSelected: string;
}

interface DiffBaris {
  noIc: string;
  nama: string;
  status: "baharu" | "berubah" | "sama";
  perubahan: string[];
}
interface Diff {
  jumlah: number;
  baharu: number;
  berubah: number;
  sama: number;
  tanpaIc: number;
  ralat: string[];
  baris: DiffBaris[];
}
interface Sejarah {
  id: string;
  jenis: string;
  namaFail: string;
  status: string;
  jumlah: number;
  baharu: number;
  berubah: number;
  ralatCount: number;
  createdAt: string;
  appliedAt: string | null;
}

const fmt = (s: string) => new Date(s).toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" });
const STATUS_TONE: Record<string, string> = {
  Applied: "bg-emerald-100 text-emerald-700",
  Preview: "bg-amber-100 text-amber-700",
  Batal: "bg-slate-100 text-slate-500",
};

export function ImportClient({ t }: { t: ImportDict }) {
  const [jenis, setJenis] = useState("pajsk");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [preview, setPreview] = useState<{ logId: string; diff: Diff; jenis: string } | null>(null);
  const [hasil, setHasil] = useState<{ berjaya: number; jumlah: number; ralat: string[]; direcalc?: number } | null>(null);
  const [sejarah, setSejarah] = useState<Sejarah[]>([]);

  const muatSejarah = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/import");
      const j = await res.json();
      if (j.success) setSejarah(j.data);
    } catch {
      /* abaikan */
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- muat sejarah semasa mount
    muatSejarah();
  }, [muatSejarah]);

  function reset() {
    setPreview(null);
    setHasil(null);
    setMsg(null);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
    const form = new FormData(e.currentTarget);
    const fail = form.get("fail");
    if (!(fail instanceof File) || fail.size === 0) {
      setMsg({ text: t.noFileSelected, ok: false });
      return;
    }
    setBusy(true);
    form.set("jenis", jenis);
    try {
      const res = await fetch("/api/admin/import", { method: "POST", body: form });
      const j = await res.json();
      setMsg({ text: j.message, ok: j.success });
      if (j.success) {
        if (j.data?.mod === "pratonton") setPreview({ logId: j.data.logId, diff: j.data.diff, jenis });
        else if (j.data?.hasil) setHasil(j.data.hasil);
        muatSejarah();
      }
    } catch {
      setMsg({ text: t.networkError, ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function sahkan() {
    if (!preview) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/import/${preview.logId}`, { method: "POST" });
      const j = await res.json();
      setMsg({ text: j.message, ok: j.success });
      if (j.success) {
        setHasil({ ...j.data.hasil, direcalc: j.data.direcalc });
        setPreview(null);
        muatSejarah();
      }
    } catch {
      setMsg({ text: t.networkError, ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function batal() {
    if (!preview) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/import/${preview.logId}`, { method: "DELETE" });
      reset();
      muatSejarah();
    } finally {
      setBusy(false);
    }
  }

  const dibolehSahkan = preview && preview.diff.baharu + preview.diff.berubah > 0;

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap gap-2">
          {[
            ["pajsk", t.pajskTab],
            ["pelajarbaru", t.pelajarBaruTab],
            ["guru", t.guruTab],
          ].map(([v, l]) => (
            <button key={v} type="button" onClick={() => { setJenis(v); reset(); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${jenis === v ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>
              {l}
            </button>
          ))}
        </div>

        <input name="fail" type="file" accept=".xlsx,.xls,.csv"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1" />

        <p className="text-xs text-slate-500">
          {jenis === "pajsk" ? t.choosePajskInfo : jenis === "pelajarbaru" ? t.pelajarBaruInfo : t.guruUpsertInfo}
        </p>

        <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
          {busy ? t.processing : jenis === "guru" ? t.uploadBtn : t.previewBtn}
        </button>

        {msg && (
          <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
            {msg.text}
          </div>
        )}
      </form>

      {/* Pratonton diff + pengesahan */}
      {preview && (
        <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">{t.previewTitle}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kiraan label={t.totalRecords} nilai={preview.diff.jumlah} />
            <Kiraan label={t.newLabel} nilai={preview.diff.baharu} tone="text-emerald-600" />
            <Kiraan label={t.changedLabel} nilai={preview.diff.berubah} tone="text-amber-600" />
            <Kiraan label={t.unchangedLabel} nilai={preview.diff.sama} tone="text-slate-400" />
          </div>

          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            {preview.jenis === "pelajarbaru" ? (
              t.pelajarBaruWarningTpl.replace("{n}", String(preview.diff.baharu + preview.diff.berubah))
            ) : (
              <>
                {t.warningPrefix}{" "}
                <strong>
                  {t.warningWillRecalcTpl
                    .replace("{n1}", String(preview.diff.jumlah))
                    .replace("{n2}", String(preview.diff.baharu + preview.diff.berubah))}
                </strong>
                . {t.warningSuffix}
              </>
            )}
          </div>

          {preview.diff.baris.length > 0 && (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="text-left text-xs uppercase text-slate-400">
                    <th className="px-3 py-2">{t.studentCol}</th>
                    <th className="px-3 py-2">{t.statusCol}</th>
                    <th className="px-3 py-2">{t.changesCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.diff.baris.map((b) => (
                    <tr key={b.noIc} className="border-t border-slate-100 align-top">
                      <td className="px-3 py-2 font-medium text-slate-700">{b.nama}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${b.status === "baharu" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {b.perubahan.length ? b.perubahan.join(" · ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {preview.diff.ralat.length > 0 && (
            <p className="text-xs text-red-600">{t.parseWarningsTpl.replace("{n}", String(preview.diff.ralat.length))}</p>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={batal} disabled={busy} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50">
              {t.cancel}
            </button>
            <button onClick={sahkan} disabled={busy || !dibolehSahkan}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
              {busy ? t.confirming : t.confirmImport}
            </button>
          </div>
        </div>
      )}

      {/* Keputusan import */}
      {hasil && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {t.importDoneTpl.replace("{ok}", String(hasil.berjaya)).replace("{total}", String(hasil.jumlah))}
          {hasil.direcalc ? t.recalcedTpl.replace("{n}", String(hasil.direcalc)) : "."}
          {hasil.ralat.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer font-semibold">{t.warningsCountTpl.replace("{n}", String(hasil.ralat.length))}</summary>
              <ul className="mt-1 list-inside list-disc text-xs">
                {hasil.ralat.slice(0, 20).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Histori / audit trail */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.historyTitle}</h2>
        {sejarah.length === 0 ? (
          <p className="text-sm text-slate-400">{t.noHistory}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                  <th className="py-2 pr-3">{t.dateCol}</th>
                  <th className="py-2 pr-3">{t.fileCol}</th>
                  <th className="py-2 pr-3">{t.typeCol}</th>
                  <th className="py-2 pr-3">{t.statusCol}</th>
                  <th className="py-2 pr-3">{t.recordsCol}</th>
                  <th className="py-2">{t.newChangedCol}</th>
                </tr>
              </thead>
              <tbody>
                {sejarah.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 text-slate-600">{fmt(s.createdAt)}</td>
                    <td className="py-2 pr-3 font-medium text-slate-700">{s.namaFail}</td>
                    <td className="py-2 pr-3 uppercase text-slate-500">{s.jenis}</td>
                    <td className="py-2 pr-3">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_TONE[s.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-600">{s.jumlah}</td>
                    <td className="py-2 text-slate-600">{s.baharu} / {s.berubah}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Kiraan({ label, nilai, tone = "text-slate-800" }: { label: string; nilai: number; tone?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{nilai}</p>
    </div>
  );
}
