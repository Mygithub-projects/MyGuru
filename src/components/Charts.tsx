// Carta SVG/CSS ringan — tiada dependency luaran.

const PALETTE = ["#2563eb", "#1e3a5f", "#059669", "#d97706", "#dc2626", "#0891b2", "#7c3aed"];

export function BarChart({ data }: { data: { nama: string; nilai: number; sufiks?: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.nilai));
  if (data.length === 0) return <Kosong />;
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={d.nama}>
          <div className="mb-0.5 flex justify-between text-xs">
            <span className="truncate pr-2 text-slate-600">{d.nama}</span>
            <span className="font-semibold text-slate-700">
              {d.nilai}
              {d.sufiks ?? ""}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100">
            <div
              className="h-2.5 rounded-full"
              style={{ width: `${(d.nilai / max) * 100}%`, backgroundColor: PALETTE[i % PALETTE.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ data }: { data: { nama: string; bil: number }[] }) {
  const total = data.reduce((s, d) => s + d.bil, 0);
  if (total === 0) return <Kosong />;
  const R = 60, C = 2 * Math.PI * R;
  // Offset terkumpul dikira secara immutable (tiada penetapan semula).
  const segmen = data.map((d, i) => ({
    dash: (d.bil / total) * C,
    offset: data.slice(0, i).reduce((s, x) => s + (x.bil / total) * C, 0),
  }));
  return (
    <div className="flex items-center gap-4">
      <svg width={150} height={150} viewBox="0 0 150 150">
        <g transform="translate(75,75) rotate(-90)">
          {data.map((d, i) => (
            <circle
              key={d.nama}
              r={R}
              cx={0}
              cy={0}
              fill="none"
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={22}
              strokeDasharray={`${segmen[i].dash} ${C - segmen[i].dash}`}
              strokeDashoffset={-segmen[i].offset}
            />
          ))}
        </g>
        <text x={75} y={80} textAnchor="middle" className="fill-slate-700" style={{ fontSize: 22, fontWeight: 700 }}>
          {total}
        </text>
      </svg>
      <ul className="space-y-1 text-sm">
        {data.map((d, i) => (
          <li key={d.nama} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
            <span className="text-slate-600">{d.nama}</span>
            <span className="font-semibold text-slate-700">{d.bil}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LineChart({ data, sufiks = "%" }: { data: { label: string; nilai: number }[]; sufiks?: string }) {
  if (data.length === 0) return <Kosong />;
  const W = 360, H = 140, padX = 28, padY = 16;
  const max = Math.max(100, ...data.map((d) => d.nilai));
  const min = 0;
  const x = (i: number) => padX + (i * (W - padX * 2)) / Math.max(1, data.length - 1);
  const y = (v: number) => padY + (H - padY * 2) * (1 - (v - min) / (max - min || 1));
  const pts = data.map((d, i) => `${x(i)},${y(d.nilai)}`).join(" ");
  const area = `${padX},${H - padY} ${pts} ${x(data.length - 1)},${H - padY}`;

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="min-w-full">
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line x1={padX} x2={W - padX} y1={y(g)} y2={y(g)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={4} y={y(g) + 3} className="fill-slate-400" style={{ fontSize: 9 }}>{g}</text>
          </g>
        ))}
        <polygon points={area} fill="#2563eb" fillOpacity={0.08} />
        <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={d.label}>
            <circle cx={x(i)} cy={y(d.nilai)} r={3} fill="#2563eb" />
            <text x={x(i)} y={H - 4} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 9 }}>{d.label}</text>
          </g>
        ))}
      </svg>
      <p className="mt-1 text-center text-xs text-slate-400">Nilai dalam {sufiks}</p>
    </div>
  );
}

function Kosong() {
  return <p className="py-4 text-center text-sm text-slate-400">Tiada data untuk dipaparkan.</p>;
}
