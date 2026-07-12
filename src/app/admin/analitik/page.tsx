import Link from "next/link";
import { AnalitikDashboard } from "@/components/AnalitikDashboard";

// Data dikira semula setiap permintaan — sentiasa reaktif kepada markah/
// kehadiran terbaru yang disahkan (bukan cache statik). §7.
export const dynamic = "force-dynamic";

export default function AdminAnalitikPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">← Kembali</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">Analitik Keseluruhan Kohort</h1>
        <p className="text-sm text-slate-500">Gred, markah, kehadiran, pencapaian, projek, laporan & demografi seluruh sekolah.</p>
        <div className="mt-2 flex gap-2">
          <a href="/api/analitik/eksport?format=excel" className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-2">⬇ Eksport Excel</a>
          <a href="/api/analitik/eksport?format=pdf" className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover">⬇ Eksport PDF</a>
        </div>
      </div>
      <AnalitikDashboard demografiPenuh />
    </div>
  );
}
