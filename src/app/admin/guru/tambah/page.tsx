import Link from "next/link";
import { getT } from "@/lib/locale";
import { TambahGuruForm } from "./TambahGuruForm";

export default async function TambahGuruPage() {
  const { t } = await getT();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/guru" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.admin.backToGuru}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.admin.guruTambahPage.title}</h1>
        <p className="text-sm text-slate-500">
          {t.admin.guruTambahPage.subtitle}
        </p>
      </div>
      <TambahGuruForm
        t={{
          jawatanKoko: t.common.jawatanKoko,
          kategori: { kelab: t.common.kelab, sukan: t.common.sukan, uniform: t.common.uniform, perkhidmatan: t.common.perkhidmatan },
          peranan: t.common.perananUnit,
          ...t.admin.guruForm,
          unitDiselia: t.admin.guruClient.unitDiselia,
          unitNamePlaceholder: t.admin.guruClient.unitNamePlaceholder,
          addUnit: t.admin.guruClient.addUnit,
          networkError: t.common.ralatRangkaian,
        }}
      />
    </div>
  );
}
