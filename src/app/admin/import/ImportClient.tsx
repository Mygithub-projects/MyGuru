"use client";
import { useCallback, useEffect, useState } from "react";

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

export function ImportClient() {
  const [jenis, setJenis] = useState("pajsk");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [preview, setPreview] = useState<{ logId: string; diff: Diff } | null>(null);
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
    muatSejarah();
  }, [muatSejarah]);

  function reset() {
    setPreview(null);
    setHasil(null);
    setMsg(null);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    reset();
    const form = new FormData(e.currentTarget);
    form.set("jenis", jenis);
    try {
      const res = await fetch("/api/admin/import", { method: "POST", body: form });
      const j = await res.json();
      setMsg({ text: j.message, ok: j.success });
      if (j.success) {
        if (j.data?.mod === "pratonton") setPreview({ logId: j.data.logId, diff: j.data.diff });
        else if (j.data?.hasil) setHasil(j.data.hasil);
        muatSejarah();
      }
    } catch {
      setMsg({ text: "Ralat rangkaian", ok: false });
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
      setMsg({ text: "Ralat rangkaian", ok: false });
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
        <div className="flex gap-2">
          {[
            ["pajsk", "PAJSK (Pelajar)"],
            ["guru", "Pendaftaran Guru"],
          ].map(([v, l]) => (
            <button key={v} type="button" onClick={() => { setJenis(v); reset(); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${jenis === v ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>
              {l}
            </button>
          ))}
        </div>

        <input name="fail" type="file" accept=".xlsx,.xls,.csv" required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1" />

        <p className="text-xs text-slate-500">
          {jenis === "pajsk"
            ? "Fail PAJSK dipratonton dahulu — perbezaan dipaparkan sebelum apa-apa markah berubah."
            : "Rekod guru dikemas kini terus (upsert)."}
        </p>

        <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
          {busy ? "Memproses..." : jenis === "pajsk" ? "Pratonton Perbezaan" : "Muat Naik & Import"}
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
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Pratonton Perbezaan</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kiraan label="Jumlah rekod" nilai={preview.diff.jumlah} />
            <Kiraan label="Baharu" nilai={preview.diff.baharu} tone="text-emerald-600" />
            <Kiraan label="Berubah" nilai={preview.diff.berubah} tone="text-amber-600" />
            <Kiraan label="Tiada perubahan" nilai={preview.diff.sama} tone="text-slate-400" />
          </div>

          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            ⚠️ <strong>Amaran:</strong> Pengesahan akan menulis {preview.diff.jumlah} rekod dan{" "}
            <strong>mengira semula markah {preview.diff.baharu + preview.diff.berubah} pelajar</strong>.
            Operasi ini mengubah markah ramai pelajar sekaligus dan tidak boleh dibatalkan secara automatik.
          </div>

          {preview.diff.baris.length > 0 && (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="text-left text-xs uppercase text-slate-400">
                    <th className="px-3 py-2">Pelajar</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Perubahan</th>
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
            <p className="text-xs text-red-600">{preview.diff.ralat.length} amaran parsing (rekod bermasalah dilangkau).</p>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={batal} disabled={busy} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50">
              Batal
            </button>
            <button onClick={sahkan} disabled={busy || !dibolehSahkan}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
              {busy ? "Mengesahkan..." : "Sahkan & Import + Kira Semula"}
            </button>
          </div>
        </div>
      )}

      {/* Keputusan import */}
      {hasil && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
          ✓ Import selesai: <strong>{hasil.berjaya}/{hasil.jumlah}</strong> rekod ditulis
          {typeof hasil.direcalc === "number" ? `; ${hasil.direcalc} pelajar dikira semula.` : "."}
          {hasil.ralat.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer font-semibold">{hasil.ralat.length} amaran</summary>
              <ul className="mt-1 list-inside list-disc text-xs">
                {hasil.ralat.slice(0, 20).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Histori / audit trail */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">Histori Import (Audit)</h2>
        {sejarah.length === 0 ? (
          <p className="text-sm text-slate-400">Tiada rekod import lagi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                  <th className="py-2 pr-3">Tarikh</th>
                  <th className="py-2 pr-3">Fail</th>
                  <th className="py-2 pr-3">Jenis</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Rekod</th>
                  <th className="py-2">Baharu / Berubah</th>
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
