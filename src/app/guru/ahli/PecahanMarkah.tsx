"use client";
import { useEffect, useState } from "react";

interface Bidang {
  jenisKoko: string;
  namaUnit: string;
  dikira: boolean;
  ekstra: number | null;
  jumlah: number | null;
  kehadiran: number;
  jawatan: number;
  penglibatan: number;
  pencapaian: number;
  projekJawatan: number;
  projekPeringkat: number;
}
interface Data {
  keseluruhan: number | null;
  gred: string | null;
  markah: { kunci: string; nilai: number; maks: number }[];
  bidang: Bidang[];
}

const LAJUR: { k: keyof Bidang; ms: string; en: string; maks: number }[] = [
  { k: "kehadiran", ms: "Kehadiran", en: "Attendance", maks: 50 },
  { k: "jawatan", ms: "Jawatan", en: "Position", maks: 10 },
  { k: "penglibatan", ms: "Penglibatan", en: "Involvement", maks: 10 },
  { k: "pencapaian", ms: "Pencapaian", en: "Achievement", maks: 10 },
  { k: "projekJawatan", ms: "Projek (jawatan)", en: "Project (role)", maks: 10 },
  { k: "projekPeringkat", ms: "Projek (peringkat)", en: "Project (level)", maks: 10 },
];

/** Pecahan markah PAJSK T6 seorang pelajar — dimuat apabila dibuka. */
export function PecahanMarkah({ pelajarId, unitAktif, en }: { pelajarId: string; unitAktif: string; en: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [ralat, setRalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    fetch(`/api/pelajar/${pelajarId}/pecahan-markah`)
      .then((r) => r.json())
      .then((j) => {
        if (batal) return;
        if (j?.success) setData(j.data);
        else setRalat(j?.message ?? "Ralat");
      })
      .catch(() => !batal && setRalat(en ? "Network error." : "Ralat rangkaian."));
    return () => { batal = true; };
  }, [pelajarId, en]);

  if (ralat) return <p className="text-xs text-rose-600">{ralat}</p>;
  if (!data) return <p className="text-xs text-slate-400">{en ? "Loading…" : "Memuatkan…"}</p>;

  const bidang = data.bidang.filter((b) => b.jenisKoko !== "Perkhidmatan");
  const up = data.bidang.find((b) => b.jenisKoko === "Perkhidmatan");
  const ekstra = data.markah.find((m) => m.kunci === "ekstra")?.nilai ?? 0;
  const th = "px-2 py-1 font-semibold";
  const td = "px-2 py-1 text-right tabular-nums";

  return (
    <div className="space-y-2">
      {bidang.length === 0 ? (
        <p className="text-xs text-slate-500">{en ? "No Sports/Club/Uniform unit yet." : "Belum ada unit Sukan/Kelab/Uniform."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className={th}>Unit</th>
                {LAJUR.map((l) => <th key={l.k} className={`${th} text-right`}>{en ? l.en : l.ms} <span className="font-normal">/{l.maks}</span></th>)}
                <th className={`${th} text-right`}>{en ? "Total" : "Jumlah"} <span className="font-normal">/100</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bidang.map((b) => (
                <tr key={b.jenisKoko} className={b.namaUnit === unitAktif ? "bg-amber-50" : ""}>
                  <td className="px-2 py-1 text-slate-700">
                    {b.namaUnit} <span className="text-slate-400">· {b.jenisKoko}</span>
                    {b.dikira && <span className="ml-1 rounded bg-emerald-100 px-1 text-[10px] font-semibold text-emerald-700">{en ? "counted" : "dikira"}</span>}
                  </td>
                  {LAJUR.map((l) => <td key={l.k} className={td}>{b[l.k] as number}</td>)}
                  <td className={`${td} font-semibold text-slate-800`}>{b.jumlah ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-slate-600">
        {en ? "Overall (average of 2 best units)" : "Keseluruhan (purata 2 bidang terbaik)"}:{" "}
        <span className="font-semibold text-slate-800">{data.keseluruhan ?? "-"}/100{data.gred ? ` (${data.gred})` : ""}</span>
        {" · "}{en ? "Extra-curricular bonus" : "Bonus Ekstra Kurikulum"}: <span className="font-semibold">{ekstra}/10</span>
        {up ? ` (${up.namaUnit})` : ""}
      </p>
    </div>
  );
}
