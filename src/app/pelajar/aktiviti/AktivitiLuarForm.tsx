"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { KEDUDUKAN_AKTIVITI, PERINGKAT_LUAR } from "@/lib/enums";
import { OprPratonton } from "../laporan/OprPratonton";
import { kecilkanGambar } from "../laporan/LaporanForm";

const MAKS_GAMBAR = 4;
// Mesti sama dengan OPR_HAD (src/lib/opr.ts).
const HAD = { objektif: 500, aktiviti: 1500, refleksi: 600, tempat: 120, masa: 60 };
// Had badan permintaan (surat + sijil + gambar) — beri margin untuk overhead multipart.
const MAKS_BAIT = 4 * 1024 * 1024;

const TEKS = {
  ms: {
    intro: "Isi butiran aktiviti luar & tambah gambar — sistem menjana OPR (Laporan Satu Muka Surat). Semak OPR, kemudian hantar bersama surat pengiktirafan KPM & sijil untuk pengesahan guru pengiring.",
    nama: "Nama Program/Aktiviti", peringkat: "Peringkat", peringkatPilih: "— Peringkat —", tarikh: "Tarikh Program/Aktiviti",
    unit: "Unit berkaitan", unitPilih: "— Unit berkaitan —",
    ked: "Kedudukan / pencapaian", kedPilih: "— Kedudukan —",
    guru: "Guru pengiring (akan mengesahkan)", guruPilih: "— Pilih guru —",
    surat: "Surat pengiktirafan KPM", sijil: "Sijil", evidenTajuk: "Eviden (dihantar bersama OPR)",
    besar: "Jumlah saiz fail melebihi 4 MB. Kecilkan surat/sijil dan cuba lagi.",
    perluEviden: "Sila pilih surat pengiktirafan KPM dan sijil.",
    rangkaian: "Ralat rangkaian",
    kedLabel: { Penyertaan: "Penyertaan", Johan: "Johan", "Naib Johan": "Naib Johan", Ketiga: "Ketiga" } as Record<string, string>,
  },
  en: {
    intro: "Fill in the external activity details & add photos — the system generates an OPR (One Page Report). Check the OPR, then submit it with the KPM recognition letter & certificate for your escort teacher to verify.",
    nama: "Programme/Activity Name", peringkat: "Level", peringkatPilih: "— Level —", tarikh: "Activity Date",
    unit: "Related unit", unitPilih: "— Related unit —",
    ked: "Placing / achievement", kedPilih: "— Placing —",
    guru: "Escort teacher (will verify)", guruPilih: "— Choose teacher —",
    surat: "KPM recognition letter", sijil: "Certificate", evidenTajuk: "Evidence (submitted with the OPR)",
    besar: "Total file size exceeds 4 MB. Reduce the letter/certificate and try again.",
    perluEviden: "Please choose the KPM recognition letter and certificate.",
    rangkaian: "Network error",
    kedLabel: { Penyertaan: "Participation", Johan: "Champion", "Naib Johan": "Runner-up", Ketiga: "Third" } as Record<string, string>,
  },
};

interface Unit { jenisKoko: string; namaUnit: string }
interface Gambar { id: string; file: File; url: string }

/**
 * Borang Aktiviti Luar (pelajar) — aliran sama seperti Laporan Mingguan:
 * isi butiran + gambar → Jana OPR → pratonton & semak → hantar (+ surat KPM & sijil).
 */
export function AktivitiLuarForm({ pelajarId, units, guru, unitLabel }: {
  pelajarId: string;
  units: Unit[];
  guru: { id: string; nama: string }[];
  unitLabel: Record<string, string>;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = TEKS[locale === "en" ? "en" : "ms"];
  const o = getDict(locale).laporan.opr;
  const [gambar, setGambar] = useState<Gambar[]>([]);
  const [busy, setBusy] = useState<"jana" | "hantar" | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pratonton, setPratonton] = useState<string | null>(null);
  const [lapuk, setLapuk] = useState(false);
  const [disemak, setDisemak] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const evidenRef = useRef<HTMLDivElement>(null);
  const dataJana = useRef<FormData | null>(null);
  const pratontonRef = useRef<HTMLDivElement>(null);
  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  useEffect(() => () => { if (pratonton) URL.revokeObjectURL(pratonton); }, [pratonton]);
  const gambarRef = useRef(gambar);
  useEffect(() => { gambarRef.current = gambar; }, [gambar]);
  useEffect(() => () => gambarRef.current.forEach((g) => URL.revokeObjectURL(g.url)), []);

  function tandaBerubah() {
    if (pratonton) { setLapuk(true); setDisemak(false); }
  }

  function resetSemua() {
    formRef.current?.reset();
    evidenRef.current?.querySelectorAll("input").forEach((i) => { i.value = ""; });
    gambar.forEach((g) => URL.revokeObjectURL(g.url));
    setGambar([]);
    setPratonton(null);
    setLapuk(false);
    setDisemak(false);
    dataJana.current = null;
  }

  async function tambahGambar(e: React.ChangeEvent<HTMLInputElement>) {
    const pilih = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (pilih.length === 0) return;
    const baki = MAKS_GAMBAR - gambar.length;
    if (pilih.length > baki) setMsg({ text: o.tooManyPhotos, ok: false });
    const baru = await Promise.all(pilih.slice(0, Math.max(0, baki)).map(async (file) => {
      const kecil = await kecilkanGambar(file);
      return { id: crypto.randomUUID(), file: kecil, url: URL.createObjectURL(kecil) };
    }));
    setGambar((g) => [...g, ...baru]);
    tandaBerubah();
  }

  function buangGambar(id: string) {
    setGambar((g) => {
      const x = g.find((i) => i.id === id);
      if (x) URL.revokeObjectURL(x.url);
      return g.filter((i) => i.id !== id);
    });
    tandaBerubah();
  }

  // Langkah 1: jana OPR pratonton (tidak disimpan).
  async function jana(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    if (gambar.length === 0) return setMsg({ text: o.needPhoto, ok: false });
    const form = new FormData(e.currentTarget);
    form.delete("gambar-pilih");
    gambar.forEach((g) => form.append("gambar", g.file));
    form.set("jenis", "luar");
    form.set("opr", "1");
    setBusy("jana");
    try {
      const res = await fetch("/api/laporan/opr", { method: "POST", body: form });
      if (!res.ok || !res.headers.get("content-type")?.includes("pdf")) {
        const json = await res.json().catch(() => null);
        setMsg({ text: json?.message ?? t.rangkaian, ok: false });
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      dataJana.current = form;
      setPratonton(url);
      setLapuk(false);
      setDisemak(false);
      setTimeout(() => pratontonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch {
      setMsg({ text: t.rangkaian, ok: false });
    } finally {
      setBusy(null);
    }
  }

  // Langkah 2: hantar OPR yang disemak + surat KPM & sijil.
  async function hantar() {
    if (!dataJana.current || lapuk || !disemak) return;
    setMsg(null);
    const surat = evidenRef.current?.querySelector<HTMLInputElement>('input[name="surat"]')?.files?.[0];
    const sijil = evidenRef.current?.querySelector<HTMLInputElement>('input[name="sijil"]')?.files?.[0];
    if (!surat || !sijil) return setMsg({ text: t.perluEviden, ok: false });
    const form = new FormData();
    dataJana.current.forEach((v, k) => form.append(k, v));
    form.set("surat", surat);
    form.set("sijil", sijil);
    let jumlah = 0;
    form.forEach((v) => { if (v instanceof File) jumlah += v.size; });
    if (jumlah > MAKS_BAIT) return setMsg({ text: t.besar, ok: false });

    setBusy("hantar");
    try {
      const res = await fetch(`/api/pelajar/${pelajarId}/aktiviti-luar`, { method: "POST", body: form });
      const json = (await res.json().catch(() => null)) as { success: boolean; message: string } | null;
      setMsg({
        text: json?.message ?? (res.status === 413 ? t.besar : `${t.rangkaian} (${res.status})`),
        ok: !!json?.success,
      });
      if (json?.success) { resetSemua(); router.refresh(); }
    } catch {
      setMsg({ text: t.rangkaian, ok: false });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <p className="mb-3 text-xs text-slate-500">{t.intro}</p>
      {msg && (
        <div className={`mb-3 rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Langkah 1: isi butiran & gambar → Jana OPR */}
      <form ref={formRef} onSubmit={jana} onInput={tandaBerubah} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">{t.nama}
          <input name="namaAktiviti" maxLength={200} className={`${inputCls} mt-1`} required />
        </label>
        <label className="text-sm">{t.peringkat}
          <select name="peringkat" className={`${inputCls} mt-1`} required defaultValue="" onChange={tandaBerubah}>
            <option value="" disabled>{t.peringkatPilih}</option>
            {PERINGKAT_LUAR.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="text-sm">{t.tarikh}
          <input type="date" name="tarikh" className={`${inputCls} mt-1`} required />
        </label>
        <label className="text-sm">{o.timeLabel}
          <input name="masa" maxLength={HAD.masa} placeholder={o.timePlaceholder} className={`${inputCls} mt-1`} />
        </label>
        <label className="text-sm">{o.placeLabel}
          <input name="tempat" maxLength={HAD.tempat} placeholder={o.placePlaceholder} className={`${inputCls} mt-1`} required />
        </label>
        <label className="text-sm">{t.unit}
          <select name="namaUnit" className={`${inputCls} mt-1`} required defaultValue="" onChange={tandaBerubah}>
            <option value="" disabled>{t.unitPilih}</option>
            {units.map((u) => <option key={u.namaUnit} value={u.namaUnit}>{unitLabel[u.jenisKoko] ?? u.jenisKoko}: {u.namaUnit}</option>)}
          </select>
        </label>
        <label className="text-sm">{t.ked}
          <select name="kedudukan" className={`${inputCls} mt-1`} required defaultValue="" onChange={tandaBerubah}>
            <option value="" disabled>{t.kedPilih}</option>
            {KEDUDUKAN_AKTIVITI.map((k) => <option key={k} value={k}>{t.kedLabel[k] ?? k}</option>)}
          </select>
        </label>
        <label className="text-sm">{t.guru}
          <select name="guruPengiringId" className={`${inputCls} mt-1`} required defaultValue="" onChange={tandaBerubah}>
            <option value="" disabled>{t.guruPilih}</option>
            {guru.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
          </select>
        </label>

        <label className="text-sm sm:col-span-2">{o.objectiveLabel}
          <textarea name="objektif" rows={2} maxLength={HAD.objektif} placeholder={o.objectivePlaceholder} className={`${inputCls} mt-1`} required />
        </label>
        <label className="text-sm sm:col-span-2">{o.activityLabel}
          <textarea name="laporan" rows={5} maxLength={HAD.aktiviti} placeholder={o.activityPlaceholder} className={`${inputCls} mt-1`} required />
        </label>
        <label className="text-sm sm:col-span-2">{o.reflectionLabel}
          <textarea name="refleksi" rows={3} maxLength={HAD.refleksi} placeholder={o.reflectionPlaceholder} className={`${inputCls} mt-1`} required />
        </label>

        <div className="text-sm sm:col-span-2">
          <span>{o.photosLabel} ({gambar.length}/{MAKS_GAMBAR})</span>
          <p className="text-xs text-slate-400">{o.photosHint}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {gambar.map((g) => (
              <div key={g.id} className="relative overflow-hidden rounded-lg ring-1 ring-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.url} alt="" className="aspect-[4/3] w-full object-cover" />
                <button type="button" onClick={() => buangGambar(g.id)}
                  className="absolute right-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-xs font-semibold text-red-600 shadow hover:bg-white">
                  {o.removePhoto}
                </button>
              </div>
            ))}
            {gambar.length < MAKS_GAMBAR && (
              <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-brand hover:text-brand-dark">
                <span className="text-2xl leading-none">+</span>
                <span className="text-xs">{o.photosLabel}</span>
                <input name="gambar-pilih" type="file" accept="image/jpeg,image/png,image/webp,image/*" multiple className="sr-only" onChange={tambahGambar} />
              </label>
            )}
          </div>
        </div>

        <button disabled={busy !== null} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 sm:w-auto">
          {busy === "jana" ? o.generating : pratonton ? `↻ ${o.generate}` : `📄 ${o.generate}`}
        </button>
      </form>

      {/* Langkah 2: pratonton OPR → semak → eviden → hantar untuk pengesahan */}
      {pratonton && (
        <div ref={pratontonRef} className="mt-5 space-y-3 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">{o.previewTitle}</h3>
            <a href={pratonton} target="_blank" rel="noopener" className="text-xs font-semibold text-brand-dark hover:underline">{o.openNewTab}</a>
          </div>
          <p className="text-xs text-slate-500">{o.previewHint}</p>
          {lapuk && (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 ring-1 ring-amber-200">{o.staleNotice}</div>
          )}
          <OprPratonton url={pratonton} lapuk={lapuk} ralatTeks={o.previewError} />

          <div ref={evidenRef} className="grid gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200 sm:grid-cols-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600 sm:col-span-2">📎 {t.evidenTajuk}</p>
            <label className="text-sm">{t.surat}
              <input name="surat" type="file" accept=".pdf,image/*" className={`${inputCls} mt-1 bg-white`} required />
            </label>
            <label className="text-sm">{t.sijil}
              <input name="sijil" type="file" accept=".pdf,image/*" className={`${inputCls} mt-1 bg-white`} required />
            </label>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-0.5" checked={disemak} disabled={lapuk} onChange={(e) => setDisemak(e.target.checked)} />
            {o.checkConfirm}
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={hantar} disabled={!disemak || lapuk || busy !== null}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
              {busy === "hantar" ? o.submitting : o.submit}
            </button>
            <button type="button" onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">
              {o.edit}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
