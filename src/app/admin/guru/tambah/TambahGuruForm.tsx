"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const JAWATAN: { v: string; l: string }[] = [
  { v: "GuruPenasihat", l: "Guru Penasihat" },
  { v: "PenolongKetuaGP", l: "Penolong Ketua GP" },
  { v: "KetuaGP", l: "Ketua Guru Penasihat" },
  { v: "PenolongSU", l: "Penolong SU Kokurikulum" },
  { v: "PemantauKUPP", l: "Pemantau (KUPP)" },
  { v: "Penyelaras", l: "Penyelaras Kokurikulum" },
];
const JENIS = ["Kelab", "Sukan", "Uniform"];
const PERANAN = ["Penasihat", "KetuaPenasihat"];

interface Penugasan {
  namaUnit: string;
  jenisKoko: string;
  peranan: string;
}
const KOSONG = { nama: "", email: "", noIc: "", jawatanKoko: "GuruPenasihat" };

export function TambahGuruForm() {
  const router = useRouter();
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
        setMsg({ ok: true, teks: j.message ?? "Guru berjaya ditambah." });
        if (j.data?.kataLaluan) setKred({ username: j.data.username, kataLaluan: j.data.kataLaluan });
        setF({ ...KOSONG });
        setUnits([]);
        router.refresh();
      } else {
        setMsg({ ok: false, teks: j.message ?? "Gagal menambah guru." });
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
          <input required value={f.nama} onChange={(e) => set("nama", e.target.value)} className={`${inp} mt-1`} placeholder="cth: Cikgu Ahmad bin Ali" />
        </label>
        <label className={lbl}>Email (untuk log masuk) *
          <input required type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={`${inp} mt-1`} placeholder="cikgu@sekolah.edu.my" />
        </label>
        <label className={lbl}>No. IC (pilihan)
          <input value={f.noIc} onChange={(e) => set("noIc", e.target.value)} className={`${inp} mt-1`} placeholder="12 digit" inputMode="numeric" />
        </label>
        <label className={lbl}>Jawatan Kokurikulum *
          <select value={f.jawatanKoko} onChange={(e) => set("jawatanKoko", e.target.value)} className={`${inp} mt-1`}>
            {JAWATAN.map((j) => <option key={j.v} value={j.v}>{j.l}</option>)}
          </select>
        </label>
      </div>

      <div>
        <p className={`${lbl} mb-1.5`}>Unit Diselia (Kelab / Sukan / Badan Beruniform)</p>
        <p className="mb-2 text-[11px] text-slate-400">
          Guru hanya boleh melihat & mengesahkan pelajar dalam unit yang ditugaskan di sini. Boleh tambah lebih daripada satu unit.
        </p>
        <div className="space-y-2">
          {units.map((u, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select value={u.jenisKoko} onChange={(e) => updUnit(i, "jenisKoko", e.target.value)} className={`${inp} w-28`}>
                {JENIS.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
              <input value={u.namaUnit} onChange={(e) => updUnit(i, "namaUnit", e.target.value)} placeholder="Nama unit (cth: Kelab Komputer)" className={`${inp} min-w-[12rem] flex-1`} />
              <select value={u.peranan} onChange={(e) => updUnit(i, "peranan", e.target.value)} className={`${inp} w-40`}>
                {PERANAN.map((p) => <option key={p} value={p}>{p === "KetuaPenasihat" ? "Ketua Penasihat" : "Penasihat"}</option>)}
              </select>
              <button type="button" onClick={() => buangUnit(i)} className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-600 hover:text-white">✕</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={tambahUnit} className="mt-2 rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">➕ Tambah unit</button>
      </div>

      <p className="text-xs text-slate-400">
        Akaun log masuk dicipta automatik (username = email). Kata laluan unik dijana dan
        dipaparkan sekali sahaja selepas simpan; guru mesti menukarnya semasa log masuk pertama.
      </p>

      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.teks}
        </div>
      )}

      {kred && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-800">🔑 Kata laluan dipaparkan SEKALI sahaja — salin & berikan kepada guru.</p>
          <div className="mt-2 grid gap-1 font-mono text-sm text-slate-800">
            <div>Username&nbsp;&nbsp;: <span className="font-bold">{kred.username}</span></div>
            <div>Kata laluan: <span className="font-bold">{kred.kataLaluan}</span></div>
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
          {hantar ? "Menyimpan…" : "Tambah Guru"}
        </button>
      </div>
    </form>
  );
}
