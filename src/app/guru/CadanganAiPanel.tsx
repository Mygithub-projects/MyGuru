"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface CadanganRow {
  id: string;
  jenis: string; // UNIT_TRANSFER | ACHIEVEMENT | RECALC | ECERT
  keputusan: string | null;
  justifikasi: string;
  dicipta: string;
  pelajarNama: string | null;
  rujukanLabel: string;
}

const JENIS_TONE: Record<string, string> = {
  UNIT_TRANSFER: "bg-blue-100 text-blue-700",
  ACHIEVEMENT: "bg-emerald-100 text-emerald-700",
  RECALC: "bg-amber-100 text-amber-700",
  ECERT: "bg-violet-100 text-violet-700",
};

interface CadanganAiDict {
  title: string; pendingCountTpl: string; sortNewest: string; sortOldest: string; sortAriaLabel: string;
  descPrefix: string; descBold: string; descSuffix: string; emptyState: string; suggestedLabel: string;
  approveBtn: string; rejectBtn: string; rejectPrompt: string; networkError: string;
  jenis: { unitTransfer: string; achievement: string; recalc: string; ecert: string };
}

export function CadanganAiPanel({ cadangan, t }: { cadangan: CadanganRow[]; t: CadanganAiDict }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [arah, setArah] = useState<"baru" | "lama">("baru");
  const JENIS_LABEL: Record<string, string> = {
    UNIT_TRANSFER: t.jenis.unitTransfer,
    ACHIEVEMENT: t.jenis.achievement,
    RECALC: t.jenis.recalc,
    ECERT: t.jenis.ecert,
  };

  // §4: susun ikut tarikh cipta — terkini dahulu (default) atau terlama dahulu.
  const senarai = [...cadangan].sort((a, b) =>
    arah === "baru" ? b.dicipta.localeCompare(a.dicipta) : a.dicipta.localeCompare(b.dicipta)
  );

  async function act(id: string, tindakan: "Approve" | "Reject", komen?: string) {
    setBusy(`${id}-${tindakan}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/agent/cadangan/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tindakan, komen }),
      });
      const json = await res.json();
      setMsg({ text: json.message, ok: json.success });
      if (json.success) router.refresh();
    } catch {
      setMsg({ text: t.networkError, ok: false });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
            {t.title}
          </h2>
          {cadangan.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {t.pendingCountTpl.replace("{n}", String(cadangan.length))}
            </span>
          )}
        </div>
        {cadangan.length > 1 && (
          <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label={t.sortAriaLabel}>
            <button type="button" onClick={() => setArah("baru")} aria-pressed={arah === "baru"}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${arah === "baru" ? "bg-white text-brand-dark shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.sortNewest}
            </button>
            <button type="button" onClick={() => setArah("lama")} aria-pressed={arah === "lama"}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${arah === "lama" ? "bg-white text-brand-dark shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.sortOldest}
            </button>
          </div>
        )}
      </div>

      <p className="mb-3 text-xs text-slate-500">
        {t.descPrefix} <strong>{t.descBold}</strong> {t.descSuffix}
      </p>

      {msg && (
        <div
          className={`mb-3 rounded-md px-3 py-2 text-sm ${
            msg.ok
              ? "bg-brand-light text-brand-dark ring-1 ring-brand/30"
              : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      {cadangan.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
          {t.emptyState}
        </div>
      ) : (
        <div className="space-y-2">
          {senarai.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      JENIS_TONE[c.jenis] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {JENIS_LABEL[c.jenis] ?? c.jenis}
                  </span>
                  {c.keputusan && (
                    <span className="text-xs font-semibold text-slate-500">
                      {t.suggestedLabel} {c.keputusan}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-800">{c.rujukanLabel}</p>
                <p className="text-xs text-slate-500">
                  {c.pelajarNama ? `${c.pelajarNama} · ` : ""}
                  {c.justifikasi}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => act(c.id, "Approve")}
                  disabled={busy !== null}
                  className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === `${c.id}-Approve` ? "..." : t.approveBtn}
                </button>
                <button
                  onClick={() => {
                    const komen = prompt(t.rejectPrompt) ?? undefined;
                    act(c.id, "Reject", komen);
                  }}
                  disabled={busy !== null}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === `${c.id}-Reject` ? "..." : t.rejectBtn}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
