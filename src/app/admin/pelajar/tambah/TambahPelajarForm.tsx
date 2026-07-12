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

const KAUM = ["Melayu", "Cina", "India", "Lain-lain"];
const AGAMA = ["Islam", "Buddha", "Hindu", "Kristian", "Lain-lain"];
const SUBROLE = [
  { v: "Pelajar", l: "Pelajar biasa" },
  { v: "SU", l: "Setiausaha (SU)" },
  { v: "NSU", l: "Naib Setiausaha (NSU)" },
];

export function TambahPelajarForm() {
  const router = useRouter();
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
        setMsg({ ok: true, teks: j.message ?? "Pelajar berjaya ditambah." });
        if (j.data?.kataLaluan) setKred({ username: j.data.username, kataLaluan: j.data.kataLaluan });
        setF({ ...KOSONG });
        router.refresh();
      } else {
        setMsg({ ok: false, teks: j.message ?? "Gagal menambah pelajar." });
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
          <input required value={f.nama} onChange={(e) => set("nama", e.target.value)} className={`${inp} mt-1`} placeholder="cth: Ahmad bin Ali" />
        </label>
        <label className={lbl}>No. IC (untuk log masuk) *
          <input required value={f.noIc} onChange={(e) => set("noIc", e.target.value)} className={`${inp} mt-1`} placeholder="12 digit" inputMode="numeric" />
        </label>
        <label className={lbl}>Kelas T6
          <input value={f.kelasT6} onChange={(e) => set("kelasT6", e.target.value)} className={`${inp} mt-1`} placeholder="cth: T6 Atas Sains 1" />
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
        <label className={lbl}>Email (pilihan)
          <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={`${inp} mt-1`} placeholder="—" />
        </label>
        <label className={lbl}>No. Telefon (pilihan)
          <input value={f.noTel} onChange={(e) => set("noTel", e.target.value)} className={`${inp} mt-1`} placeholder="—" />
        </label>
      </div>

      <p className="text-xs text-slate-400">
        Akaun log masuk dicipta automatik (username = No. IC). Kata laluan unik dijana dan
        dipaparkan sekali sahaja selepas simpan; pelajar mesti menukarnya semasa log masuk pertama.
        Markah PAJSK & unit kokurikulum boleh dilengkapkan kemudian melalui import atau modul berkaitan.
      </p>

      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.teks}
        </div>
      )}

      {kred && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-800">🔑 Kata laluan dipaparkan SEKALI sahaja — salin & berikan kepada pelajar.</p>
          <div className="mt-2 grid gap-1 font-mono text-sm text-slate-800">
            <div>Username (No. IC): <span className="font-bold">{kred.username}</span></div>
            <div>Kata laluan&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <span className="font-bold">{kred.kataLaluan}</span></div>
          </div>
          <button type="button"
            onClick={() => navigator.clipboard?.writeText(`Username: ${kred.username}\nKata laluan: ${kred.kataLaluan}`)}
            className="mt-2 rounded-md bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-300">
            Salin kredensial
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={hantar}
          className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
          {hantar ? "Menyimpan…" : "Tambah Pelajar"}
        </button>
      </div>
    </form>
  );
}
