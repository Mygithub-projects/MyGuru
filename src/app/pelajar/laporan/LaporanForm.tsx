"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { PERINGKAT } from "@/lib/enums";
import { OprPratonton } from "./OprPratonton";
import { JAWATAN_PERANAN, JAWATAN_PESERTA, LABEL_PERANAN } from "@/lib/projek-jawatan";
import { CariPelajar, type CalonPelajar } from "@/components/CariPelajar";

interface Unit { jenisKoko: string; namaUnit: string; }
interface Sesi { id: string; namaUnit: string; bilPerjumpaan: number; }
interface Ajk extends CalonPelajar { peranan: string; }
interface ProjekTag { id: string; nama: string; units: string[]; peranan: string; ajk: Ajk[]; }
interface Peserta extends CalonPelajar { jawatan: string; }

const MAKS_GAMBAR = 4;
// Mesti sama dengan OPR_HAD (src/lib/opr.ts).
const HAD = { objektif: 500, aktiviti: 1500, refleksi: 600, tempat: 120, masa: 60 };

interface Gambar { id: string; file: File; url: string; }

/** Kecilkan gambar ke JPEG (sisi panjang maks 1600px) supaya OPR ringan & muat naik pantas. */
async function kecilkanGambar(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * s);
    canvas.height = Math.round(bmp.height * s);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // pelayar tidak dapat nyahkod (cth HEIC) — biar pelayan menolak dengan mesej jelas
  }
}

export function LaporanForm({ units, sesiList, bolehMingguan, pelajarId, projek, calon }: {
  units: Unit[]; sesiList: Sesi[]; bolehMingguan: boolean; pelajarId: string; projek: ProjekTag[]; calon: CalonPelajar[];
}) {
  const router = useRouter();
  const locale = useLocale();
  const dict = getDict(locale);
  const t = dict.laporan;
  const o = t.opr;
  const f = dict.pelajar.activityForm;
  const common = dict.common;
  const unitLabel: Record<string, string> = {
    Sukan: common.sukan, Kelab: common.kelab, Uniform: common.uniform, Perkhidmatan: common.perkhidmatan,
  };
  const [tab, setTab] = useState<"mingguan" | "projek">(bolehMingguan ? "mingguan" : "projek");
  const [projekId, setProjekId] = useState(projek.length === 1 ? projek[0].id : "");
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const projekDipilih = projek.find((x) => x.id === projekId) ?? null;
  const [busy, setBusy] = useState<"jana" | "hantar" | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [gambar, setGambar] = useState<Gambar[]>([]);
  const [pratonton, setPratonton] = useState<string | null>(null); // blob URL PDF OPR
  const [lapuk, setLapuk] = useState(false); // borang berubah selepas jana
  const [disemak, setDisemak] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const dataJana = useRef<FormData | null>(null);
  const pratontonRef = useRef<HTMLDivElement>(null);

  // Bebaskan blob URL apabila ditukar / komponen dibuang.
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
    setPratonton(null);
    setLapuk(false);
    setDisemak(false);
    setPeserta([]);
    dataJana.current = null;
  }

  function tukarTab(k: "mingguan" | "projek") {
    if (k === tab) return;
    setTab(k);
    setMsg(null);
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
    if (gambar.length === 0) { setMsg({ text: o.needPhoto, ok: false }); return; }
    const form = new FormData(e.currentTarget);
    form.delete("gambar-pilih");
    gambar.forEach((g) => form.append("gambar", g.file));
    form.set("jenis", tab);
    form.set("opr", "1");
    if (tab === "projek") form.set("peserta", JSON.stringify(peserta.map((x) => ({ pelajarId: x.id, jawatan: x.jawatan }))));
    setBusy("jana");
    try {
      const res = await fetch("/api/laporan/opr", { method: "POST", body: form });
      if (!res.ok || !res.headers.get("content-type")?.includes("pdf")) {
        const json = await res.json().catch(() => null);
        setMsg({ text: json?.message ?? t.networkError, ok: false });
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      dataJana.current = form;
      setPratonton(url);
      setLapuk(false);
      setDisemak(false);
      setTimeout(() => pratontonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch {
      setMsg({ text: t.networkError, ok: false });
    } finally {
      setBusy(null);
    }
  }

  async function hantar() {
    if (!dataJana.current || lapuk || !disemak) return;
    setBusy("hantar");
    setMsg(null);
    try {
      const res = await fetch(tab === "mingguan" ? "/api/laporan/mingguan" : "/api/laporan/projek", {
        method: "POST",
        body: dataJana.current,
      });
      const json = await res.json();
      setMsg({ text: json.message, ok: json.success });
      if (json.success) { resetSemua(); router.refresh(); }
    } catch {
      setMsg({ text: t.networkError, ok: false });
    } finally {
      setBusy(null);
    }
  }

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex gap-2">
        {(bolehMingguan ? (["mingguan", "projek"] as const) : (["projek"] as const)).map((tabKey) => (
          <button key={tabKey} type="button" onClick={() => tukarTab(tabKey)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === tabKey ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>
            {tabKey === "mingguan" ? t.tabWeekly : t.tabProject}
          </button>
        ))}
      </div>
      <p className="mb-4 text-xs text-slate-500">{o.intro}</p>

      {msg && (
        <div className={`mb-3 rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.text}
        </div>
      )}

      {tab === "projek" && projek.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-700 ring-1 ring-amber-200">{o.noProject}</p>
      ) : (<>
      {/* Langkah 1: isi butiran + gambar → Jana OPR */}
      <form ref={formRef} key={tab} onSubmit={jana} onInput={tandaBerubah} className="grid gap-3 sm:grid-cols-2">
        {tab === "mingguan" ? (
          <label className="text-sm">{f.programName}
            <input name="namaProgram" maxLength={200} className={`${inputCls} mt-1`} required />
          </label>
        ) : (
          <label className="text-sm">{o.projectLabel}
            <select name="projekId" value={projekId} onChange={(e) => setProjekId(e.target.value)} className={`${inputCls} mt-1`} required>
              <option value="" disabled>{o.projectPlaceholder}</option>
              {projek.map((x) => <option key={x.id} value={x.id}>{x.nama} ({LABEL_PERANAN[x.peranan] ?? x.peranan})</option>)}
            </select>
            {projekDipilih && (
              <span className="mt-1 block text-xs text-slate-500">{o.projectUnits}: {projekDipilih.units.join(", ")}</span>
            )}
          </label>
        )}
        <label className="text-sm">{f.levelLabel}
          <select name={tab === "mingguan" ? "peringkat" : "peringkatProjek"} className={`${inputCls} mt-1`} required defaultValue="Sekolah">
            {PERINGKAT.map((p) => <option key={p} value={p}>{p === "Sekolah" ? f.collegeLevel : p}</option>)}
          </select>
        </label>
        <label className="text-sm">{f.dateLabel}
          <input type="date" name="tarikh" className={`${inputCls} mt-1`} required />
        </label>
        <label className="text-sm">{o.timeLabel}
          <input name="masa" maxLength={HAD.masa} placeholder={o.timePlaceholder} className={`${inputCls} mt-1`} />
        </label>
        <label className="text-sm">{o.placeLabel}
          <input name="tempat" maxLength={HAD.tempat} placeholder={o.placePlaceholder} className={`${inputCls} mt-1`} required />
        </label>
        <label className="text-sm">{f.unitLabel}
          <select name="namaUnit" className={`${inputCls} mt-1`} required defaultValue="">
            <option value="" disabled>{f.unitPlaceholder}</option>
            {units.map((u, i) => <option key={i} value={u.namaUnit}>{unitLabel[u.jenisKoko] ?? u.jenisKoko}: {u.namaUnit}</option>)}
          </select>
        </label>
        {tab === "projek" && projekDipilih && (
          <div className="text-sm">{o.yourPosition}
            <p className={`${inputCls} mt-1 bg-slate-50 text-slate-600`}>
              {JAWATAN_PERANAN[projekDipilih.peranan]} <span className="text-xs text-slate-400">({o.setByTeacher})</span>
            </p>
          </div>
        )}
        {tab === "mingguan" && (
          <label className="text-sm">{t.sessionLinkLabel}
            <select name="sesiId" className={`${inputCls} mt-1`} defaultValue="">
              <option value="">{t.selectSessionOptional}</option>
              {sesiList.map((s) => <option key={s.id} value={s.id}>{s.namaUnit} · {t.sessionLabel} {s.bilPerjumpaan}</option>)}
            </select>
          </label>
        )}
        {tab === "projek" && (
          <div className="text-sm sm:col-span-2">
            <span>{o.participantsLabel} ({peserta.length})</span>
            <p className="text-xs text-slate-400">{o.participantsHint}</p>
            {projekDipilih && projekDipilih.ajk.some((a) => a.id !== pelajarId) && (
              <ul className="mt-2 divide-y divide-slate-100 rounded-lg bg-slate-50 ring-1 ring-slate-200">
                {projekDipilih.ajk.filter((a) => a.id !== pelajarId).map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5">
                    <span className="min-w-0 truncate">{a.nama} <span className="text-xs text-slate-400">({a.kelas ?? "-"})</span></span>
                    <span className="text-xs font-semibold text-slate-600">🔒 {JAWATAN_PERANAN[a.peranan]} <span className="font-normal text-slate-400">({o.setByTeacher})</span></span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2">
              <CariPelajar
                pelajar={calon}
                kecuali={new Set([pelajarId, ...peserta.map((x) => x.id), ...(projekDipilih?.ajk.map((a) => a.id) ?? [])])}
                placeholder={o.searchStudent}
                tiadaPadanan={o.noMatch}
                onPilih={(c) => { setPeserta((s) => [...s, { ...c, jawatan: "Ahli" }]); tandaBerubah(); }}
              />
            </div>
            {peserta.length > 0 && (
              <ul className="mt-2 divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200">
                {peserta.map((x) => (
                  <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5">
                    <span className="min-w-0 truncate">{x.nama} <span className="text-xs text-slate-400">({x.kelas ?? "-"})</span></span>
                    <span className="flex items-center gap-2">
                      <select value={x.jawatan} aria-label={t.positionLabel}
                        onChange={(e) => { const v = e.target.value; setPeserta((s) => s.map((y) => y.id === x.id ? { ...y, jawatan: v } : y)); tandaBerubah(); }}
                        className="rounded border border-slate-300 px-1.5 py-1 text-xs">
                        {JAWATAN_PESERTA.map((j) => <option key={j} value={j}>{j}</option>)}
                      </select>
                      <button type="button" onClick={() => { setPeserta((s) => s.filter((y) => y.id !== x.id)); tandaBerubah(); }}
                        className="text-xs font-semibold text-red-600 hover:underline">{o.removeParticipant}</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
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
      </>)}
    </section>
  );
}
