import Link from "next/link";
import { getT } from "@/lib/locale";
import { TambahPelajarForm } from "./TambahPelajarForm";

export default async function TambahPelajarPage() {
  const { t } = await getT();
  const d = t.admin.tambahPelajarPage;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.admin.backToDashboard}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{d.title}</h1>
        <p className="text-sm text-slate-500">
          {d.subtitleBefore}{" "}
          <Link href="/admin/import" className="text-brand-dark underline">{d.subtitleLink}</Link>.
        </p>
      </div>
      <TambahPelajarForm
        t={{
          ...t.admin.pelajarForm, ...t.admin.tambahPelajarForm,
          kaum: t.common.kaum, agama: t.common.agama, male: t.admin.male, female: t.admin.female,
          subRole: t.common.subRolePelajar, networkError: t.common.ralatRangkaian,
        }}
      />
    </div>
  );
}
