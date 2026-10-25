"use client";
import { useState } from "react";
import { SijilPreview } from "./SijilPreview";
import type { TetapanSijilData } from "@/lib/tetapan-sijil";

interface TandatanganDict {
  subtitle: string; current: string; none: string; choose: string; hint: string; tooBig: string; wrongType: string;
  save: string; saving: string; remove: string; removeConfirm: string; preview: string; programNote: string;
}
interface PreviewDict {
  previewStudent: string; previewActivity: string; previewIc: string; previewLevel: string; previewDate: string; previewSerial: string;
}

const MAKS_BAIT = 300 * 1024;

export function TandatanganClient({ tetapan, t, tp }: { tetapan: TetapanSijilData; t: TandatanganDict; tp: PreviewDict }) {
  const [tersimpan, setTersimpan] = useState(tetapan.tandatangan);
  const [baru, setBaru] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const fail = e.target.files?.[0];
    e.target.value = "";
    setMsg(null);
    if (!fail) return;
    if (!["image/png", "image/jpeg"].includes(fail.type)) { setMsg({ text: t.wrongType, ok: false }); return; }
    if (fail.size > MAKS_BAIT) { setMsg({ text: t.tooBig, ok: false }); return; }
    const r = new FileReader();
    r.onload = () => setBaru(r.result as string);
    r.readAsDataURL(fail);
  }

  async function hantar(method: "PUT" | "DELETE") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/tetapan/sijil/tandatangan", {
        method,
        headers: { "Content-Type": "application/json" },
        ...(method === "PUT" ? { body: JSON.stringify({ dataUrl: baru }) } : {}),
      });
      const json = await res.json();
      setMsg({ text: json.message, ok: json.success });
      if (json.success) {
        setTersimpan(method === "PUT" ? baru : null);
        setBaru(null);
      }
    } finally {
      setBusy(false);
    }
  }

  const papar = baru ?? tersimpan;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:self-start">
        <p className="text-sm text-slate-600">{t.subtitle}</p>
        {msg && (
          <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
            {msg.text}
          </div>
        )}

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">{t.current}</p>
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-[repeating-conic-gradient(#f1f5f9_0_25%,white_0_50%)] bg-[length:16px_16px] p-3">
            {papar
              ? <img src={papar} alt={t.current} className="max-h-full max-w-full object-contain" />
              : <p className="text-center text-xs text-slate-400">{t.none}</p>}
          </div>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">{t.choose}</span>
          <input type="file" accept="image/png,image/jpeg" onChange={pilih}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-dark hover:file:bg-brand hover:file:text-white" />
          <span className="mt-1 block text-xs text-slate-400">{t.hint}</span>
        </label>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => hantar("PUT")} disabled={busy || !baru}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
            {busy ? t.saving : t.save}
          </button>
          {tersimpan && !baru && (
            <button onClick={() => window.confirm(t.removeConfirm) && hantar("DELETE")} disabled={busy}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50">
              {t.remove}
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500">{t.programNote}</p>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.preview}</h2>
        <SijilPreview
          {...tetapan}
          tandatangan={papar}
          nama={tp.previewStudent}
          barisIdentiti={tp.previewIc}
          ayat="telah menyertai dan menunjukkan pencapaian dalam"
          namaAktiviti={tp.previewActivity}
          barisPeringkat={tp.previewLevel}
          tarikh={tp.previewDate}
          noSiri={tp.previewSerial}
        />
      </section>
    </div>
  );
}
