"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface PelajarRingkas {
  id: string;
  nama: string;
  kelasT6: string | null;
  sukan: string | null;
}

// Peringkat pertandingan (tanpa "Sekolah" — pemilihan ini untuk mewakili keluar).
const PERINGKAT_PERTANDINGAN = ["Zon/Daerah", "Daerah", "Negeri", "Kebangsaan", "Antarabangsa"] as const;

export function PemilihanForm({ pelajar }: { pelajar: PelajarRingkas[] }) {
  const router = useRouter();
  const [namaAktiviti, setNamaAktiviti] = useState("");
  const [peringkat, setPeringkat] = useState<string>("Negeri");
  const [tarikh, setTarikh] = useState("");
  const [carian, setCarian] = useState("");
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [hantar, setHantar] = useState(false);
  const [mesej, setMesej] = useState<{ ok: boolean; teks: string } | null>(null);

  const ditapis = useMemo(() => {
    const q = carian.trim().toLowerCase();
    if (!q) return pelajar;
    return pelajar.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        (p.kelasT6 ?? "").toLowerCase().includes(q) ||
        (p.sukan ?? "").toLowerCase().includes(q)
    );
  }, [pelajar, carian]);

  function toggle(id: string) {
    setDipilih((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function pilihSemua() {
    setDipilih((prev) => {
      const next = new Set(prev);
      const semuaDipilih = ditapis.every((p) => next.has(p.id));
      if (semuaDipilih) ditapis.forEach((p) => next.delete(p.id));
      else ditapis.forEach((p) => next.add(p.id));
      return next;
    });
  }

  async function submit() {
    setMesej(null);
    if (namaAktiviti.trim().length < 2) {
      setMesej({ ok: false, teks: "Masukkan nama pertandingan." });
      return;
    }
    if (dipilih.size === 0) {
      setMesej({ ok: false, teks: "Pilih sekurang-kurangnya seorang pelajar." });
      return;
    }
    setHantar(true);
    try {
      const res = await fetch("/api/guru/pemilihan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaAktiviti: namaAktiviti.trim(),
          peringkat,
          tarikh: tarikh || undefined,
          pelajarIds: [...dipilih],
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMesej({ ok: false, teks: json.message ?? "Ralat memproses." });
      } else {
        setMesej({ ok: true, teks: json.message });
        setDipilih(new Set());
        setNamaAktiviti("");
        setTarikh("");
        router.refresh();
      }
    } catch {
      setMesej({ ok: false, teks: "Ralat rangkaian." });
    } finally {
      setHantar(false);
    }
  }

  const semuaDitapisDipilih = ditapis.length > 0 && ditapis.every((p) => dipilih.has(p.id));

  return (
    <div className="space-y-5">
      {/* Butiran pertandingan */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">Butiran Pertandingan</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="sm:col-span-1 block">
            <span className="text-xs font-medium text-slate-500">Nama Pertandingan / Sukan</span>
            <input
              value={namaAktiviti}
              onChange={(e) => setNamaAktiviti(e.target.value)}
              placeholder="cth: Kejohanan Bola Tampar MSSD"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Peringkat</span>
            <select
              value={peringkat}
              onChange={(e) => setPeringkat(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {PERINGKAT_PERTANDINGAN.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Tarikh (pilihan)</span>
            <input
              type="date"
              value={tarikh}
              onChange={(e) => setTarikh(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      {/* Senarai pelajar */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
            Pilih Pelajar <span className="text-slate-400">({dipilih.size} dipilih)</span>
          </h2>
          <input
            value={carian}
            onChange={(e) => setCarian(e.target.value)}
            placeholder="Cari nama / kelas / sukan…"
            className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <input type="checkbox" checked={semuaDitapisDipilih} onChange={pilihSemua} className="h-4 w-4" />
            <span className="font-semibold text-slate-600">Pilih semua ({ditapis.length})</span>
          </div>
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {ditapis.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50">
                  <input type="checkbox" checked={dipilih.has(p.id)} onChange={() => toggle(p.id)} className="h-4 w-4" />
                  <span className="font-medium text-slate-700">{p.nama}</span>
                  <span className="text-xs text-slate-400">{p.kelasT6 ?? "-"}</span>
                  {p.sukan && <span className="ml-auto text-xs text-slate-500">{p.sukan}</span>}
                </label>
              </li>
            ))}
            {ditapis.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-slate-400">Tiada pelajar sepadan.</li>
            )}
          </ul>
        </div>
      </section>

      {mesej && (
        <p className={`rounded-md px-4 py-2 text-sm ${mesej.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {mesej.teks}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={hantar}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {hantar ? "Memproses…" : `Pilih ${dipilih.size || ""} Pelajar`}
        </button>
        <span className="text-xs text-slate-400">
          Penyertaan akan berstatus “Menunggu Pengesahan”. Markah peringkat diberi selepas sijil disahkan.
        </span>
      </div>
    </div>
  );
}
