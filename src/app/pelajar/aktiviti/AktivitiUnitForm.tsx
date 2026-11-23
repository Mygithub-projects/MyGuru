"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { CariPelajar, type CalonPelajar } from "@/components/CariPelajar";
import { KEDUDUKAN_AKTIVITI, PERINGKAT_AKTIVITI_UNIT, type KedudukanAktiviti } from "@/lib/enums";
import { markahPeserta } from "@/lib/aktiviti-unit-markah";
import { OprPratonton } from "../laporan/OprPratonton";
import { kecilkanGambar } from "../laporan/LaporanForm";

const MAKS_GAMBAR = 4;
// Mesti sama dengan OPR_HAD (src/lib/opr.ts).
const HAD = { objektif: 500, aktiviti: 1500, refleksi: 600, tempat: 120, masa: 60 };

const TEKS = {
  ms: {
    intro:
      "Daftar aktiviti unit anda bersama peserta dari mana-mana unit. Isi butiran & tambah gambar — sistem menjana OPR (Laporan Satu Muka Surat) sebagai eviden. Selepas disahkan Ketua GP / Penolong Ketua GP, setiap peserta mendapat markah Penglibatan (ikut peringkat) dan Pencapaian (ikut kedudukan), dikredit ke unit peserta dalam bidang yang sama.",
    nama: "Nama Program/Aktiviti", peringkat: "Peringkat", kolej: "Sekolah / Kolej", tarikh: "Tarikh Program/Aktiviti",
    unit: "Unit (anda SU/NSU)", unitPilih: "— Pilih unit —",
    peserta: "Peserta & kedudukan", cari: "Cari nama atau kelas pelajar…", tiada: "Tiada padanan",
    semuaKed: "Tetapkan semua:", buang: "Buang", pglb: "Penglibatan", pcp: "Pencapaian",
    tiadaPeserta: "Tambah sekurang-kurangnya seorang peserta.", rangkaian: "Ralat rangkaian",
    ked: { Penyertaan: "Penyertaan", Johan: "Johan", "Naib Johan": "Naib Johan", Ketiga: "Ketiga" } as Record<string, string>,
  },
  en: {
    intro:
      "Register an activity for your unit with participants from any unit. Fill in the details & add photos — the system generates an OPR (One Page Report) as evidence. Once the Head / Assistant Head Advisor confirms it, each participant gets Involvement marks (by level) and Achievement marks (by placing), credited to their unit in the same field.",
    nama: "Programme/Activity Name", peringkat: "Level", kolej: "School / College", tarikh: "Activity Date",
    unit: "Unit (you are SU/NSU)", unitPilih: "— Choose unit —",
    peserta: "Participants & placing", cari: "Search student name or class…", tiada: "No match",
    semuaKed: "Set all:", buang: "Remove", pglb: "Involvement", pcp: "Achievement",
    tiadaPeserta: "Add at least one participant.", rangkaian: "Network error",
    ked: { Penyertaan: "Participation", Johan: "Champion", "Naib Johan": "Runner-up", Ketiga: "Third" } as Record<string, string>,
  },
};

interface Unit { jenisKoko: string; namaUnit: string }
type Peserta = CalonPelajar & { kedudukan: KedudukanAktiviti };
interface Gambar { id: string; file: File; url: string }

/**
 * Borang SU/NSU: satu aktiviti + ramai peserta (mana-mana unit) dengan kedudukan.
 * Aliran sama seperti Laporan Mingguan: isi → Jana OPR → pratonton & semak → hantar.
 */
export function AktivitiUnitForm({ units, calon }: { units: Unit[]; calon: CalonPelajar[] }) {
  const router = useRouter();
  const locale = useLocale();
  const t = TEKS[locale === "en" ? "en" : "ms"];
  const o = getDict(locale).laporan.opr;
  const [peringkat, setPeringkat] = useState<string>("Sekolah");
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [gambar, setGambar] = useState<Gambar[]>([]);
  const [busy, setBusy] = useState<"jana" | "hantar" | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pratonton, setPratonton] = useState<string | null>(null);
  const [lapuk, setLapuk] = useState(false);
  const [disemak, setDisemak] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
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
    gambar.forEach((g) => URL.revokeObjectURL(g.url));
    setGambar([]);
    setPeserta([]);
    setPeringkat("Sekolah");
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

  async function jana(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    if (peserta.length === 0) return setMsg({ text: t.tiadaPeserta, ok: false });
    if (gambar.length === 0) return setMsg({ text: o.needPhoto, ok: false });
    const form = new FormData(e.currentTarget);
    form.delete("gambar-pilih");
    gambar.forEach((g) => form.append("gambar", g.file));
    form.set("jenis", "aktiviti");
    form.set("opr", "1");
    form.set("peserta", JSON.stringify(peserta.map((p) => ({ pelajarId: p.id, kedudukan: p.kedudukan }))));
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

  async function hantar() {
    if (!dataJana.current || lapuk || !disemak) return;
    setBusy("hantar");
    setMsg(null);
    try {
      const res = await fetch("/api/aktiviti-unit", { method: "POST", body: dataJana.current });
      const json = (await res.json().catch(() => null)) as { success: boolean; message: string } | null;
      setMsg({ text: json?.message ?? `${t.rangkaian} (${res.status})`, ok: !!json?.success });
      if (json?.success) { resetSemua(); router.refresh(); }
    } catch {
      setMsg({ text: t.rangkaian, ok: false });
    } finally {
      setBusy(null);
    }
  }

  const tetapSemua = (k: KedudukanAktiviti) => { setPeserta((s) => s.map((p) => ({ ...p, kedudukan: k }))); tandaBerubah(); };

  return (
    <div>
      <p className="mb-3 text-xs text-slate-500">{t.intro}</p>
      {msg && (
        <div className={`mb-3 rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Langkah 1: isi butiran, peserta & gambar → Jana OPR */}
      <form ref={formRef} onSubmit={jana} onInput={tandaBerubah} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">{t.nama}
          <input name="namaAktiviti" maxLength={200} className={`${inputCls} mt-1`} required />
        </label>
        <label className="text-sm">{t.peringkat}
          <select name="peringkat" value={peringkat} onChange={(e) => { setPeringkat(e.target.value); tandaBerubah(); }} className={`${inputCls} mt-1`} required>
            {PERINGKAT_AKTIVITI_UNIT.map((p) => (
              <option key={p} value={p}>{p === "Sekolah" ? t.kolej : p}</option>
            ))}
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
          <select name="namaUnit" className={`${inputCls} mt-1`} required defaultValue={units.length === 1 ? units[0].namaUnit : ""}>
            <option value="" disabled>{t.unitPilih}</option>
            {units.map((u) => <option key={u.namaUnit} value={u.namaUnit}>{u.jenisKoko}: {u.namaUnit}</option>)}
          </select>
        </label>

        <div className="text-sm sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{t.peserta} ({peserta.length})</span>
            {peserta.length > 1 && (
              <span className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
                {t.semuaKed}
                {KEDUDUKAN_AKTIVITI.map((k) => (
                  <button key={k} type="button" onClick={() => tetapSemua(k)} className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 hover:bg-slate-200">
                    {t.ked[k]}
                  </button>
                ))}
              </span>
            )}
          </div>
          <div className="mt-2">
            <CariPelajar
              pelajar={calon}
              kecuali={new Set(peserta.map((p) => p.id))}
              placeholder={t.cari}
              tiadaPadanan={t.tiada}
              onPilih={(c) => { setPeserta((s) => [...s, { ...c, kedudukan: "Penyertaan" }]); tandaBerubah(); }}
            />
          </div>
          {peserta.length > 0 && (
            <ul className="mt-2 divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200">
              {peserta.map((p) => {
                const m = markahPeserta(peringkat, p.kedudukan);
                return (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5">
                    <span className="min-w-0 truncate">{p.nama} <span className="text-xs text-slate-400">({p.kelas ?? "-"})</span></span>
                    <span className="flex items-center gap-2">
                      <select
                        value={p.kedudukan}
                        aria-label={t.peserta}
                        onChange={(e) => {
                          const v = e.target.value as KedudukanAktiviti;
                          setPeserta((s) => s.map((y) => (y.id === p.id ? { ...y, kedudukan: v } : y)));
                          tandaBerubah();
                        }}
                        className="rounded border border-slate-300 px-1.5 py-1 text-xs"
                      >
                        {KEDUDUKAN_AKTIVITI.map((k) => <option key={k} value={k}>{t.ked[k]}</option>)}
                      </select>
                      <span className="whitespace-nowrap text-xs text-slate-500">{t.pglb} {m.penglibatan} · {t.pcp} {m.pencapaian}</span>
                      <button type="button" onClick={() => { setPeserta((s) => s.filter((y) => y.id !== p.id)); tandaBerubah(); }} className="text-xs font-semibold text-red-600 hover:underline">
                        {t.buang}
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

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

      {/* Langkah 2: pratonton OPR → semak → hantar untuk pengesahan */}
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
