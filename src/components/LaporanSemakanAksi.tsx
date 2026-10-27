"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Butang Sahkan / Kuiri untuk satu laporan SU/NSU (guru atau admin).
export function LaporanSemakanAksi({
  jenis,
  id,
  t,
}: {
  jenis: "mingguan" | "projek";
  id: string;
  t: { approve: string; queryBtn: string; queryPrompt: string; networkError: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);

  async function hantar(status: "Approved" | "Kuiri") {
    let komen: string | undefined;
    if (status === "Kuiri") {
      const k = prompt(t.queryPrompt);
      if (k === null) return;
      komen = k || undefined;
    }
    setBusy(true);
    setRalat(null);
    try {
      const res = await fetch(`/api/laporan/${jenis}/${id}/sahkan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, komen }),
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
    <span className="ml-auto flex items-center gap-2">
      {ralat && <span className="text-rose-600">{ralat}</span>}
      <button
        disabled={busy}
        onClick={() => hantar("Approved")}
        className="rounded-md bg-emerald-600 px-3 py-1 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {t.approve}
      </button>
      <button
        disabled={busy}
        onClick={() => hantar("Kuiri")}
        className="rounded-md bg-amber-500 px-3 py-1 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {t.queryBtn}
      </button>
    </span>
  );
}
