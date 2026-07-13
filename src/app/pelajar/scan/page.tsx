import { Suspense } from "react";
import Link from "next/link";
import { getT } from "@/lib/locale";
import { ScanClient } from "./ScanClient";

export default async function ScanPage() {
  const { t } = await getT();

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.common.kembali}</Link>
      <h1 className="text-xl font-bold text-slate-800">{t.pelajar.scanPageTitle}</h1>
      <Suspense fallback={<p className="text-sm text-slate-400">{t.pelajar.scanLoading}</p>}>
        <ScanClient />
      </Suspense>
    </div>
  );
}
