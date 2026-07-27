import Link from "next/link";
import { getTetapanSijil } from "@/lib/tetapan-sijil";
import { getT } from "@/lib/locale";
import { SijilClient } from "./SijilClient";

export default async function SijilPage() {
  const tetapan = await getTetapanSijil();
  const { t } = await getT();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.admin.back}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.admin.sijilPage.title}</h1>
        <p className="text-sm text-slate-500">{t.admin.sijilPage.subtitle}</p>
      </div>
      <SijilClient tetapan={tetapan} t={t.admin.sijilClient} />
    </div>
  );
}
