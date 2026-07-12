"use client";
import { useState } from "react";
import QRCode from "qrcode";

interface Ahli {
  id: string;
  nama: string;
  kelasT6: string | null;
}
interface Unit {
  jenisKoko: string;
  namaUnit: string;
  ahli: Ahli[];
}

export function KehadiranPanel({ units }: { units: Unit[] }) {
  const [unitIdx, setUnitIdx] = useState(0);
  const [bil, setBil] = useState(1);
  const [tarikh, setTarikh] = useState("");
  const [sesi, setSesi] = useState<{ id: string; token: string } | null>(null);
  const [hadir, setHadir] = useState<Record<string, boolean>>({});
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const unit = units[unitIdx];

  if (units.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
        Tiada unit dengan ahli ditemui untuk akaun anda.
      </div>
    );
  }

  async function bukaSesi() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/kehadiran/sesi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenisKoko: unit.jenisKoko,
          namaUnit: unit.namaUnit,
          tarikh: tarikh || new Date().toISOString(),
          bilPerjumpaan: bil,
        }),
      });
      const json = await res.json();
      if (!json.success) { setMsg({ text: json.message, ok: false }); return; }
      setSesi({ id: json.data.id, token: json.data.token });
      const url = `${window.location.origin}/pelajar/scan?token=${json.data.token}`;
      setQr(await QRCode.toDataURL(url, { width: 220, margin: 1 }));
      setMsg({ text: "Sesi dibuka. Tanda kehadiran atau paparkan QR.", ok: true });
    } finally {
      setBusy(false);
    }
  }

  async function simpan() {
    if (!sesi) return;
    setBusy(true);
    setMsg(null);
    try {
      const tanda = unit.ahli.map((a) => ({ pelajarId: a.id, hadir: !!hadir[a.id] }));
      const res = await fetch("/api/kehadiran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesiId: sesi.id, tanda }),
      });
      const json = await res.json();
      setMsg({ text: json.message, ok: json.success });
    } finally {
      setBusy(false);
    }
  }

  const bilHadir = Object.values(hadir).filter(Boolean).length;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">Buka Sesi Perjumpaan</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Unit</span>
              <select
                value={unitIdx}
                onChange={(e) => { setUnitIdx(Number(e.target.value)); setSesi(null); setQr(null); }}
                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
              >
                {units.map((u, i) => (
                  <option key={i} value={i}>{u.jenisKoko}: {u.namaUnit}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Perjumpaan #</span>
              <input type="number" min={1} max={40} value={bil} onChange={(e) => setBil(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Tarikh</span>
              <input type="date" value={tarikh} onChange={(e) => setTarikh(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            </label>
          </div>
          <button onClick={bukaSesi} disabled={busy}
            className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
            {busy ? "..." : "Buka Sesi"}
          </button>
        </section>

        {msg && (
          <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-brand-light text-brand-dark ring-1 ring-brand/30" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
            {msg.text}
          </div>
        )}

        {sesi && (
          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
                Senarai Ahli ({bilHadir}/{unit.ahli.length} hadir)
              </h2>
              <button onClick={simpan} disabled={busy}
                className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
                Simpan Kehadiran
              </button>
            </div>
            <div className="space-y-1">
              {unit.ahli.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50">
                  <input type="checkbox" checked={!!hadir[a.id]}
                    onChange={(e) => setHadir((h) => ({ ...h, [a.id]: e.target.checked }))}
                    className="h-4 w-4 accent-brand" />
                  <span className="text-slate-700">{a.nama}</span>
                  <span className="ml-auto text-xs text-slate-400">{a.kelasT6}</span>
                </label>
              ))}
            </div>
          </section>
        )}
      </div>

      <div>
        {qr ? (
          <section className="rounded-xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">Imbas QR Kehadiran</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR Kehadiran" className="mx-auto" width={220} height={220} />
            <p className="mt-2 text-xs text-slate-500">Ahli imbas kod ini (perlu log masuk) untuk menanda hadir sendiri.</p>
          </section>
        ) : (
          <section className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-400 ring-1 ring-slate-200">
            Buka sesi untuk menjana kod QR kehadiran.
          </section>
        )}
      </div>
    </div>
  );
}
