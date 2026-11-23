"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { markahPeserta } from "@/lib/aktiviti-unit-markah";
import { urlFail } from "@/lib/fail-url";

export interface AktivitiUnitRow {
  id: string;
  namaAktiviti: string;
  namaUnit: string;
  peringkat: string;
  tarikh: string | null;
  laporan: string | null;
  lampiranEviden: string | null;
  setiausaha: string;
  peserta: { id: string; nama: string; kelas: string | null; kedudukan: string }[];
}

const TEKS = {
  ms: {
    tajuk: "Aktiviti Unit (SU/NSU) menunggu pengesahan",
    oleh: "oleh", peserta: "peserta", kolej: "Kolej", eviden: "Lihat eviden",
    pglb: "Penglibatan", pcp: "Pencapaian", sahkan: "Sahkan & kira markah", kuiri: "Kuiri",
    komen: "Komen (wajib untuk kuiri)", rangkaian: "Ralat rangkaian",
    ked: { Penyertaan: "Penyertaan", Johan: "Johan", "Naib Johan": "Naib Johan", Ketiga: "Ketiga" } as Record<string, string>,
  },
  en: {
    tajuk: "Unit activities (SU/NSU) awaiting confirmation",
    oleh: "by", peserta: "participants", kolej: "College", eviden: "View evidence",
    pglb: "Involvement", pcp: "Achievement", sahkan: "Confirm & compute marks", kuiri: "Query",
    komen: "Comment (required for a query)", rangkaian: "Network error",
    ked: { Penyertaan: "Participation", Johan: "Champion", "Naib Johan": "Runner-up", Ketiga: "Third" } as Record<string, string>,
  },
};

/** Ketua GP / Penolong Ketua GP unit SU: sahkan aktiviti → markah semua peserta dikira. */
export function AktivitiUnitSemakan({ rows }: { rows: AktivitiUnitRow[] }) {
  const t = TEKS[useLocale() === "en" ? "en" : "ms"];
  if (rows.length === 0) return null;
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
        {t.tajuk} ({rows.length})
      </h2>
      <div className="space-y-3">
        {rows.map((r) => <Kad key={r.id} r={r} t={t} />)}
      </div>
    </section>
  );
}

function Kad({ r, t }: { r: AktivitiUnitRow; t: (typeof TEKS)["ms"] }) {
  const router = useRouter();
  const [komen, setKomen] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function hantar(status: "Approved" | "Kuiri") {
    if (status === "Kuiri" && !komen.trim()) return setMsg({ text: t.komen, ok: false });
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/aktiviti-unit/${r.id}/sahkan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, komen: komen.trim() || undefined }),
      });
      const json = (await res.json().catch(() => null)) as { success: boolean; message: string } | null;
      setMsg({ text: json?.message ?? t.rangkaian, ok: !!json?.success });
      if (json?.success) router.refresh();
    } catch {
      setMsg({ text: t.rangkaian, ok: false });
    } finally {
      setBusy(false);
    }
  }

  const peringkat = r.peringkat === "Sekolah" ? t.kolej : r.peringkat;
  return (
    <div className="rounded-lg border border-slate-100 p-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold text-slate-700">{r.namaAktiviti}</span>
        <span className="text-xs text-slate-400">
          {r.namaUnit} · {peringkat}{r.tarikh ? ` · ${new Date(r.tarikh).toLocaleDateString("ms-MY")}` : ""} · {t.oleh} {r.setiausaha}
        </span>
      </div>
      {r.laporan && <p className="mt-1 line-clamp-3 text-xs text-slate-500">{r.laporan}</p>}
      {r.lampiranEviden && (
        <a href={urlFail(r.lampiranEviden) ?? r.lampiranEviden} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-brand-dark hover:underline">
          {t.eviden}
        </a>
      )}
      <ul className="mt-2 divide-y divide-slate-100 rounded-md ring-1 ring-slate-200">
        {r.peserta.map((p) => {
          const m = markahPeserta(r.peringkat, p.kedudukan);
          return (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-1 text-xs">
              <span className="text-slate-700">{p.nama} <span className="text-slate-400">({p.kelas ?? "-"})</span></span>
              <span className="text-slate-500">
                {t.ked[p.kedudukan] ?? p.kedudukan} · {t.pglb} {m.penglibatan} · {t.pcp} {m.pencapaian}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={komen}
          onChange={(e) => setKomen(e.target.value)}
          maxLength={500}
          placeholder={t.komen}
          className="min-w-[12rem] flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
        />
        <button disabled={busy} onClick={() => hantar("Approved")} className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
          {t.sahkan}
        </button>
        <button disabled={busy} onClick={() => hantar("Kuiri")} className="rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-200 disabled:opacity-50">
          {t.kuiri}
        </button>
        {msg && <span className={`text-xs ${msg.ok ? "text-brand-dark" : "text-red-600"}`}>{msg.text}</span>}
      </div>
      <p className="mt-1 text-[11px] text-slate-400">{r.peserta.length} {t.peserta}</p>
    </div>
  );
}
