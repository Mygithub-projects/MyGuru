"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface PautanEviden { url: string; label: string }

// Semakan satu laporan SU/NSU yang menunggu (guru atau admin):
// 1. Guru mesti buka setiap eviden dahulu — butang Sahkan dikunci sehingga semua dibuka.
// 2. Jika eviden/laporan salah → Kuiri dengan sebab (wajib); laporan dihantar balik
//    kepada SU/NSU untuk dibetulkan dan dihantar semula.
export function LaporanSemakanAksi({
  jenis,
  id,
  eviden,
  t,
}: {
  jenis: "mingguan" | "projek";
  id: string;
  eviden: PautanEviden[];
  t: {
    approve: string; queryBtn: string; networkError: string;
    openEvidenceFirst: string; evidenceChecked: string; queryReasonLabel: string;
    queryReasonPlaceholder: string; queryReasonRequired: string; sendQuery: string; cancel: string;
  };
}) {
  const router = useRouter();
  const [dibuka, setDibuka] = useState<Set<string>>(new Set());
  const [kuiri, setKuiri] = useState(false);
  const [sebab, setSebab] = useState("");
  const [busy, setBusy] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);

  const semuaDibuka = eviden.every((e) => dibuka.has(e.url));
  const baki = eviden.length - eviden.filter((e) => dibuka.has(e.url)).length;

  async function hantar(status: "Approved" | "Kuiri") {
    const komen = sebab.trim();
    if (status === "Kuiri" && !komen) { setRalat(t.queryReasonRequired); return; }
    setBusy(true);
    setRalat(null);
    try {
      const res = await fetch(`/api/laporan/${jenis}/${id}/sahkan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(status === "Kuiri" ? { status, komen } : { status }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) setRalat(json?.message ?? t.networkError);
      else router.refresh();
    } catch {
      setRalat(t.networkError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-1 w-full space-y-2">
      {eviden.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {eviden.map((e) => {
            const ok = dibuka.has(e.url);
            return (
              <a
                key={e.url}
                href={e.url}
                target="_blank"
                rel="noopener"
                onClick={() => setDibuka((s) => new Set(s).add(e.url))}
                className={`rounded-md px-2 py-1 font-semibold ring-1 ${ok ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-amber-300 hover:bg-amber-100"}`}
              >
                {ok ? "✓" : "📎"} {e.label}
              </a>
            );
          })}
          <span className={semuaDibuka ? "text-emerald-700" : "text-amber-700"}>
            {semuaDibuka ? t.evidenceChecked : t.openEvidenceFirst.replace("{n}", String(baki))}
          </span>
        </div>
      )}

      {kuiri ? (
        <div className="space-y-2 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
          <label className="block font-semibold text-amber-800">
            {t.queryReasonLabel}
            <textarea
              value={sebab}
              onChange={(e) => setSebab(e.target.value)}
              maxLength={500}
              rows={3}
              autoFocus
              placeholder={t.queryReasonPlaceholder}
              className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-2 py-1.5 text-sm font-normal text-slate-800"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy || !sebab.trim()}
              onClick={() => hantar("Kuiri")}
              className="rounded-md bg-amber-500 px-3 py-1 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {t.sendQuery}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => { setKuiri(false); setRalat(null); }}
              className="rounded-md bg-white px-3 py-1 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            {ralat && <span className="text-rose-600">{ralat}</span>}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy || !semuaDibuka}
            title={semuaDibuka ? undefined : t.openEvidenceFirst.replace("{n}", String(baki))}
            onClick={() => hantar("Approved")}
            className="rounded-md bg-emerald-600 px-3 py-1 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {semuaDibuka ? "" : "🔒 "}{t.approve}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => { setKuiri(true); setRalat(null); }}
            className="rounded-md bg-amber-500 px-3 py-1 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {t.queryBtn}
          </button>
          {ralat && <span className="text-rose-600">{ralat}</span>}
        </div>
      )}
    </div>
  );
}
