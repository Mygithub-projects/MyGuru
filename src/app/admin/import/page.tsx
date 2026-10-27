import Link from "next/link";
import { getT } from "@/lib/locale";
import { ImportClient } from "./ImportClient";
import { senaraiKohort } from "@/lib/kohort";

export default async function ImportPage() {
  const [{ t }, kohortList] = await Promise.all([getT(), senaraiKohort()]);
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.admin.back}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.admin.importPage.title}</h1>
        <p className="text-sm text-slate-500">
          {t.admin.importPage.subtitle}
        </p>
      </div>
      <ImportClient
        t={{ ...t.admin.importClient, networkError: t.common.ralatRangkaian }}
        kohortList={kohortList}
        kohortLalai={kohortList[0] ?? "STPM 2027"}
      />
    </div>
  );
}
