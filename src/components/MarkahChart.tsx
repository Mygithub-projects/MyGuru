import type { BarisMarkah } from "@/lib/pelajar";

// Carta bar pecahan markah PAJSK T6 (tanpa dependency — CSS sahaja, sesuai SSR).
// Setiap bar menunjukkan markah komponen berbanding markah penuh komponen.
export function MarkahChart({ data }: { data: BarisMarkah[] }) {
  return (
    <div className="space-y-4">
      {data.map((d) => {
        const peratus = d.maks > 0 ? Math.min(100, (d.nilai / d.maks) * 100) : 0;
        return (
          <div key={d.kategori}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium text-slate-700">{d.kategori}</span>
              <span className="text-xs text-slate-500">
                {d.nilai} / {d.maks}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100">
              <div className="h-3 rounded-full bg-brand" style={{ width: `${peratus}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
