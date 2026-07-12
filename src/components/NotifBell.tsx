"use client";
import { useEffect, useState } from "react";

interface Notif { id: string; tajuk: string; mesej: string; jenis: string; dibaca: boolean; createdAt: string; }

export function NotifBell() {
  const [open, setOpen] = useState(false);
  const [senarai, setSenarai] = useState<Notif[]>([]);
  const [belum, setBelum] = useState(0);

  useEffect(() => {
    // setState berlaku dalam callback .then (async) — bukan segerak dalam effect.
    const muat = () =>
      fetch("/api/notifikasi")
        .then((r) => r.json())
        .then((j) => {
          if (j.success) {
            setSenarai(j.data.senarai);
            setBelum(j.data.belumDibaca);
          }
        })
        .catch(() => {});
    muat();
    const t = setInterval(muat, 30000);
    return () => clearInterval(t);
  }, []);

  async function buka() {
    setOpen((o) => !o);
    if (!open && belum > 0) {
      await fetch("/api/notifikasi", { method: "PATCH" });
      setBelum(0);
    }
  }

  return (
    <div className="relative">
      <button onClick={buka} className="relative rounded-md bg-white/15 px-2.5 py-1.5 text-sm hover:bg-white/25" aria-label="Notifikasi">
        🔔
        {belum > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {belum}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[85vw] rounded-xl bg-white p-2 text-slate-800 shadow-xl ring-1 ring-slate-200">
          <p className="px-2 py-1 text-xs font-bold uppercase text-slate-400">Notifikasi</p>
          <div className="max-h-80 overflow-y-auto">
            {senarai.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-slate-400">Tiada notifikasi.</p>
            ) : (
              senarai.map((n) => (
                <div key={n.id} className={`rounded-lg px-2 py-2 text-sm ${n.dibaca ? "" : "bg-brand-light"}`}>
                  <p className="font-semibold text-slate-700">{n.tajuk}</p>
                  <p className="text-xs text-slate-500">{n.mesej}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleString("ms-MY")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
