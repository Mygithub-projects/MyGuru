import { SalinTeks } from "./SalinTeks";

export interface UnitHarian { nama: string; bil: number; hadir: number; total: number; peratus: number }
export interface BahagianHarian {
  jenis: string;
  kod: string; // "K/P"
  label: string; // "KP — Kelab/Persatuan"
  warna: string;
  unit: UnitHarian[];
  hadir: number;
  total: number;
  peratus: number; // 2 titik perpuluhan
  teks: string; // teks WhatsApp bahagian ini
}

interface Label {
  dailyCopy: string; dailyCopyAll: string; dailyCopied: string; dailyTotal: string; dailyMeeting: string;
  dailyPresent: string; dailyUnits: string; dailyOverall: string;
}

// Warna status kehadiran unit: penuh / baik / sederhana / rendah.
function nada(p: number) {
  if (p >= 100) return { bar: "#059669", teks: "text-emerald-700" };
  if (p >= 80) return { bar: "#0d9488", teks: "text-teal-700" };
  if (p >= 50) return { bar: "#d97706", teks: "text-amber-700" };
  return { bar: "#e11d48", teks: "text-rose-600" };
}

/** Cincin peratus (SVG) untuk kepala kad. */
function Cincin({ peratus }: { peratus: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 -rotate-90" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${(Math.min(100, peratus) / 100) * c} ${c}`} />
    </svg>
  );
}

const pct = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(2));

/**
 * Ringkasan kehadiran harian — satu kad bagi setiap bahagian (K/P, B/U, S/P, U/P),
 * meniru mesej WhatsApp kumpulan kokurikulum, dengan butang salin teks.
 */
export function RingkasanHarian({ harian, tarikh, teksSemua, d }: {
  harian: BahagianHarian[]; tarikh: string; teksSemua: string; d: Label;
}) {
  const hadir = harian.reduce((a, b) => a + b.hadir, 0);
  const total = harian.reduce((a, b) => a + b.total, 0);
  const keseluruhan = total ? Math.round((hadir / total) * 10000) / 100 : 0;

  return (
    <div className="space-y-4">
      {/* Jalur ringkasan keseluruhan */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{d.dailyOverall}</p>
            <p className="text-2xl font-extrabold text-slate-800 tabular-nums">
              {pct(keseluruhan)}% <span className="text-sm font-semibold text-slate-500">{hadir}/{total} {d.dailyPresent}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {harian.map((b) => (
              <span key={b.jenis} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.warna }} />
                {b.kod} <span className="tabular-nums text-slate-500">{pct(b.peratus)}%</span>
              </span>
            ))}
          </div>
        </div>
        <SalinTeks teks={teksSemua} label={d.dailyCopyAll} labelDisalin={d.dailyCopied} utama />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {harian.map((b) => (
          <article key={b.jenis} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {/* Kepala berwarna */}
            <header className="relative flex items-center justify-between gap-3 px-5 py-4 text-white"
              style={{ background: `linear-gradient(135deg, ${b.warna} 0%, ${b.warna}cc 100%)` }}>
              <div className="min-w-0">
                <p className="text-2xl font-extrabold tracking-wide">{b.kod}</p>
                <p className="truncate text-xs font-medium text-white/90">{b.label.split("—")[1]?.trim() ?? b.label}</p>
                <p className="mt-1 text-xs font-semibold text-white/80">📅 {tarikh} · {b.unit.length} {d.dailyUnits}</p>
              </div>
              <div className="relative">
                <Cincin peratus={b.peratus} />
                <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold tabular-nums">
                  {Math.round(b.peratus)}%
                </span>
              </div>
            </header>

            {/* Senarai unit */}
            <ol className="flex-1 divide-y divide-slate-100 px-2 py-1">
              {b.unit.map((u, i) => {
                const n = nada(u.peratus);
                return (
                  <li key={`${u.nama}-${u.bil}`} className="flex items-center gap-3 px-2 py-2"
                    title={`${u.nama} · ${d.dailyMeeting} ${u.bil} · ${u.peratus}%`}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug text-slate-700">{u.nama}</p>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, u.peratus)}%`, backgroundColor: n.bar }} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums text-slate-800">{u.hadir}/{u.total}</p>
                      <p className={`text-[11px] font-semibold tabular-nums ${n.teks}`}>{u.peratus}%</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* Jumlah */}
            <footer className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <p className="text-sm font-extrabold text-slate-800">
                {d.dailyTotal}: <span className="tabular-nums">{b.hadir}/{b.total}</span>{" "}
                <span className="tabular-nums" style={{ color: b.warna }}>({b.peratus.toFixed(2)}%)</span>
              </p>
              <SalinTeks teks={b.teks} label={d.dailyCopy} labelDisalin={d.dailyCopied} />
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
