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

const KAUM = ["Melayu", "Cina", "India", "Lain-lain"];
const AGAMA = ["Islam", "Buddha", "Hindu", "Kristian", "Lain-lain"];
const SUBROLE = [
  { v: "Pelajar", l: "Pelajar biasa" },
  { v: "SU", l: "Setiausaha (SU)" },
  { v: "NSU", l: "Naib Setiausaha (NSU)" },
];

export function EditPelajarForm({ pelajar }: { pelajar: PelajarEdit }) {
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
        setMsg({ ok: true, teks: j.message ?? "Maklumat dikemas kini." });
        router.refresh();
      } else {
        setMsg({ ok: false, teks: j.message ?? "Gagal mengemas kini." });
      }
    } catch {
      setMsg({ ok: false, teks: "Ralat rangkaian." });
    } finally {
      setHantar(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={lbl}>Nama penuh *
          <input required value={f.nama} onChange={(e) => set("nama", e.target.value)} className={`${inp} mt-1`} />
        </label>
        <label className={lbl}>No. IC (tidak boleh diubah)
          <input value={pelajar.noIc} disabled className={`${inp} mt-1 bg-slate-50 text-slate-500`} />
        </label>
        <label className={lbl}>Kelas T6
          <input value={f.kelasT6} onChange={(e) => set("kelasT6", e.target.value)} className={`${inp} mt-1`} placeholder="—" />
        </label>
        <label className={lbl}>Peranan
          <select value={f.subRole} onChange={(e) => set("subRole", e.target.value)} className={`${inp} mt-1`}>
            {SUBROLE.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </label>
        <label className={lbl}>Jantina
          <select value={f.jantina} onChange={(e) => set("jantina", e.target.value)} className={`${inp} mt-1`}>
            <option value="">—</option>
            <option value="L">Lelaki</option>
            <option value="P">Perempuan</option>
          </select>
        </label>
        <label className={lbl}>Kaum
          <select value={f.kaum} onChange={(e) => set("kaum", e.target.value)} className={`${inp} mt-1`}>
            <option value="">—</option>
            {KAUM.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <label className={lbl}>Agama
          <select value={f.agama} onChange={(e) => set("agama", e.target.value)} className={`${inp} mt-1`}>
            <option value="">—</option>
            {AGAMA.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className={lbl}>Email
          <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={`${inp} mt-1`} placeholder="—" />
        </label>
        <label className={lbl}>No. Telefon
          <input value={f.noTel} onChange={(e) => set("noTel", e.target.value)} className={`${inp} mt-1`} placeholder="—" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={f.statusAktif} onChange={(e) => set("statusAktif", e.target.checked)} className="h-4 w-4 accent-brand" />
        Akaun aktif (boleh log masuk)
      </label>

      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.teks}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.push("/admin/pelajar")}
          className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">
          Selesai
        </button>
        <button type="submit" disabled={hantar}
          className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
          {hantar ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
