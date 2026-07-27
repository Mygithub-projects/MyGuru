"use client";
import { useState } from "react";

interface T {
  institusi: string;
  tajukSijil: string;
  namaPenandatangan: string;
  jawatanPenandatangan: string;
  teksCop: string;
}
interface SijilDict {
  instName: string; certTitle: string; signerName: string; signerPosition: string; stampText: string;
  saveTemplate: string; saving: string; previewTitle: string; previewStudent: string; previewActivity: string;
  previewIc: string; previewLevel: string; previewDate: string; previewSerial: string;
}

// Warna & susun atur sepadan tepat dengan janaECertPDF (src/lib/pdf.ts) — A4 landskap 842x595.
// Kedudukan y SVG = 595 - y_pdf supaya koordinat boleh disalin terus daripada pdf.ts.
const BRAND = "rgb(13,110,94)";
const DARK = "rgb(15,23,41)";
const GREY = "rgb(102,115,128)";
const FONT = "Helvetica, Arial, sans-serif";

export function SijilClient({ tetapan, t }: { tetapan: T; t: SijilDict }) {
  const [form, setForm] = useState<T>(tetapan);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function set<K extends keyof T>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function simpan() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/tetapan/sijil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      setMsg({ text: json.message, ok: json.success });
    } finally {
      setBusy(false);
    }
  }

  const cls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
  const fields: { k: keyof T; l: string }[] = [
    { k: "institusi", l: t.instName },
    { k: "tajukSijil", l: t.certTitle },
    { k: "namaPenandatangan", l: t.signerName },
    { k: "jawatanPenandatangan", l: t.signerPosition },
    { k: "teksCop", l: t.stampText },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        {msg && (
          <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
            {msg.text}
          </div>
        )}
        {fields.map((f) => (
          <label key={f.k} className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">{f.l}</span>
            <input value={form[f.k]} onChange={(e) => set(f.k, e.target.value)} className={cls} />
          </label>
        ))}
        <button onClick={simpan} disabled={busy} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
          {busy ? t.saving : t.saveTemplate}
        </button>
      </section>

      {/* Pratonton — sepadan tepat dengan janaECertPDF (susun atur, saiz fon, warna) */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.previewTitle}</h2>
        <svg viewBox="0 0 842 595" className="w-full rounded-lg" style={{ fontFamily: FONT }}>
          <rect x={0} y={0} width={842} height={595} fill="white" />
          <rect x={20} y={20} width={802} height={555} fill="none" stroke={BRAND} strokeWidth={3} />
          <rect x={28} y={28} width={786} height={539} fill="none" stroke={BRAND} strokeWidth={1} />

          <image href="/logo-kpm.jpeg" x={386} y={50} width={70} height={70} />

          <text x={421} y={145} textAnchor="middle" fontSize={16} fontWeight={700} fill={BRAND}>
            {(form.institusi || "").toUpperCase()}
          </text>
          <text x={421} y={175} textAnchor="middle" fontSize={22} fontWeight={700} fill={DARK}>
            {form.tajukSijil}
          </text>
          <text x={421} y={195} textAnchor="middle" fontSize={11} fill={GREY}>
            e-Cert · Sistem KoKurikulum
          </text>

          <text x={421} y={240} textAnchor="middle" fontSize={13} fill={GREY}>
            Dengan ini disahkan bahawa
          </text>
          <text x={421} y={275} textAnchor="middle" fontSize={26} fontWeight={700} fill={DARK}>
            {t.previewStudent}
          </text>
          <text x={421} y={298} textAnchor="middle" fontSize={12} fill={GREY}>
            {t.previewIc}
          </text>

          <text x={421} y={335} textAnchor="middle" fontSize={13} fill={GREY}>
            telah menyertai dan menunjukkan pencapaian dalam
          </text>
          <text x={421} y={365} textAnchor="middle" fontSize={18} fontWeight={700} fill={BRAND}>
            {t.previewActivity}
          </text>
          <text x={421} y={388} textAnchor="middle" fontSize={13} fill={DARK}>
            {t.previewLevel}
          </text>

          <text x={80} y={505} fontSize={11} fill={DARK}>{t.previewDate}</text>
          <text x={80} y={523} fontSize={10} fill={GREY}>{t.previewSerial}</text>

          <line x1={562} y1={485} x2={762} y2={485} stroke={GREY} strokeWidth={1} />
          {form.namaPenandatangan && (
            <text x={567} y={501} fontSize={10} fontWeight={700} fill={DARK}>{form.namaPenandatangan}</text>
          )}
          <text x={567} y={515} fontSize={9} fill={GREY}>{form.jawatanPenandatangan}</text>
          {form.teksCop && <text x={567} y={529} fontSize={8} fill={GREY}>{form.teksCop}</text>}

          <text x={421} y={545} textAnchor="middle" fontSize={8} fill={GREY}>
            Sahkan keaslian sijil ini melalui No. Siri di portal KoKurikulum.
          </text>
        </svg>
      </section>
    </div>
  );
}
