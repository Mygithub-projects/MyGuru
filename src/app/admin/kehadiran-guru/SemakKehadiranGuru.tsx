"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Row {
  id: string;
  guru: string;
  namaUnit: string;
  kod: string;
  bil: number;
  tarikh: string;
  statusHadir: boolean;
  catatan: string | null;
  statusSemakan: string;
  komenAdmin: string | null;
}
interface Dict {
  colTeacher: string; colUnit: string; colMeeting: string; colDate: string; colMyStatus: string;
  colNote: string; colReview: string; colAction: string; present: string; absent: string;
  approve: string; reject: string; approveSelected: string; rejectPrompt: string; networkError: string;
  stPending: string; stApproved: string; stRejected: string;
}

function fmtTarikh(iso: string) {
  return new Intl.DateTimeFormat("ms-MY", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(iso));
}

export function SemakKehadiranGuru({ rows, t }: { rows: Row[]; t: Dict }) {
  const router = useRouter();
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);

  const pending = rows.filter((r) => r.statusSemakan === "Pending");

  async function hantar(ids: string[], status: "Approved" | "Rejected") {
    let komen: string | undefined;
    if (status === "Rejected") {
      const k = prompt(t.rejectPrompt);
      if (k === null || !k.trim()) return;
      komen = k;
    }
    setBusy(true);
    setRalat(null);
    try {
      const res = await fetch("/api/admin/kehadiran-guru", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status, komen }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) setRalat(json?.message ?? t.networkError);
      else {
        setDipilih(new Set());
        router.refresh();
      }
    } catch {
      setRalat(t.networkError);
    } finally {
      setBusy(false);
    }
  }

  function togol(id: string) {
    setDipilih((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const label: Record<string, [string, string]> = {
    Pending: [t.stPending, "bg-amber-100 text-amber-700"],
    Approved: [t.stApproved, "bg-green-100 text-green-700"],
    Rejected: [t.stRejected, "bg-red-100 text-red-700"],
  };

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={busy || dipilih.size === 0}
            onClick={() => hantar([...dipilih], "Approved")}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {t.approveSelected} ({dipilih.size})
          </button>
          {ralat && <span className="text-xs text-rose-600">{ralat}</span>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <th className="py-2 pr-2">
                {pending.length > 0 && (
                  <input
                    type="checkbox"
                    aria-label="all"
                    checked={dipilih.size === pending.length}
                    onChange={(e) => setDipilih(e.target.checked ? new Set(pending.map((r) => r.id)) : new Set())}
                  />
                )}
              </th>
              <th className="py-2 pr-3">{t.colTeacher}</th>
              <th className="py-2 pr-3">{t.colUnit}</th>
              <th className="py-2 pr-3">{t.colMeeting}</th>
              <th className="py-2 pr-3">{t.colDate}</th>
              <th className="py-2 pr-3">{t.colMyStatus}</th>
              <th className="py-2 pr-3">{t.colNote}</th>
              <th className="py-2 pr-3">{t.colReview}</th>
              <th className="py-2">{t.colAction}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const [lbl, kelas] = label[r.statusSemakan] ?? [r.statusSemakan, "bg-slate-100 text-slate-600"];
              return (
                <tr key={r.id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="py-2 pr-2">
                    {r.statusSemakan === "Pending" && (
                      <input type="checkbox" aria-label={r.guru} checked={dipilih.has(r.id)} onChange={() => togol(r.id)} />
                    )}
                  </td>
                  <td className="py-2 pr-3 font-medium text-slate-700">{r.guru}</td>
                  <td className="py-2 pr-3 text-slate-600">
                    <span className="mr-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">{r.kod}</span>
                    {r.namaUnit}
                  </td>
                  <td className="py-2 pr-3 text-slate-600">#{r.bil}</td>
                  <td className="whitespace-nowrap py-2 pr-3 text-slate-600">{fmtTarikh(r.tarikh)}</td>
                  <td className="py-2 pr-3">
                    <span className={`text-xs font-semibold ${r.statusHadir ? "text-green-700" : "text-red-700"}`}>
                      {r.statusHadir ? t.present : t.absent}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-xs text-slate-500">{r.catatan ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${kelas}`}>{lbl}</span>
                    {r.komenAdmin && <span className="mt-1 block text-xs text-slate-500">{r.komenAdmin}</span>}
                  </td>
                  <td className="py-2">
                    <span className="flex gap-1.5">
                      {r.statusSemakan !== "Approved" && (
                        <button
                          disabled={busy}
                          onClick={() => hantar([r.id], "Approved")}
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {t.approve}
                        </button>
                      )}
                      {r.statusSemakan !== "Rejected" && (
                        <button
                          disabled={busy}
                          onClick={() => hantar([r.id], "Rejected")}
                          className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                          {t.reject}
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
