"use client";
import { useState } from "react";

interface T {
  institusi: string;
  tajukSijil: string;
  namaPenandatangan: string;
  jawatanPenandatangan: string;
  teksCop: string;
}

export function SijilClient({ tetapan }: { tetapan: T }) {
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
    { k: "institusi", l: "Nama Institusi" },
    { k: "tajukSijil", l: "Tajuk Sijil" },
    { k: "namaPenandatangan", l: "Nama Penandatangan" },
    { k: "jawatanPenandatangan", l: "Jawatan Penandatangan" },
    { k: "teksCop", l: "Teks Cop (pilihan)" },
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
          {busy ? "Menyimpan..." : "Simpan Templat"}
        </button>
      </section>

      {/* Pratonton ringkas */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">Pratonton</h2>
        <div className="rounded-lg border-2 border-brand p-6 text-center">
          <p className="text-xs font-bold uppercase text-brand-dark">{form.institusi}</p>
          <p className="mt-2 text-lg font-bold text-slate-800">{form.tajukSijil}</p>
          <p className="mt-6 text-sm text-slate-400">[ Nama Pelajar ]</p>
          <p className="text-xs text-slate-400">[ Aktiviti · Peringkat · Markah ]</p>
          <div className="mt-8 text-right text-xs">
            <div className="ml-auto w-48 border-t border-slate-300 pt-1">
              {form.namaPenandatangan && <p className="font-semibold text-slate-700">{form.namaPenandatangan}</p>}
              <p className="text-slate-500">{form.jawatanPenandatangan}</p>
              {form.teksCop && <p className="text-slate-400">{form.teksCop}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
