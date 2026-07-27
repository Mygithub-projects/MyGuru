import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/locale";
import { GuruClient } from "./GuruClient";

export default async function GuruAdminPage() {
  const { t } = await getT();
  const guruRaw = await prisma.guru.findMany({
    orderBy: { nama: "asc" },
    select: {
      id: true, nama: true, email: true, jawatanKoko: true, statusAktif: true,
      penasihatKelab: {
        select: { namaUnit: true, jenisKoko: true, peranan: true },
        orderBy: { namaUnit: "asc" },
      },
    },
  });
  const guru = guruRaw.map((g) => ({
    id: g.id,
    nama: g.nama,
    email: g.email,
    jawatanKoko: g.jawatanKoko,
    statusAktif: g.statusAktif,
    penasihatKelab: g.penasihatKelab,
  }));
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.admin.back}</Link>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-800">{t.admin.guruPage.title}</h1>
          <Link href="/admin/guru/tambah" className="shrink-0 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">{t.admin.actAddTeacher}</Link>
        </div>
        <p className="text-sm text-slate-500">
          {t.admin.guruPage.subtitle}
        </p>
      </div>
      <GuruClient
        guru={guru}
        t={{
          jawatanKoko: t.common.jawatanKoko,
          kategori: { kelab: t.common.kelab, sukan: t.common.sukan, uniform: t.common.uniform, perkhidmatan: t.common.perkhidmatan },
          peranan: t.common.perananUnit,
          statusAktif: t.admin.guruClient.statusAktif,
          unitDiselia: t.admin.guruClient.unitDiselia, noUnitAssigned: t.admin.guruClient.noUnitAssigned,
          unitNamePlaceholder: t.admin.guruClient.unitNamePlaceholder, addUnit: t.admin.guruClient.addUnit,
          deleteConfirmTpl: t.admin.guruClient.deleteConfirmTpl, deleteFailed: t.admin.guruClient.deleteFailed,
          networkError: t.common.ralatRangkaian, saved: t.admin.guruClient.saved, save: t.common.simpan,
          deleteBtn: t.admin.guruClient.deleteBtn, deleting: t.admin.guruClient.deleting,
        }}
      />
    </div>
  );
}
