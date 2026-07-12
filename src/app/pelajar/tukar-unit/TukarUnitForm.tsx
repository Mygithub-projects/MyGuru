"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function TukarUnitForm({
  pelajarId,
  unitSemasa,
}: {
  pelajarId: string;
  unitSemasa: { jenisKoko: string; namaUnitT6: string | null; statusPertukaran: string }[];
}) {
  const router = useRouter();
  const [jenisKoko, setJenisKoko] = useState("Sukan");
  const [unitBaru, setUnitBaru] = useState("");
  const [sebab, setSebab] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const pilihan = unitSemasa.find((u) => u.jenisKoko === jenisKoko);
  const adaPending = unitSemasa.some((u) => u.statusPertukaran === "Pending");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/pelajar/${pelajarId}/tukar-unit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisKoko, unitBaru, sebab }),
      });
      const json = await res.json();
      setMsg({ text: json.message, ok: json.success });
      if (json.success) {
        setUnitBaru("");
        setSebab("");
        router.refresh();
      }
    } catch {
      setMsg({ text: "Ralat rangkaian", ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
        Borang Permohonan Pertukaran
      </h2>

      {msg && (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Jenis Kokurikulum</label>
        <select
          value={jenisKoko}
          onChange={(e) => setJenisKoko(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="Sukan">Sukan / Permainan</option>
          <option value="Kelab">Kelab / Persatuan</option>
          <option value="Uniform">Badan Beruniform</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Unit semasa: <strong>{pilihan?.namaUnitT6 ?? "Belum ditetapkan"}</strong>
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Unit Baru</label>
        <input
          value={unitBaru}
          onChange={(e) => setUnitBaru(e.target.value)}
          placeholder="cth: Olahraga"
          required
          minLength={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Sebab (pilihan)</label>
        <textarea
          value={sebab}
          onChange={(e) => setSebab(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={busy || adaPending}
        className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
      >
        {adaPending ? "Ada permohonan menunggu kelulusan" : busy ? "Menghantar..." : "Hantar Permohonan"}
      </button>
      {adaPending && (
        <p className="text-center text-xs text-amber-600">
          Anda perlu menunggu keputusan permohonan semasa sebelum memohon lagi.
        </p>
      )}
    </form>
  );
}
