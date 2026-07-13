import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/locale";
import { JawatanPanel } from "./JawatanPanel";

export default async function JawatanPage() {
  const session = await getSession();
  if (!session?.pelajarId) redirect("/login");
  const { t } = await getT();

  const isSU = session.subRole === "SU" || session.subRole === "NSU";
  if (!isSU) {
    return (
      <div className="space-y-4">
        <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.pelajar.backToDashboard}</Link>
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          {t.pelajar.positionRestricted}
        </div>
      </div>
    );
  }

  // Unit seliaan SU = unit T6 sendiri
  const suKoko = await prisma.kokurikulum.findMany({ where: { pelajarId: session.pelajarId } });
  const units = suKoko.map((k) => k.namaUnitT6).filter(Boolean) as string[];

  const ahli = await prisma.kokurikulum.findMany({
    where: { namaUnitT6: { in: units } },
    include: { pelajar: { select: { nama: true, kelasT6: true } } },
    orderBy: [{ namaUnitT6: "asc" }, { jenisKoko: "asc" }],
  });
  const pending = await prisma.cadanganJawatan.findMany({ where: { status: "Pending" } });
  const pendingMap = new Map(pending.map((p) => [`${p.pelajarId}:${p.jenisKoko}`, p.jawatanBaru]));

  const members = ahli.map((k) => ({
    pelajarId: k.pelajarId,
    nama: k.pelajar.nama,
    kelas: k.pelajar.kelasT6,
    jenisKoko: k.jenisKoko,
    namaUnit: k.namaUnitT6 ?? "",
    jawatanT6: k.jawatanT6 ?? "-",
    pending: pendingMap.get(`${k.pelajarId}:${k.jenisKoko}`) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.pelajar.backToDashboard}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.pelajar.positionTitle}</h1>
        <p className="text-sm text-slate-500">
          {t.pelajar.positionSubtitle}
        </p>
      </div>
      <JawatanPanel members={members} />
    </div>
  );
}
