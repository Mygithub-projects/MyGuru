import { getInsights, type JenisCerapan } from "@/lib/insights";
import { getT } from "@/lib/locale";
import { AiNarrative } from "./AiNarrative";

const IKON: Record<JenisCerapan, string> = { positif: "✅", amaran: "⚠️", info: "ℹ️" };
const WARNA: Record<JenisCerapan, string> = {
  positif: "border-emerald-200 bg-emerald-50/60",
  amaran: "border-amber-200 bg-amber-50/60",
  info: "border-slate-200 bg-slate-50",
};

function ArrowBadge({ arah }: { arah?: "naik" | "turun" | "rata" }) {
  if (arah === "naik") return <span className="text-emerald-600">▲</span>;
  if (arah === "turun") return <span className="text-amber-600">▼</span>;
  return <span className="text-slate-400">■</span>;
}

export async function AiInsights({ units }: { units?: string[] }) {
  const { locale, t } = await getT();
  const { kpi, cerapan } = await getInsights(units, locale);

  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      {/* Header bergaya AI */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-ink to-brand px-5 py-3 text-white">
        <span className="text-lg">✨</span>
        <h2 className="text-sm font-bold uppercase tracking-wide">{t.insights.title}</h2>
        <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide">
          {t.insights.badge}
        </span>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
        {kpi.map((k) => (
          <div key={k.label} className="bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{k.label}</p>
            <p className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-slate-800">
              {k.nilai} <span className="text-xs"><ArrowBadge arah={k.arah} /></span>
            </p>
            {k.delta && <p className="text-xs text-slate-400">{k.delta}</p>}
          </div>
        ))}
      </div>

      {/* Cerapan */}
      <div className="space-y-2 p-5">
        <AiNarrative label={t.insights.aiLabel} loadingText={t.insights.aiLoading} locale={locale} />
        {cerapan.map((c, i) => (
          <div key={i} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${WARNA[c.jenis]}`}>
            <span>{IKON[c.jenis]}</span>
            <span className="text-slate-700">{c.teks}</span>
          </div>
        ))}
        <p className="pt-1 text-[11px] text-slate-400">
          {t.insights.footerNote}
        </p>
      </div>
    </section>
  );
}
