"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Penugasan {
  namaUnit: string;
  jenisKoko: string;
  peranan: string;
}
const KOSONG = { nama: "", email: "", noIc: "", jawatanKoko: "GuruPenasihat" };

interface TambahGuruDict {
  jawatanKoko: { guruPenasihat: string; penolongKetuaGP: string; ketuaGP: string; penolongSU: string; pemantauKUPP: string; penyelaras: string };
  kategori: { kelab: string; sukan: string; uniform: string; perkhidmatan: string };
  peranan: { penasihat: string; ketuaPenasihat: string };
  fullName: string; fullNamePlaceholder: string; email: string; emailPlaceholder: string;
  icOptional: string; icPlaceholder: string; position: string; unitHint: string;
  credentialNote: string; credentialReveal: string; usernameLabel: string; passwordLabel: string;
  copyCredentials: string; submitAdd: string; submitting: string;
  addSuccess: string; addFailed: string; networkError: string;
  unitDiselia: string; unitNamePlaceholder: string; addUnit: string;
}

export function TambahGuruForm({ t }: { t: TambahGuruDict }) {
  const router = useRouter();
  const JAWATAN = [
    { v: "GuruPenasihat", l: t.jawatanKoko.guruPenasihat },
    { v: "PenolongKetuaGP", l: t.jawatanKoko.penolongKetuaGP },
    { v: "KetuaGP", l: t.jawatanKoko.ketuaGP },
    { v: "PenolongSU", l: t.jawatanKoko.penolongSU },
    { v: "PemantauKUPP", l: t.jawatanKoko.pemantauKUPP },
    { v: "Penyelaras", l: t.jawatanKoko.penyelaras },
  ];
  const JENIS = [
    { v: "Kelab", l: t.kategori.kelab }, { v: "Sukan", l: t.kategori.sukan }, { v: "Uniform", l: t.kategori.uniform },
    { v: "Perkhidmatan", l: t.kategori.perkhidmatan },
  ];
  const PERANAN = [{ v: "Penasihat", l: t.peranan.penasihat }, { v: "KetuaPenasihat", l: t.peranan.ketuaPenasihat }];
  const [f, setF] = useState({ ...KOSONG });
  const [units, setUnits] = useState<Penugasan[]>([]);
  const [hantar, setHantar] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; teks: string } | null>(null);
  const [kred, setKred] = useState<{ username: string; kataLaluan: string } | null>(null);

  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  const updUnit = (i: number, k: keyof Penugasan, v: string) =>
    setUnits((u) => u.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const tambahUnit = () => setUnits((u) => [...u, { namaUnit: "", jenisKoko: "Kelab", peranan: "Penasihat" }]);
  const buangUnit = (i: number) => setUnits((u) => u.filter((_, j) => j !== i));
  const inp = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
  const lbl = "text-xs font-medium text-slate-600";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setHantar(true);
    setMsg(null);
    setKred(null);
    try {
      const res = await fetch("/api/admin/guru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, penasihatKelab: units.filter((u) => u.namaUnit.trim().length > 0) }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ ok: true, teks: j.message ?? t.addSuccess });
        if (j.data?.kataLaluan) setKred({ username: j.data.username, kataLaluan: j.data.kataLaluan });
        setF({ ...KOSONG });
        setUnits([]);
        router.refresh();
      } else {
        setMsg({ ok: false, teks: j.message ?? t.addFailed });
      }
    } catch {
      setMsg({ ok: false, teks: t.networkError });
    } finally {
      setHantar(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={lbl}>{t.fullName}
          <input required value={f.nama} onChange={(e) => set("nama", e.target.value)} className={`${inp} mt-1`} placeholder={t.fullNamePlaceholder} />
        </label>
        <label className={lbl}>{t.email}
          <input required type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={`${inp} mt-1`} placeholder={t.emailPlaceholder} />
        </label>
        <label className={lbl}>{t.icOptional}
          <input value={f.noIc} onChange={(e) => set("noIc", e.target.value)} className={`${inp} mt-1`} placeholder={t.icPlaceholder} inputMode="numeric" />
        </label>
        <label className={lbl}>{t.position}
          <select value={f.jawatanKoko} onChange={(e) => set("jawatanKoko", e.target.value)} className={`${inp} mt-1`}>
            {JAWATAN.map((j) => <option key={j.v} value={j.v}>{j.l}</option>)}
          </select>
        </label>
      </div>

      <div>
        <p className={`${lbl} mb-1.5`}>{t.unitDiselia}</p>
        <p className="mb-2 text-[11px] text-slate-400">
          {t.unitHint}
        </p>
        <div className="space-y-2">
          {units.map((u, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select value={u.jenisKoko} onChange={(e) => updUnit(i, "jenisKoko", e.target.value)} className={`${inp} w-28`}>
                {JENIS.map((j) => <option key={j.v} value={j.v}>{j.l}</option>)}
              </select>
              <input value={u.namaUnit} onChange={(e) => updUnit(i, "namaUnit", e.target.value)} placeholder={t.unitNamePlaceholder} className={`${inp} min-w-[12rem] flex-1`} />
              <select value={u.peranan} onChange={(e) => updUnit(i, "peranan", e.target.value)} className={`${inp} w-40`}>
                {PERANAN.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
              </select>
              <button type="button" onClick={() => buangUnit(i)} className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-600 hover:text-white">✕</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={tambahUnit} className="mt-2 rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">{t.addUnit}</button>
      </div>

      <p className="text-xs text-slate-400">
        {t.credentialNote}
      </p>

      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.teks}
        </div>
      )}

      {kred && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-800">{t.credentialReveal}</p>
          <div className="mt-2 grid gap-1 font-mono text-sm text-slate-800">
            <div>{t.usernameLabel}: <span className="font-bold">{kred.username}</span></div>
            <div>{t.passwordLabel}: <span className="font-bold">{kred.kataLaluan}</span></div>
          </div>
          <button type="button"
            onClick={() => navigator.clipboard?.writeText(`${t.usernameLabel}: ${kred.username}\n${t.passwordLabel}: ${kred.kataLaluan}`)}
            className="mt-2 rounded-md bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-300">
            {t.copyCredentials}
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={hantar}
          className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
          {hantar ? t.submitting : t.submitAdd}
        </button>
      </div>
    </form>
  );
}
