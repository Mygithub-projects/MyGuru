"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Borang pelajar: hantar program Ekstra Kurikulum (Anugerah Khas) untuk pengesahan Ketua Unit Kokurikulum. */
export function EkstraForm({ pelajarId, perkara }: { pelajarId: string; perkara: readonly string[] }) {
  const router = useRouter();
  const en = useLocale() === "en";
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const fail = form.get("eviden");
    if (fail instanceof File && fail.size > MAX_UPLOAD_BYTES) {
      setMsg({ text: en ? "Certificate file exceeds 4 MB." : "Fail sijil melebihi 4 MB.", ok: false });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/pelajar/${pelajarId}/ekstra`, { method: "POST", body: form });
      let json: { success: boolean; message: string } | null = null;
      try { json = await res.json(); } catch { /* bukan JSON */ }
      if (json) {
        setMsg({ text: json.message, ok: json.success });
        if (json.success) { formEl.reset(); router.refresh(); }
      } else {
        setMsg({ text: `${en ? "Request failed" : "Permintaan gagal"} (${res.status})`, ok: false });
      }
    } catch {
      setMsg({ text: en ? "Network error. Try again." : "Ralat rangkaian. Cuba lagi.", ok: false });
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-600">{en ? "Submit Extra-Curricular" : "Hantar Ekstra Kurikulum"}</h2>
      <p className="mb-4 text-xs text-slate-500">
        {en
          ? "Special awards (e.g. Anugerah Remaja Perdana, Pengakap Raja, special sports awards, international participation). Verified by the Head of Co-curriculum Unit."
          : "Anugerah khas (cth. Anugerah Remaja Perdana, Pengakap Raja, anugerah khas sukan, penyertaan antarabangsa). Disahkan oleh Ketua Unit Kokurikulum."}
      </p>
      {msg && (
        <div className={`mb-3 rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.text}
        </div>
      )}
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">{en ? "Programme / activity name" : "Nama Program / Aktiviti"}
          <input name="namaPencapaian" maxLength={200} className={inputCls} required />
        </label>
        <label className="text-sm sm:col-span-2">{en ? "Level" : "Peringkat"}
          <select name="peringkat" className={inputCls} required defaultValue="">
            <option value="" disabled>{en ? "— Choose level —" : "— Pilih peringkat —"}</option>
            {perkara.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="text-sm">{en ? "Programme date" : "Tarikh Program"}
          <input type="date" name="tarikh" className={inputCls} required />
        </label>
        <label className="text-sm sm:col-span-2">{en ? "Venue" : "Tempat"}
          <input name="tempat" maxLength={200} className={inputCls} required />
        </label>
        <label className="text-sm sm:col-span-2">{en ? "Upload certificate (evidence)" : "Muat naik eviden sijil"}
          <input type="file" name="eviden" accept=".pdf,image/*" className={inputCls} required />
          <span className="mt-1 block text-xs text-slate-400">{en ? "PDF or image, max 4 MB." : "PDF atau gambar, maks 4 MB."}</span>
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
            {busy ? (en ? "Submitting…" : "Menghantar…") : (en ? "Submit for verification" : "Hantar untuk pengesahan")}
          </button>
        </div>
      </form>
    </section>
  );
}
