import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/locale";
import { EditPelajarForm } from "./EditPelajarForm";

export default async function EditPelajarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pelajar = await prisma.pelajar.findUnique({
    where: { id },
    select: {
      id: true, nama: true, noIc: true, kelasT6: true,
      jantina: true, kaum: true, agama: true, email: true, noTel: true,
      subRole: true, statusAktif: true,
    },
  });
  if (!pelajar) notFound();
  const { t } = await getT();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.admin.backToPelajarList}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.admin.editPelajarPage.title}</h1>
        <p className="text-sm text-slate-500">
          {t.admin.editPelajarPage.subtitle}
        </p>
      </div>
      <EditPelajarForm
        pelajar={pelajar}
        t={{
          ...t.admin.pelajarForm, kaum: t.common.kaum, agama: t.common.agama,
          male: t.admin.male, female: t.admin.female, subRole: t.common.subRolePelajar,
          networkError: t.common.ralatRangkaian,
        }}
      />
    </div>
  );
}
