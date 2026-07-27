import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/locale";
import { DemografiClient } from "./DemografiClient";

export default async function DemografiPage() {
  const pelajar = await prisma.pelajar.findMany({
    orderBy: { nama: "asc" },
    select: { id: true, nama: true, noIc: true, jantina: true, kaum: true, agama: true },
  });
  const { t } = await getT();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.admin.back}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.admin.actDemographics}</h1>
        <p className="text-sm text-slate-500">
          {t.admin.demografiPage.subtitle}
        </p>
      </div>
      <DemografiClient
        pelajar={pelajar}
        t={{
          colName: t.guru.colName, colGender: t.admin.demografiPage.colGender,
          colRace: t.admin.demografiPage.colRace, colReligion: t.admin.demografiPage.colReligion,
          male: t.admin.male, female: t.admin.female, kaum: t.common.kaum, agama: t.common.agama,
          save: t.common.simpan,
        }}
      />
    </div>
  );
}
