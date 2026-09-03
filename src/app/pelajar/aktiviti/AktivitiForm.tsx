"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

const PERINGKAT = ["Sekolah", "Daerah", "Zon/Daerah", "Negeri", "Kebangsaan", "Antarabangsa"];

// Had platform Vercel untuk badan permintaan ialah 4.5MB. Guna 4MB sebagai had
// klien (beri margin untuk overhead multipart) supaya fail besar ditolak DI SINI
// dengan mesej jelas, bukan ditolak senyap oleh platform (413 → "Ralat rangkaian").
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

interface Unit { jenisKoko: string; namaUnit: string; }

export function AktivitiForm({ pelajarId, units }: { pelajarId: string; units: Unit[] }) {
  const router = useRouter();
  const locale = useLocale();
  const dict = getDict(locale);
  const t = dict.pelajar;
  const common = dict.common;
  const unitLabel: Record<string, string> = {
    Sukan: common.sukan, Kelab: common.kelab, Uniform: common.uniform, Perkhidmatan: common.perkhidmatan,
  };
  const [tab, setTab] = useState<"pencapaian" | "luar">("pencapaian");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>, url: string) {
    e.preventDefault();
    setMsg(null);
    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    let totalBytes = 0;
    for (const value of form.values()) {
      if (value instanceof File) totalBytes += value.size;
    }
    if (totalBytes > MAX_UPLOAD_BYTES) {
      const mb = (totalBytes / 1024 / 1024).toFixed(1);
      setMsg({ text: `${t.activityForm.fileTooLarge}`, ok: false });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(url, { method: "POST", body: form });
      let json: { success: boolean; message: string } | null = null;
      try { json = await res.json(); } catch { }

      if (json) {
        setMsg({ text: json.message, ok: json.success });
        if (json.success) { formEl.reset(); router.refresh(); }
      } else if (res.status === 413) {
        setMsg({ text: t.activityForm.uploadSizeLimit, ok: false });
      } else {
        setMsg({ text: `${t.activityForm.fetchError} (${res.status})`, ok: false });
      }
    } catch {
      setMsg({ text: t.activityForm.networkError, ok: false });
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex gap-2">
        {(["pencapaian", "luar"] as const).map((tabKey) => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === tabKey ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>
            {tabKey === "pencapaian" ? t.activityTabs.achievements : t.activityTabs.externalActivities}
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
          <input name="namaPencapaian" placeholder={t.activityForm.achievementName} className={inputCls} required />
          <select name="peringkat" className={inputCls} defaultValue="">
            <option value="">{t.activityForm.levelPlaceholder}</option>
            {PERINGKAT.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select name="namaUnit" className={inputCls} required defaultValue="">
            <option value="" disabled>{t.activityForm.unitPlaceholder}</option>
            {units.map((u, i) => <option key={i} value={u.namaUnit}>{unitLabel[u.jenisKoko] ?? u.jenisKoko}: {u.namaUnit}</option>)}
          </select>
          <label className="text-sm sm:col-span-2">{t.activityForm.evidenceLabel}
            <input name="eviden" type="file" className={`${inputCls} mt-1`} />
          </label>
          <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 sm:w-auto">
            {busy ? "..." : t.activityForm.submit}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => submit(e, `/api/pelajar/${pelajarId}/aktiviti-luar`)} className="grid gap-3 sm:grid-cols-2">
          <input name="namaAktiviti" placeholder={t.activityForm.activityName} className={inputCls} required />
          <select name="peringkat" className={inputCls} required defaultValue="">
            <option value="" disabled>{t.activityForm.levelPlaceholder}</option>
            {PERINGKAT.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select name="namaUnit" className={inputCls} required defaultValue="">
            <option value="" disabled>{t.activityForm.unitPlaceholder}</option>
            {units.map((u, i) => <option key={i} value={u.namaUnit}>{unitLabel[u.jenisKoko] ?? u.jenisKoko}: {u.namaUnit}</option>)}
          </select>
          <input type="date" name="tarikh" className={inputCls} aria-label={t.activityForm.dateLabel} />
          <div />
          <label className="text-sm">{t.activityForm.letterLabel}
            <input name="surat" type="file" className={`${inputCls} mt-1`} />
          </label>
          <label className="text-sm">{t.activityForm.certificateLabel}
            <input name="sijil" type="file" className={`${inputCls} mt-1`} />
          </label>
          <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 sm:col-span-2 sm:w-auto">
            {busy ? "..." : t.activityForm.submit}
          </button>
        </form>
      )}
    </section>
  );
}
