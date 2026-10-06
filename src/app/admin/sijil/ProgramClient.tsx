"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { SijilPreview } from "./SijilPreview";

type ProgramDict = Dict["admin"]["ecertProgram"];

interface Tetapan {
  institusi: string;
  tajukSijil: string;
  namaPenandatangan: string;
  jawatanPenandatangan: string;
  teksCop: string;
}
interface ProgramRingkas {
  id: string;
  namaProgram: string;
  tarikh: string; // YYYY-MM-DD
  peringkat: string;
  tempat: string | null;
  tahunSiri: number;
  bilPeserta: number;
}
interface Murid {
  idMoeis: string | null;
  nama: string;
  noKp: string;
  kodSekolah: string | null;
  namaSekolah: string | null;
  namaKelas: string | null;
}
interface Peserta {
  id: string;
  nama: string;
  noKp: string;
  namaSekolah: string | null;
  peranan: string;
  noSiri: string;
}

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

async function api<T>(url: string, init?: RequestInit): Promise<{ success: boolean; message?: string; data?: T }> {
  try {
    const res = await fetch(url, init);
    return await res.json();
  } catch {
    return { success: false, message: "Ralat rangkaian" };
  }
}

// Format sama seperti PDF (toLocaleDateString("ms-MY")): d/m/yyyy.
function formatTarikh(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? `${d}/${m}/${y}` : "";
}

function ayatPeranan(peranan: string): string {
  return peranan && peranan !== "Peserta" ? `telah berkhidmat sebagai ${peranan} dalam` : "telah menyertai";
}

function formatSiri(awalan: string, tahun: number, n: number): string {
  return `${awalan}/${tahun}/${String(n).padStart(4, "0")}`;
}

export function ProgramClient({
  programs: awal,
  tetapan,
  tahunPilihan,
  awalanSiri,
  modSimpan,
  t,
}: {
  programs: ProgramRingkas[];
  tetapan: Tetapan;
  tahunPilihan: number[];
  awalanSiri: string;
  /** false = jadual belum wujud: jana PDF terus tanpa rekod; admin tetapkan nombor mula. */
  modSimpan: boolean;
  t: ProgramDict;
}) {
  const tahunIni = new Date().getFullYear();
  const [programs, setPrograms] = useState(awal);
  const [form, setForm] = useState({
    namaProgram: "",
    tarikh: "",
    peringkat: t.levels[0] ?? "Zon",
    tempat: "",
    tahunSiri: tahunPilihan.includes(tahunIni) ? tahunIni : tahunPilihan[0],
    peranan: t.roles[0] ?? "Peserta",
    nomborMula: 1,
    namaPenandatangan: tetapan.namaPenandatangan,
    jawatanPenandatangan: tetapan.jawatanPenandatangan,
  });
  const [dipilih, setDipilih] = useState<Murid[]>([]);
  const [pratontonKp, setPratontonKp] = useState<string | null>(null);
  const [siriMula, setSiriMula] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // No. Siri seterusnya bagi tahun dipilih (pratonton sahaja — nombor sebenar diberi semasa simpan).
  useEffect(() => {
    if (!modSimpan) return;
    let batal = false;
    api<{ nombor: number }>(`/api/admin/ecert-program/siri?tahun=${form.tahunSiri}`).then((r) => {
      if (!batal) setSiriMula(r.success && r.data ? r.data.nombor : 1);
    });
    return () => { batal = true; };
  }, [form.tahunSiri, programs, modSimpan]);
  const mula = modSimpan ? siriMula : form.nomborMula;

  // Pelajar disusun ikut nama — sama seperti susunan No. Siri dijana di pelayan.
  const susun = [...dipilih].sort((a, b) => a.nama.localeCompare(b.nama));
  const idxPratonton = Math.max(0, susun.findIndex((m) => m.noKp === pratontonKp));
  const pratonton = susun[idxPratonton];

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (dipilih.length === 0) {
      setMsg({ text: t.noneChosen, ok: false });
      return;
    }
    if (!modSimpan) return janaTerus();
    setBusy(true);
    setMsg(null);
    const r = await api<{ id: string; ditambah: number }>("/api/admin/ecert-program", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, noKp: dipilih.map((m) => m.noKp) }),
    });
    setBusy(false);
    setMsg({ text: r.message ?? "", ok: r.success });
    if (r.success && r.data) {
      setPrograms((ps) => [
        { id: r.data!.id, namaProgram: form.namaProgram, tarikh: form.tarikh, peringkat: form.peringkat,
          tempat: form.tempat || null, tahunSiri: form.tahunSiri, bilPeserta: r.data!.ditambah },
        ...ps,
      ]);
      setDipilih([]);
      setPratontonKp(null);
      setForm((f) => ({ ...f, namaProgram: "", tempat: "" }));
      window.open(`/api/admin/ecert-program/${r.data.id}/pdf`, "_blank", "noopener");
    }
  }

  // Mod tanpa simpan: POST → PDF (blob). Tetingkap dibuka segera (dalam klik)
  // supaya tidak disekat penyekat pop-up, kemudian diisi dengan PDF.
  async function janaTerus() {
    const w = window.open("", "_blank");
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/ecert-program/jana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, noKp: dipilih.map((m) => m.noKp) }),
      });
      if (!res.ok || !res.headers.get("Content-Type")?.includes("pdf")) {
        const j = await res.json().catch(() => ({}));
        w?.close();
        setMsg({ text: j.message ?? "Ralat menjana PDF", ok: false });
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      if (w) w.location.href = url;
      else window.location.href = url;
      setMsg({ text: `${dipilih.length} e-Cert dijana (${formatSiri(awalanSiri, form.tahunSiri, form.nomborMula)} – ${formatSiri(awalanSiri, form.tahunSiri, form.nomborMula + dipilih.length - 1)})`, ok: true });
      setForm((f) => ({ ...f, nomborMula: f.nomborMula + dipilih.length }));
    } catch {
      w?.close();
      setMsg({ text: "Ralat rangkaian", ok: false });
    } finally {
      setBusy(false);
    }
  }

  const label = (teks: string, isi: React.ReactNode) => (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{teks}</span>
      {isi}
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={simpan} className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          {!modSimpan && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">{t.noSaveMode}</p>
          )}
          {msg && (
            <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
              {msg.text}
            </div>
          )}
          {label(t.programName,
            <input className={inputCls} required minLength={3} value={form.namaProgram}
              onChange={(e) => setForm({ ...form, namaProgram: e.target.value })} />)}
          <div className="grid gap-3 sm:grid-cols-2">
            {label(t.date,
              <input type="date" className={inputCls} required value={form.tarikh}
                onChange={(e) => setForm({ ...form, tarikh: e.target.value })} />)}
            {label(t.level,
              <select className={inputCls} value={form.peringkat} onChange={(e) => setForm({ ...form, peringkat: e.target.value })}>
                {t.levels.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {label(t.venue,
              <input className={inputCls} value={form.tempat} onChange={(e) => setForm({ ...form, tempat: e.target.value })} />)}
            {label(t.serialYear,
              <select className={inputCls} value={form.tahunSiri}
                onChange={(e) => setForm({ ...form, tahunSiri: Number(e.target.value) })}>
                {tahunPilihan.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>)}
          </div>
          {!modSimpan && label(t.startNumber,
            <input type="number" min={1} max={99999} required className={inputCls} value={form.nomborMula}
              onChange={(e) => setForm({ ...form, nomborMula: Math.max(1, Number(e.target.value) || 1) })} />)}

          <div className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">{t.students}</span>
            <PemilihPelajar
              dipilih={dipilih}
              onPilih={(m) => {
                setDipilih((d) => (d.some((x) => x.noKp === m.noKp) ? d : [...d, m]));
                setPratontonKp(m.noKp);
              }}
              t={t}
            />
            <SenaraiDipilih
              senarai={susun}
              aktifKp={pratonton?.noKp ?? null}
              siri={(i) => (mula ? formatSiri(awalanSiri, form.tahunSiri, mula + i) : "…")}
              onKlik={setPratontonKp}
              onBuang={(kp) => setDipilih((d) => d.filter((x) => x.noKp !== kp))}
              t={t}
            />
          </div>

          {label(t.role,
            <select className={inputCls} value={form.peranan} onChange={(e) => setForm({ ...form, peranan: e.target.value })}>
              {t.roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>)}

          <div className="grid gap-3 sm:grid-cols-2">
            {label(t.signerName,
              <input className={inputCls} maxLength={120} value={form.namaPenandatangan}
                onChange={(e) => setForm({ ...form, namaPenandatangan: e.target.value })} />)}
            {label(t.signerPosition,
              <input className={inputCls} maxLength={120} value={form.jawatanPenandatangan}
                onChange={(e) => setForm({ ...form, jawatanPenandatangan: e.target.value })} />)}
          </div>

          <button disabled={busy} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
            {busy ? t.saving : `${modSimpan ? t.saveGenerate : t.generatePdf}${dipilih.length ? ` (${dipilih.length})` : ""}`}
          </button>
        </form>

        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:self-start">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.previewTitle}</h2>
          <SijilPreview
            {...tetapan}
            namaPenandatangan={form.namaPenandatangan}
            jawatanPenandatangan={form.jawatanPenandatangan}
            nama={pratonton ? pratonton.nama.toUpperCase() : t.previewStudent}
            barisIdentiti={pratonton ? `No. KP: ${pratonton.noKp}` : t.previewIc}
            ayat={ayatPeranan(form.peranan)}
            namaAktiviti={form.namaProgram || t.previewProgram}
            barisPeringkat={`Peringkat ${form.peringkat}${form.tempat ? `  ·  ${form.tempat}` : ""}`}
            tarikh={`Tarikh: ${form.tarikh ? formatTarikh(form.tarikh) : "—"}`}
            noSiri={`No. Siri: ${mula ? formatSiri(awalanSiri, form.tahunSiri, mula + idxPratonton) : "…"}`}
          />
          {susun.length > 1 && (
            <p className="mt-2 text-xs text-slate-500">
              {t.previewOf} {idxPratonton + 1} / {susun.length}
            </p>
          )}
        </section>
      </div>

      {modSimpan && <ProgramTersimpan programs={programs} setPrograms={setPrograms} t={t} />}
    </div>
  );
}

/** Kotak carian: taip nama / No. KP → senarai cadangan → klik untuk pilih. */
function PemilihPelajar({
  dipilih,
  onPilih,
  t,
}: {
  dipilih: { noKp: string }[];
  onPilih: (m: Murid) => void;
  t: ProgramDict;
}) {
  const [q, setQ] = useState("");
  const [hasil, setHasil] = useState<Murid[] | null>(null);
  const [mencari, setMencari] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);
  const [buka, setBuka] = useState(false);
  const kotak = useRef<HTMLDivElement>(null);
  const senaraiId = useId();

  // Carian ditangguh 300ms selepas berhenti menaip.
  useEffect(() => {
    const kata = q.trim();
    if (kata.length < 3) return;
    let batal = false;
    const id = setTimeout(() => {
      setMencari(true);
      api<Murid[]>(`/api/admin/ecert-program/murid?${new URLSearchParams({ q: kata })}`).then((r) => {
        if (batal) return;
        setMencari(false);
        setRalat(r.success ? null : r.message ?? "Ralat");
        setHasil(r.success ? r.data ?? [] : null);
        setBuka(true);
      });
    }, 300);
    return () => { batal = true; clearTimeout(id); };
  }, [q]);

  useEffect(() => {
    if (!buka) return;
    const luar = (e: MouseEvent) => {
      if (kotak.current && !kotak.current.contains(e.target as Node)) setBuka(false);
    };
    document.addEventListener("mousedown", luar);
    return () => document.removeEventListener("mousedown", luar);
  }, [buka]);

  const sedia = new Set(dipilih.map((d) => d.noKp));
  const pendek = q.trim().length < 3;

  return (
    <div ref={kotak} className="relative">
      <input
        className={inputCls}
        value={q}
        placeholder="🔍"
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => hasil && setBuka(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setBuka(false);
          if (e.key === "Enter") {
            e.preventDefault();
            const pertama = hasil?.find((m) => !sedia.has(m.noKp));
            if (pertama) onPilih(pertama);
          }
        }}
        role="combobox"
        aria-controls={senaraiId}
        aria-autocomplete="list"
        aria-expanded={buka}
      />
      <p className="mt-1 text-xs text-slate-400">{mencari ? t.searching : t.studentHint}</p>
      {buka && !pendek && (
        <div id={senaraiId} className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg bg-white shadow-lg ring-1 ring-slate-200" role="listbox">
          {ralat ? (
            <p className="px-3 py-2 text-sm text-red-600">{ralat}</p>
          ) : !hasil || hasil.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400">{t.noResults}</p>
          ) : (
            <>
              {hasil.map((m) => {
                const ada = sedia.has(m.noKp);
                return (
                  <button
                    key={m.noKp}
                    type="button"
                    role="option"
                    aria-selected={ada}
                    disabled={ada}
                    onClick={() => onPilih(m)}
                    className="flex w-full items-start justify-between gap-3 border-b border-slate-50 px-3 py-2 text-left text-sm last:border-0 hover:bg-brand-light disabled:cursor-default disabled:opacity-50 disabled:hover:bg-white"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-800">{m.nama}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {m.noKp}{m.namaSekolah ? ` · ${m.namaSekolah}` : ""}
                      </span>
                    </span>
                    {ada && <span className="shrink-0 text-xs font-semibold text-emerald-600">✓ {t.alreadyIn}</span>}
                  </button>
                );
              })}
              {hasil.length >= 20 && <p className="px-3 py-1.5 text-xs text-amber-700">{t.resultsCapped}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SenaraiDipilih({
  senarai,
  aktifKp,
  siri,
  onKlik,
  onBuang,
  t,
}: {
  senarai: Murid[];
  aktifKp: string | null;
  siri: (i: number) => string;
  onKlik: (kp: string) => void;
  onBuang: (kp: string) => void;
  t: ProgramDict;
}) {
  if (senarai.length === 0) return <p className="mt-2 text-xs text-slate-400">{t.noneChosen}</p>;
  return (
    <ul className="mt-2 max-h-60 space-y-1 overflow-auto">
      {senarai.map((m, i) => (
        <li key={m.noKp}
          className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs ring-1 ${
            m.noKp === aktifKp ? "bg-brand-light ring-brand/40" : "bg-slate-50 ring-slate-200"
          }`}
        >
          <button type="button" onClick={() => onKlik(m.noKp)} className="min-w-0 flex-1 text-left">
            <span className="block truncate font-semibold text-slate-800">{m.nama}</span>
            <span className="block truncate text-slate-500">{m.noKp} · <span className="font-mono">{siri(i)}</span></span>
          </button>
          <button type="button" onClick={() => onBuang(m.noKp)} aria-label={t.remove}
            className="shrink-0 rounded px-1.5 text-base leading-none text-slate-400 hover:bg-red-50 hover:text-red-600">
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}

function ProgramTersimpan({
  programs,
  setPrograms,
  t,
}: {
  programs: ProgramRingkas[];
  setPrograms: React.Dispatch<React.SetStateAction<ProgramRingkas[]>>;
  t: ProgramDict;
}) {
  const [bukaId, setBukaId] = useState<string | null>(null);

  async function padam(p: ProgramRingkas) {
    if (!confirm(t.confirmDeleteProgram)) return;
    const r = await api(`/api/admin/ecert-program/${p.id}`, { method: "DELETE" });
    if (r.success) setPrograms((ps) => ps.filter((x) => x.id !== p.id));
    else alert(r.message);
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{t.savedPrograms}</h2>
      {programs.length === 0 ? (
        <p className="text-sm text-slate-400">{t.noPrograms}</p>
      ) : (
        <ul className="space-y-2">
          {programs.map((p) => (
            <li key={p.id} className="rounded-lg border border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{p.namaProgram}</p>
                  <p className="text-xs text-slate-500">
                    {formatTarikh(p.tarikh)} · {p.peringkat}{p.tempat ? ` · ${p.tempat}` : ""} · {p.bilPeserta} {t.participants}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setBukaId(bukaId === p.id ? null : p.id)}
                    className="rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-dark ring-1 ring-brand/40 hover:bg-brand-light">
                    {bukaId === p.id ? t.hideParticipants : t.viewParticipants}
                  </button>
                  <a href={p.bilPeserta ? `/api/admin/ecert-program/${p.id}/pdf` : undefined} target="_blank" rel="noopener noreferrer"
                    aria-disabled={!p.bilPeserta}
                    className={`rounded-md bg-brand px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover ${p.bilPeserta ? "" : "pointer-events-none opacity-40"}`}>
                    {t.generateAll}
                  </a>
                  <button type="button" onClick={() => padam(p)}
                    className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100">
                    {t.deleteProgram}
                  </button>
                </div>
              </div>
              {bukaId === p.id && (
                <ButiranPeserta
                  program={p}
                  t={t}
                  onBil={(bil) => setPrograms((ps) => ps.map((x) => (x.id === p.id ? { ...x, bilPeserta: bil } : x)))}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ButiranPeserta({
  program,
  t,
  onBil,
}: {
  program: ProgramRingkas;
  t: ProgramDict;
  onBil: (bil: number) => void;
}) {
  const [peserta, setPeserta] = useState<Peserta[] | null>(null);
  const [pilihBuang, setPilihBuang] = useState<Set<string>>(new Set());
  const [tambah, setTambah] = useState<Murid[]>([]);
  const [peranan, setPeranan] = useState(t.roles[0] ?? "Peserta");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const ambil = () => api<{ peserta: Peserta[] }>(`/api/admin/ecert-program/${program.id}`);
  const terima = (r: Awaited<ReturnType<typeof ambil>>) => {
    if (r.success && r.data) {
      setPeserta(r.data.peserta);
      onBil(r.data.peserta.length);
    }
  };
  useEffect(() => {
    // setState berlaku dalam callback .then (async) — bukan segerak dalam effect.
    ambil().then(terima);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program.id]);

  async function simpanTambah() {
    if (tambah.length === 0) return;
    setBusy(true);
    const r = await api(`/api/admin/ecert-program/${program.id}/peserta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noKp: tambah.map((m) => m.noKp), peranan }),
    });
    setBusy(false);
    setMsg({ text: r.message ?? "", ok: r.success });
    if (r.success) {
      setTambah([]);
      terima(await ambil());
    }
  }

  async function buang() {
    if (pilihBuang.size === 0 || !confirm(t.confirmRemove)) return;
    const r = await api(`/api/admin/ecert-program/${program.id}/peserta`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pesertaId: [...pilihBuang] }),
    });
    setMsg({ text: r.message ?? "", ok: r.success });
    setPilihBuang(new Set());
    terima(await ambil());
  }

  const senarai = peserta ?? [];
  const sedia = [...senarai.map((p) => ({ noKp: p.noKp })), ...tambah];

  return (
    <div className="space-y-3 border-t border-slate-100 px-3 py-3">
      {msg && (
        <div className={`rounded-md px-3 py-2 text-xs ${msg.ok ? "bg-brand-light text-brand-dark" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
      )}

      <div className="rounded-lg bg-slate-50 p-3">
        <p className="mb-1 text-xs font-semibold text-slate-600">{t.addStudents}</p>
        <PemilihPelajar dipilih={sedia} onPilih={(m) => setTambah((d) => [...d, m])} t={t} />
        {tambah.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {tambah.map((m) => (
              <span key={m.noKp} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs ring-1 ring-slate-200">
                {m.nama}
                <button type="button" aria-label={t.remove} onClick={() => setTambah((d) => d.filter((x) => x.noKp !== m.noKp))}
                  className="text-slate-400 hover:text-red-600">×</button>
              </span>
            ))}
            <select className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={peranan} onChange={(e) => setPeranan(e.target.value)}>
              {t.roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="button" onClick={simpanTambah} disabled={busy}
              className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
              {busy ? t.adding : `${t.addStudents} (${tambah.length})`}
            </button>
          </div>
        )}
      </div>

      {peserta === null ? (
        <p className="text-sm text-slate-400">…</p>
      ) : senarai.length === 0 ? (
        <p className="text-sm text-slate-400">{t.noParticipants}</p>
      ) : (
        <div className="overflow-x-auto">
          {pilihBuang.size > 0 && (
            <button type="button" onClick={buang}
              className="mb-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
              {t.removeSelected} ({pilihBuang.size})
            </button>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="py-2 pr-2">
                  <input type="checkbox" checked={pilihBuang.size === senarai.length}
                    onChange={(e) => setPilihBuang(e.target.checked ? new Set(senarai.map((p) => p.id)) : new Set())} />
                </th>
                <th className="py-2 pr-3">{t.colName}</th>
                <th className="py-2 pr-3">{t.colIc}</th>
                <th className="py-2 pr-3">{t.colSchool}</th>
                <th className="py-2 pr-3">{t.colRole}</th>
                <th className="py-2 pr-3">{t.colSerial}</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {senarai.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-2">
                    <input type="checkbox" checked={pilihBuang.has(p.id)}
                      onChange={(e) => {
                        const s = new Set(pilihBuang);
                        if (e.target.checked) s.add(p.id); else s.delete(p.id);
                        setPilihBuang(s);
                      }} />
                  </td>
                  <td className="py-2 pr-3 font-medium text-slate-700">{p.nama}</td>
                  <td className="py-2 pr-3 text-slate-600">{p.noKp}</td>
                  <td className="py-2 pr-3 text-slate-600">{p.namaSekolah ?? "-"}</td>
                  <td className="py-2 pr-3 text-slate-600">{p.peranan}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-slate-500">{p.noSiri}</td>
                  <td className="py-2">
                    <a href={`/api/admin/ecert-program/${program.id}/pdf?peserta=${p.id}`} target="_blank" rel="noopener noreferrer"
                      className="rounded-md bg-brand-light px-2 py-1 text-xs font-semibold text-brand-dark ring-1 ring-brand/30 hover:bg-brand hover:text-white">
                      {t.generateOne}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
