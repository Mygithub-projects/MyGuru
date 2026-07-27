const TONE_TEXT = {
  default: "text-slate-800",
  ok: "text-emerald-600",
  warn: "text-amber-600",
  danger: "text-red-600",
  brand: "text-brand-dark",
} as const;

const TONE_BAR = {
  default: "bg-slate-400",
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  danger: "bg-red-500",
  brand: "bg-brand",
} as const;

export type StatTone = keyof typeof TONE_TEXT;

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
  progress,
  small,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: StatTone;
  progress?: number;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 font-bold ${small ? "text-sm" : "text-2xl sm:text-3xl"} ${TONE_TEXT[tone]}`}>{value}</p>
      {typeof progress === "number" && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${TONE_BAR[tone]}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
