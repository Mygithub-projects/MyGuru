"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Butang "Tulis komen" + kotak teks untuk guru/admin — boleh sebelum atau
// selepas laporan disahkan. Komen dipapar pada PDF laporan.
export function LaporanKomenGuru({
  jenis,
  id,
  komen,
  t,
}: {
  jenis: "mingguan" | "projek";
  id: string;
  komen: string | null;
  t: { commentBtn: string; editCommentBtn: string; commentPlaceholder: string; save: string; cancel: string; networkError: string };
}) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [teks, setTeks] = useState(komen ?? "");
  const [busy, setBusy] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);

  async function simpan() {
    setBusy(true);
    setRalat(null);
    try {
      const res = await fetch(`/api/laporan/${jenis}/${id}/komen`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ komen: teks }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) setRalat(json?.message ?? t.networkError);
      else {
        setBuka(false);
        router.refresh();
      }
    } catch {
      setRalat(t.networkError);
    } finally {
      setBusy(false);
    }
  }

  if (!buka) {
    return (
      <button
        type="button"
        onClick={() => { setTeks(komen ?? ""); setBuka(true); }}
        className="rounded-md bg-sky-600 px-3 py-1 font-semibold text-white hover:bg-sky-700"
      >
        💬 {komen ? t.editCommentBtn : t.commentBtn}
      </button>
    );
  }

  return (
    <div className="mt-2 w-full space-y-2">
      <textarea
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
        maxLength={500}
        rows={3}
        autoFocus
        placeholder={t.commentPlaceholder}
        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={simpan}
          className="rounded-md bg-sky-600 px-3 py-1 font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {t.save}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => { setBuka(false); setRalat(null); }}
          className="rounded-md bg-slate-100 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-200"
        >
          {t.cancel}
        </button>
        <span className="text-slate-400">{teks.length}/500</span>
        {ralat && <span className="text-rose-600">{ralat}</span>}
      </div>
    </div>
  );
}
