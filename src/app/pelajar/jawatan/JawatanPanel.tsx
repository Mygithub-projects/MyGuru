"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const JAWATAN = [
  "Pengerusi", "Naib Pengerusi", "Ketua Pasukan", "Setiausaha", "Kapten",
  "Naib Setiausaha", "Bendahari", "Ahli Jawatankuasa", "Koperal", "Ahli Aktif",
];

interface Member {
  pelajarId: string;
  nama: string;
  kelas: string | null;
  jenisKoko: string;
  namaUnit: string;
  jawatanT6: string;
  pending: string | null;
}

export function JawatanPanel({ members }: { members: Member[] }) {
  const router = useRouter();
  const [pilih, setPilih] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Kumpulkan ikut unit
  const byUnit = members.reduce<Record<string, Member[]>>((acc, m) => {
    (acc[m.namaUnit] ??= []).push(m);
    return acc;
  }, {});

  async function cadang(m: Member) {
    const key = `${m.pelajarId}:${m.jenisKoko}`;
    const jawatanBaru = pilih[key];
    if (!jawatanBaru) { setMsg({ text: "Pilih jawatan dahulu", ok: false }); return; }
    setBusy(key);
    setMsg(null);
    try {
      const res = await fetch("/api/jawatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pelajarId: m.pelajarId, jenisKoko: m.jenisKoko, jawatanBaru }),
      });
      const json = await res.json();
      setMsg({ text: json.message, ok: json.success });
      if (json.success) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (members.length === 0) {
    return <div className="rounded-xl bg-white p-6 text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">Tiada ahli unit ditemui.</div>;
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
          {msg.text}
        </div>
      )}
      {Object.entries(byUnit).map(([unit, list]) => (
        <section key={unit} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{unit}</h2>
          <div className="space-y-2">
            {list.map((m) => {
              const key = `${m.pelajarId}:${m.jenisKoko}`;
              return (
                <div key={key} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{m.nama}</p>
                    <p className="text-xs text-slate-500">
                      {m.jenisKoko} · Jawatan semasa: <strong>{m.jawatanT6}</strong>
                      {m.pending && <span className="ml-1 text-amber-600">· Cadangan menunggu: {m.pending}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={pilih[key] ?? ""}
                      onChange={(e) => setPilih((p) => ({ ...p, [key]: e.target.value }))}
                      disabled={!!m.pending}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm disabled:opacity-50"
                    >
                      <option value="">— Pilih jawatan —</option>
                      {JAWATAN.map((j) => <option key={j} value={j}>{j}</option>)}
                    </select>
                    <button
                      onClick={() => cadang(m)}
                      disabled={busy === key || !!m.pending}
                      className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {busy === key ? "..." : m.pending ? "Menunggu" : "Cadang"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
