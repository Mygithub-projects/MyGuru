"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const KOSONG = {
  nama: "",
  noIc: "",
  kelasT6: "",
  jantina: "",
  kaum: "",
  agama: "",
  email: "",
  noTel: "",
  subRole: "Pelajar",
};

interface TambahPelajarDict {
  fullName: string; classT6: string; role: string; gender: string; race: string; religion: string;
  email: string; phone: string; icForLogin: string; classPlaceholder: string; emailOptional: string;
  phoneOptional: string; credentialNote: string; addSuccess: string; addFailed: string; networkError: string;
  male: string; female: string;
  kaum: { melayu: string; cina: string; india: string; lainLain: string };
  agama: { islam: string; buddha: string; hindu: string; kristian: string; lainLain: string };
  subRole: { pelajar: string; su: string; nsu: string };
  credentialReveal: string; usernameLabel: string; passwordLabel: string; copyCredentials: string;
  submitAdd: string; submitting: string;
}

export function TambahPelajarForm({ t }: { t: TambahPelajarDict }) {
  const router = useRouter();
  const KAUM = [
    { v: "Melayu", l: t.kaum.melayu }, { v: "Cina", l: t.kaum.cina },
    { v: "India", l: t.kaum.india }, { v: "Lain-lain", l: t.kaum.lainLain },
  ];
  const AGAMA = [
    { v: "Islam", l: t.agama.islam }, { v: "Buddha", l: t.agama.buddha }, { v: "Hindu", l: t.agama.hindu },
    { v: "Kristian", l: t.agama.kristian }, { v: "Lain-lain", l: t.agama.lainLain },
  ];
  const SUBROLE = [
    { v: "Pelajar", l: t.subRole.pelajar },
    { v: "SU", l: t.subRole.su },
    { v: "NSU", l: t.subRole.nsu },
  ];
  const [f, setF] = useState({ ...KOSONG });
  const [hantar, setHantar] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; teks: string } | null>(null);
  const [kred, setKred] = useState<{ username: string; kataLaluan: string } | null>(null);

  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  const inp = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
  const lbl = "text-xs font-medium text-slate-600";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setHantar(true);
    setMsg(null);
    setKred(null);
    try {
      const res = await fetch("/api/admin/pelajar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ ok: true, teks: j.message ?? t.addSuccess });
        if (j.data?.kataLaluan) setKred({ username: j.data.username, kataLaluan: j.data.kataLaluan });
        setF({ ...KOSONG });
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
          <input required value={f.nama} onChange={(e) => set("nama", e.target.value)} className={`${inp} mt-1`} placeholder="cth: Ahmad bin Ali" />
        </label>
        <label className={lbl}>{t.icForLogin}
          <input required value={f.noIc} onChange={(e) => set("noIc", e.target.value)} className={`${inp} mt-1`} placeholder="12 digit" inputMode="numeric" />
        </label>
        <label className={lbl}>{t.classT6}
          <input value={f.kelasT6} onChange={(e) => set("kelasT6", e.target.value)} className={`${inp} mt-1`} placeholder={t.classPlaceholder} />
        </label>
        <label className={lbl}>{t.role}
          <select value={f.subRole} onChange={(e) => set("subRole", e.target.value)} className={`${inp} mt-1`}>
            {SUBROLE.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </label>
        <label className={lbl}>{t.gender}
          <select value={f.jantina} onChange={(e) => set("jantina", e.target.value)} className={`${inp} mt-1`}>
            <option value="">—</option>
            <option value="L">{t.male}</option>
            <option value="P">{t.female}</option>
          </select>
        </label>
        <label className={lbl}>{t.race}
          <select value={f.kaum} onChange={(e) => set("kaum", e.target.value)} className={`${inp} mt-1`}>
            <option value="">—</option>
            {KAUM.map((k) => <option key={k.v} value={k.v}>{k.l}</option>)}
          </select>
        </label>
        <label className={lbl}>{t.religion}
          <select value={f.agama} onChange={(e) => set("agama", e.target.value)} className={`${inp} mt-1`}>
            <option value="">—</option>
            {AGAMA.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}
          </select>
        </label>
        <label className={lbl}>{t.emailOptional}
          <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={`${inp} mt-1`} placeholder="—" />
        </label>
        <label className={lbl}>{t.phoneOptional}
          <input value={f.noTel} onChange={(e) => set("noTel", e.target.value)} className={`${inp} mt-1`} placeholder="—" />
        </label>
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
