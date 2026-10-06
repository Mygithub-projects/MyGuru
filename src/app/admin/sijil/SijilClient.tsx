"use client";
import { useState } from "react";
import { SijilPreview } from "./SijilPreview";

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
        <SijilPreview
          {...form}
          nama={t.previewStudent}
          barisIdentiti={t.previewIc}
          ayat="telah menyertai dan menunjukkan pencapaian dalam"
          namaAktiviti={t.previewActivity}
          barisPeringkat={t.previewLevel}
          tarikh={t.previewDate}
          noSiri={t.previewSerial}
        />
      </section>
    </div>
  );
}
