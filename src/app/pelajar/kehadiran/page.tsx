import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ahliUnit } from "@/lib/kehadiran";
import { unitSeliaanSU } from "@/lib/pelajar";
import { KehadiranPanel } from "./KehadiranPanel";
import { getT } from "@/lib/locale";

export default async function KehadiranPage() {
  const session = await getSession();
  if (!session?.pelajarId) redirect("/login");
  const { t } = await getT();

  const isSU = session.subRole === "SU" || session.subRole === "NSU";
  if (!isSU) {
    return (
      <div className="space-y-4">
        <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.pelajar.backToDashboard}</Link>
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          {t.pelajar.attendanceRestricted}
        </div>
      </div>
    );
  }

  // Unit seliaan = unit T6 di mana pelajar memegang jawatan Setiausaha/Penolong Setiausaha sahaja
  const namaUnitSeliaan = await unitSeliaanSU(session.pelajarId, session.subRole);
  const koko = await prisma.kokurikulum.findMany({ where: { pelajarId: session.pelajarId, namaUnitT6: { in: namaUnitSeliaan } } });
  const units = await Promise.all(
    koko
      .filter((k) => k.namaUnitT6)
      .map(async (k) => ({
        jenisKoko: k.jenisKoko,
        namaUnit: k.namaUnitT6!,
        ahli: await ahliUnit(k.namaUnitT6!),
      }))
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pelajar" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.pelajar.backToDashboard}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.pelajar.attendancePageTitle}</h1>
        <p className="text-sm text-slate-500">
          {t.pelajar.attendanceSubtitle}
        </p>
      </div>
      <KehadiranPanel units={units} />
    </div>
  );
}
