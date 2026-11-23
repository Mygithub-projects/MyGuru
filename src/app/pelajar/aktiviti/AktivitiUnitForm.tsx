"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { CariPelajar, type CalonPelajar } from "@/components/CariPelajar";
import { KEDUDUKAN_AKTIVITI, PERINGKAT_AKTIVITI_UNIT, type KedudukanAktiviti } from "@/lib/enums";
import { markahPeserta } from "@/lib/aktiviti-unit-markah";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const TEKS = {
  ms: {
    intro:
      "Daftar aktiviti unit anda bersama peserta dari mana-mana unit. Selepas disahkan Ketua GP / Penolong Ketua GP, setiap peserta mendapat markah Penglibatan (ikut peringkat) dan Pencapaian (ikut kedudukan), dikredit ke unit peserta dalam bidang yang sama.",
    nama: "Nama Program/Aktiviti", peringkat: "Peringkat", kolej: "Sekolah / Kolej", tarikh: "Tarikh Program/Aktiviti",
    unit: "Unit (anda SU/NSU)", unitPilih: "— Pilih unit —", laporan: "Laporan ringkas", eviden: "Eviden",
    peserta: "Peserta & kedudukan", cari: "Cari nama atau kelas pelajar…", tiada: "Tiada padanan",
    semuaKed: "Tetapkan semua:", buang: "Buang", pglb: "Penglibatan", pcp: "Pencapaian",
    hantar: "Hantar untuk pengesahan", tiadaPeserta: "Tambah sekurang-kurangnya seorang peserta.",
    besar: "Fail melebihi 4MB.", rangkaian: "Ralat rangkaian",
    ked: { Penyertaan: "Penyertaan", Johan: "Johan", "Naib Johan": "Naib Johan", Ketiga: "Ketiga" } as Record<string, string>,
  },
  en: {
    intro:
      "Register an activity for your unit with participants from any unit. Once the Head / Assistant Head Advisor confirms it, each participant gets Involvement marks (by level) and Achievement marks (by placing), credited to their unit in the same field.",
    nama: "Programme/Activity Name", peringkat: "Level", kolej: "School / College", tarikh: "Activity Date",
    unit: "Unit (you are SU/NSU)", unitPilih: "— Choose unit —", laporan: "Short report", eviden: "Evidence",
    peserta: "Participants & placing", cari: "Search student name or class…", tiada: "No match",
    semuaKed: "Set all:", buang: "Remove", pglb: "Involvement", pcp: "Achievement",
    hantar: "Submit for confirmation", tiadaPeserta: "Add at least one participant.",
    besar: "File exceeds 4MB.", rangkaian: "Network error",
    ked: { Penyertaan: "Participation", Johan: "Champion", "Naib Johan": "Runner-up", Ketiga: "Third" } as Record<string, string>,
  },
};

interface Unit { jenisKoko: string; namaUnit: string }
type Peserta = CalonPelajar & { kedudukan: KedudukanAktiviti };

/** Borang SU/NSU: satu aktiviti + ramai peserta (mana-mana unit) dengan kedudukan. */
export function AktivitiUnitForm({ units, calon }: { units: Unit[]; calon: CalonPelajar[] }) {
  const router = useRouter();
  const t = TEKS[useLocale() === "en" ? "en" : "ms"];
  const [peringkat, setPeringkat] = useState<string>("Sekolah");
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  async function hantar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    if (peserta.length === 0) return setMsg({ text: t.tiadaPeserta, ok: false });
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const f = form.get("eviden");
    if (f instanceof File && f.size > MAX_UPLOAD_BYTES) return setMsg({ text: t.besar, ok: false });
    form.set("peserta", JSON.stringify(peserta.map((p) => ({ pelajarId: p.id, kedudukan: p.kedudukan }))));
    setBusy(true);
    try {
      const res = await fetch("/api/aktiviti-unit", { method: "POST", body: form });
      const json = (await res.json().catch(() => null)) as { success: boolean; message: string } | null;
      setMsg({ text: json?.message ?? `${t.rangkaian} (${res.status})`, ok: !!json?.success });
      if (json?.success) {
        formEl.reset();
        setPeserta([]);
        setPeringkat("Sekolah");
        router.refresh();
      }
    } catch {
      setMsg({ text: t.rangkaian, ok: false });
    } finally {
      setBusy(false);
    }
  }

  const tetapSemua = (k: KedudukanAktiviti) => setPeserta((s) => s.map((p) => ({ ...p, kedudukan: k })));

  return (
    <form onSubmit={hantar} className="grid gap-3 sm:grid-cols-2">
      <p className="text-xs text-slate-500 sm:col-span-2">{t.intro}</p>
      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm sm:col-span-2 ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.text}
        </div>
      )}
      <label className="text-sm">{t.nama}
        <input name="namaAktiviti" maxLength={200} className={`${inputCls} mt-1`} required />
      </label>
      <label className="text-sm">{t.peringkat}
        <select name="peringkat" value={peringkat} onChange={(e) => setPeringkat(e.target.value)} className={`${inputCls} mt-1`} required>
          {PERINGKAT_AKTIVITI_UNIT.map((p) => (
            <option key={p} value={p}>{p === "Sekolah" ? t.kolej : p}</option>
          ))}
        </select>
      </label>
      <label className="text-sm">{t.tarikh}
        <input type="date" name="tarikh" className={`${inputCls} mt-1`} required />
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
            onPilih={(c) => setPeserta((s) => [...s, { ...c, kedudukan: "Penyertaan" }])}
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
                      }}
                      className="rounded border border-slate-300 px-1.5 py-1 text-xs"
                    >
                      {KEDUDUKAN_AKTIVITI.map((k) => <option key={k} value={k}>{t.ked[k]}</option>)}
                    </select>
                    <span className="whitespace-nowrap text-xs text-slate-500">{t.pglb} {m.penglibatan} · {t.pcp} {m.pencapaian}</span>
                    <button type="button" onClick={() => setPeserta((s) => s.filter((y) => y.id !== p.id))} className="text-xs font-semibold text-red-600 hover:underline">
                      {t.buang}
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <label className="text-sm sm:col-span-2">{t.laporan}
        <textarea name="laporan" rows={4} maxLength={2000} className={`${inputCls} mt-1`} required />
      </label>
      <label className="text-sm sm:col-span-2">{t.eviden}
        <input name="eviden" type="file" className={`${inputCls} mt-1`} required />
      </label>
      <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 sm:w-auto">
        {busy ? "..." : t.hantar}
      </button>
    </form>
  );
}
