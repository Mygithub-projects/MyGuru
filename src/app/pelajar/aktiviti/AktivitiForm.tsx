"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PERINGKAT = ["Sekolah", "Daerah", "Zon/Daerah", "Negeri", "Kebangsaan", "Antarabangsa"];

// Had platform Vercel untuk badan permintaan ialah 4.5MB. Guna 4MB sebagai had
// klien (beri margin untuk overhead multipart) supaya fail besar ditolak DI SINI
// dengan mesej jelas, bukan ditolak senyap oleh platform (413 → "Ralat rangkaian").
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function AktivitiForm({ pelajarId }: { pelajarId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"pencapaian" | "luar">("pencapaian");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>, url: string) {
    e.preventDefault();
    setMsg(null);
    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    // Fix 1 — semak saiz fail SEBELUM hantar. Elak platform tolak dengan 413
    // (respons bukan-JSON) yang selama ini muncul sebagai "Ralat rangkaian".
    let totalBytes = 0;
    for (const value of form.values()) {
      if (value instanceof File) totalBytes += value.size;
    }
    if (totalBytes > MAX_UPLOAD_BYTES) {
      const mb = (totalBytes / 1024 / 1024).toFixed(1);
      setMsg({
        text: `Fail terlalu besar (${mb}MB). Had muat naik ialah 4MB — sila kecilkan/mampatkan fail (cth. tangkap semula foto pada resolusi lebih rendah).`,
        ok: false,
      });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(url, { method: "POST", body: form });
      // Fix 2 — jangan andaikan respons sentiasa JSON. Kalau res.json() gagal,
      // beri mesej mengikut status supaya punca sebenar tidak tersembunyi.
      let json: { success: boolean; message: string } | null = null;
      try { json = await res.json(); } catch { /* respons bukan JSON */ }

      if (json) {
        setMsg({ text: json.message, ok: json.success });
        if (json.success) { formEl.reset(); router.refresh(); }
      } else if (res.status === 413) {
        setMsg({ text: "Fail terlalu besar untuk pelayan (had 4.5MB). Sila kecilkan fail.", ok: false });
      } else {
        setMsg({ text: `Ralat pelayan (${res.status}). Sila cuba lagi atau hubungi guru.`, ok: false });
      }
    } catch {
      setMsg({ text: "Ralat rangkaian — semak sambungan internet anda dan cuba lagi.", ok: false });
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex gap-2">
        {(["pencapaian", "luar"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === t ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>
            {t === "pencapaian" ? "Pencapaian" : "Aktiviti Luar"}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`mb-3 rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.text}
        </div>
      )}

      {tab === "pencapaian" ? (
        <form onSubmit={(e) => submit(e, `/api/pelajar/${pelajarId}/pencapaian`)} className="grid gap-3 sm:grid-cols-2">
          <input name="namaPencapaian" placeholder="Nama pencapaian" className={inputCls} required />
          <select name="peringkat" className={inputCls} defaultValue="">
            <option value="">— Peringkat —</option>
            {PERINGKAT.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <label className="text-sm sm:col-span-2">Eviden (sijil/surat)
            <input name="eviden" type="file" className={`${inputCls} mt-1`} />
          </label>
          <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 sm:w-auto">
            {busy ? "..." : "Hantar"}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => submit(e, `/api/pelajar/${pelajarId}/aktiviti-luar`)} className="grid gap-3 sm:grid-cols-2">
          <input name="namaAktiviti" placeholder="Nama aktiviti luar" className={inputCls} required />
          <select name="peringkat" className={inputCls} required defaultValue="">
            <option value="" disabled>— Peringkat —</option>
            {PERINGKAT.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="date" name="tarikh" className={inputCls} />
          <div />
          <label className="text-sm">Surat (wajib untuk e-Cert)
            <input name="surat" type="file" className={`${inputCls} mt-1`} />
          </label>
          <label className="text-sm">Sijil (wajib untuk e-Cert)
            <input name="sijil" type="file" className={`${inputCls} mt-1`} />
          </label>
          <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 sm:col-span-2 sm:w-auto">
            {busy ? "..." : "Hantar"}
          </button>
        </form>
      )}
    </section>
  );
}
