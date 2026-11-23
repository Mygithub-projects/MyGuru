"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { KEDUDUKAN_AKTIVITI, PERINGKAT_KOLEJ, PERINGKAT_LUAR } from "@/lib/enums";
import type { CalonPelajar } from "@/components/CariPelajar";
import { AktivitiUnitForm } from "./AktivitiUnitForm";

// Had platform Vercel untuk badan permintaan ialah 4.5MB. Guna 4MB sebagai had
// klien (beri margin untuk overhead multipart) supaya fail besar ditolak DI SINI
// dengan mesej jelas, bukan ditolak senyap oleh platform (413 → "Ralat rangkaian").
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

interface Unit { jenisKoko: string; namaUnit: string; }

export function AktivitiForm({
  pelajarId,
  units,
  guru,
  su,
}: {
  pelajarId: string;
  units: Unit[];
  /** Senarai guru aktif — pilihan Guru Pengiring (Aktiviti Luar). */
  guru: { id: string; nama: string }[];
  /** SU/NSU sahaja: unit seliaan (bukan Perkhidmatan) & calon peserta. */
  su?: { units: Unit[]; calon: CalonPelajar[] };
}) {
  const router = useRouter();
  const locale = useLocale();
  const dict = getDict(locale);
  const t = dict.pelajar;
  const common = dict.common;
  const unitLabel: Record<string, string> = {
    Sukan: common.sukan, Kelab: common.kelab, Uniform: common.uniform, Perkhidmatan: common.perkhidmatan,
  };
  const en = locale === "en";
  const KED_EN: Record<string, string> = { Penyertaan: "Participation", Johan: "Champion", "Naib Johan": "Runner-up", Ketiga: "Third" };
  const [tab, setTab] = useState<"pencapaian" | "luar" | "unit">(su ? "unit" : "pencapaian");
  const tabs = su ? (["unit", "pencapaian", "luar"] as const) : (["pencapaian", "luar"] as const);
  const labelTab = (k: string) =>
    k === "unit" ? (locale === "en" ? "Unit Activity (SU/NSU)" : "Aktiviti Unit (SU/NSU)")
    : k === "pencapaian" ? t.activityTabs.achievements : t.activityTabs.externalActivities;
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
        {tabs.map((tabKey) => (
          <button key={tabKey} onClick={() => { setTab(tabKey); setMsg(null); }}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === tabKey ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>
            {labelTab(tabKey)}
          </button>
        ))}
      </div>

      {tab === "unit" && su ? (
        <AktivitiUnitForm units={su.units} calon={su.calon} />
      ) : (<>
      {msg && (
        <div className={`mb-3 rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Kedua-dua tab: Nama Program/Aktiviti, Peringkat, Tarikh, Unit, Laporan ringkas, Eviden.
          Tab Kolej → jadual Pencapaian (peringkat Sekolah); tab Luar → AktivitiLuar. */}
      <form
        key={tab}
        onSubmit={(e) => submit(e, `/api/pelajar/${pelajarId}/${tab === "pencapaian" ? "pencapaian" : "aktiviti-luar"}`)}
        className="grid gap-3 sm:grid-cols-2"
      >
        <label className="text-sm">{t.activityForm.programName}
          <input name={tab === "pencapaian" ? "namaPencapaian" : "namaAktiviti"} className={`${inputCls} mt-1`} required />
        </label>
        <label className="text-sm">{t.activityForm.levelLabel}
          {tab === "pencapaian" ? (
            <select name="peringkat" className={`${inputCls} mt-1`} defaultValue={PERINGKAT_KOLEJ}>
              <option value={PERINGKAT_KOLEJ}>{t.activityForm.collegeLevel}</option>
            </select>
          ) : (
            <select name="peringkat" className={`${inputCls} mt-1`} required defaultValue="">
              <option value="" disabled>{t.activityForm.levelPlaceholder}</option>
              {PERINGKAT_LUAR.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
        </label>
        <label className="text-sm">{t.activityForm.dateLabel}
          <input type="date" name="tarikh" className={`${inputCls} mt-1`} required />
        </label>
        <label className="text-sm">{t.activityForm.unitLabel}
          <select name="namaUnit" className={`${inputCls} mt-1`} required defaultValue="">
            <option value="" disabled>{t.activityForm.unitPlaceholder}</option>
            {units.map((u, i) => <option key={i} value={u.namaUnit}>{unitLabel[u.jenisKoko] ?? u.jenisKoko}: {u.namaUnit}</option>)}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">{t.activityForm.reportLabel}
          <textarea name="laporan" rows={4} maxLength={2000} className={`${inputCls} mt-1`} required />
        </label>
        {tab === "luar" && (
          <>
            <label className="text-sm">{en ? "Placing / achievement" : "Kedudukan / pencapaian"}
              <select name="kedudukan" className={`${inputCls} mt-1`} required defaultValue="">
                <option value="" disabled>{en ? "— Placing —" : "— Kedudukan —"}</option>
                {KEDUDUKAN_AKTIVITI.map((k) => <option key={k} value={k}>{en ? KED_EN[k] : k}</option>)}
              </select>
            </label>
            <label className="text-sm">{en ? "Escort teacher (will confirm)" : "Guru pengiring (akan mengesahkan)"}
              <select name="guruPengiringId" className={`${inputCls} mt-1`} required defaultValue="">
                <option value="" disabled>{en ? "— Choose teacher —" : "— Pilih guru —"}</option>
                {guru.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
              </select>
            </label>
          </>
        )}
        {tab === "luar" ? (
          <>
            <label className="text-sm">{en ? "KPM recognition letter" : "Surat pengiktirafan KPM"}
              <input name="surat" type="file" className={`${inputCls} mt-1`} required />
            </label>
            <label className="text-sm">{en ? "Certificate" : "Sijil"}
              <input name="sijil" type="file" className={`${inputCls} mt-1`} required />
            </label>
          </>
        ) : (
          <label className="text-sm sm:col-span-2">{t.activityForm.evidenceLabel}
            <input name="eviden" type="file" className={`${inputCls} mt-1`} required />
          </label>
        )}
        <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 sm:w-auto">
          {busy ? "..." : t.activityForm.submit}
        </button>
      </form>
      </>)}
    </section>
  );
}
