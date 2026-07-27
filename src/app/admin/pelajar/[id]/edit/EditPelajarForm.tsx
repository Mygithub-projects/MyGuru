"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface PelajarEdit {
  id: string;
  nama: string;
  noIc: string;
  kelasT6: string | null;
  jantina: string | null;
  kaum: string | null;
  agama: string | null;
  email: string | null;
  noTel: string | null;
  subRole: string;
  statusAktif: boolean;
}

interface EditPelajarDict {
  fullName: string; icNoDisabled: string; classT6: string; role: string; gender: string;
  race: string; religion: string; email: string; phone: string; accountActive: string;
  done: string; saveChanges: string; saving: string; updateSuccess: string; updateFailed: string;
  networkError: string; male: string; female: string;
  kaum: { melayu: string; cina: string; india: string; lainLain: string };
  agama: { islam: string; buddha: string; hindu: string; kristian: string; lainLain: string };
  subRole: { pelajar: string; su: string; nsu: string };
}

export function EditPelajarForm({ pelajar, t }: { pelajar: PelajarEdit; t: EditPelajarDict }) {
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
  const router = useRouter();
  const [f, setF] = useState({
    nama: pelajar.nama,
    kelasT6: pelajar.kelasT6 ?? "",
    jantina: pelajar.jantina ?? "",
    kaum: pelajar.kaum ?? "",
    agama: pelajar.agama ?? "",
    email: pelajar.email ?? "",
    noTel: pelajar.noTel ?? "",
    subRole: pelajar.subRole,
    statusAktif: pelajar.statusAktif,
  });
  const [hantar, setHantar] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; teks: string } | null>(null);

  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));
  const inp = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
  const lbl = "text-xs font-medium text-slate-600";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setHantar(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/pelajar/${pelajar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ ok: true, teks: j.message ?? t.updateSuccess });
        router.refresh();
      } else {
        setMsg({ ok: false, teks: j.message ?? t.updateFailed });
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
          <input required value={f.nama} onChange={(e) => set("nama", e.target.value)} className={`${inp} mt-1`} />
        </label>
        <label className={lbl}>{t.icNoDisabled}
          <input value={pelajar.noIc} disabled className={`${inp} mt-1 bg-slate-50 text-slate-500`} />
        </label>
        <label className={lbl}>{t.classT6}
          <input value={f.kelasT6} onChange={(e) => set("kelasT6", e.target.value)} className={`${inp} mt-1`} placeholder="—" />
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
        <label className={lbl}>{t.email}
          <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={`${inp} mt-1`} placeholder="—" />
        </label>
        <label className={lbl}>{t.phone}
          <input value={f.noTel} onChange={(e) => set("noTel", e.target.value)} className={`${inp} mt-1`} placeholder="—" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={f.statusAktif} onChange={(e) => set("statusAktif", e.target.checked)} className="h-4 w-4 accent-brand" />
        {t.accountActive}
      </label>

      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.teks}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.push("/admin/pelajar")}
          className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">
          {t.done}
        </button>
        <button type="submit" disabled={hantar}
          className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
          {hantar ? t.saving : t.saveChanges}
        </button>
      </div>
    </form>
  );
}
