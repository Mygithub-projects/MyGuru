"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface PendingData {
  skop: string;
  jumlah: number;
  ringkasan: Record<string, number>;
}

const LABEL: Record<string, string> = {
  pencapaian: "Pencapaian",
  aktivitiLuar: "Aktiviti Luar",
  pertukaran: "Pertukaran Unit",
  laporanMingguan: "Laporan Mingguan",
  laporanProjek: "Laporan Projek",
  sesiKehadiran: "Sesi Kehadiran",
  cadanganJawatan: "Cadangan Jawatan",
};

// Widget langsung: tinjau /api/guru/pending pada selang masa & segar semula
// kandungan dirender pelayan (ReviewPanel + kad) apabila jumlah berubah.
export function LivePending({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [data, setData] = useState<PendingData | null>(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [auto, setAuto] = useState(true);
  const lastJumlah = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/guru/pending", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
        setUpdatedAt(new Date().toLocaleTimeString("ms-MY"));
        // Jika jumlah berubah (kelulusan baharu / item baharu), segar UI pelayan.
        if (lastJumlah.current !== null && lastJumlah.current !== json.data.jumlah) {
          router.refresh();
        }
        lastJumlah.current = json.data.jumlah;
      }
    } catch {
      /* senyap — cuba lagi pada selang seterusnya */
    }
  }, [router]);

  // Muat awal (ditangguh supaya tiada setState segerak dalam efek) +
  // tinjau berkala apabila auto dihidupkan.
  useEffect(() => {
    const kick = setTimeout(() => void load(), 0);
    const tick = auto ? setInterval(() => void load(), intervalMs) : undefined;
    return () => {
      clearTimeout(kick);
      if (tick) clearInterval(tick);
    };
  }, [auto, intervalMs, load]);

  const entries = data ? Object.entries(data.ringkasan).filter(([, n]) => n > 0) : [];

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-600">
          <span className="relative flex h-2.5 w-2.5">
            {auto && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${auto ? "bg-emerald-500" : "bg-slate-300"}`} />
          </span>
          Menunggu Tindakan (Langsung)
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {updatedAt && <span>Dikemas kini: {updatedAt}</span>}
          <button
            onClick={() => setAuto((a) => !a)}
            className={`rounded-md px-2 py-1 font-semibold ${auto ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
          >
            {auto ? "Auto: ON" : "Auto: OFF"}
          </button>
          <button
            onClick={load}
            className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-600 hover:bg-slate-200"
          >
            ↻
          </button>
        </div>
      </div>

      {data === null ? (
        <p className="text-sm text-slate-400">Memuatkan…</p>
      ) : data.jumlah === 0 ? (
        <p className="text-sm text-emerald-600">✓ Tiada item menunggu tindakan.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
            {data.jumlah} jumlah
          </span>
          {entries.map(([k, n]) => (
            <span key={k} className="rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-600">
              {LABEL[k] ?? k}: <strong className="text-slate-800">{n}</strong>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
