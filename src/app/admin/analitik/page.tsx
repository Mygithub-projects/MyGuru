import Link from "next/link";
import { AnalitikDashboard } from "@/components/AnalitikDashboard";
import { getT } from "@/lib/locale";

// Data dikira semula setiap permintaan — sentiasa reaktif kepada markah/
// kehadiran terbaru yang disahkan (bukan cache statik). §7.
export const dynamic = "force-dynamic";

export default async function AdminAnalitikPage() {
  const { t } = await getT();
  const d = t.admin.analitikPage;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.admin.back}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{d.title}</h1>
        <p className="text-sm text-slate-500">{d.subtitle}</p>
        <div className="mt-2 flex gap-2">
          <a href="/api/analitik/eksport?format=excel" className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-2">{t.analitik.exportExcel}</a>
          <a href="/api/analitik/eksport?format=pdf" className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover">{t.analitik.exportPdf}</a>
        </div>
      </div>
      <AnalitikDashboard demografiPenuh />
    </div>
  );
}
