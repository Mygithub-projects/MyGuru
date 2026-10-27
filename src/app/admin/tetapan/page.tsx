import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/locale";
import { TetapanClient } from "./TetapanClient";
import { KehadiranTetapan } from "./KehadiranTetapan";
import { jumlahAktiviti } from "@/lib/tetapan-kehadiran";
import { HadUnitTetapan } from "./HadUnitTetapan";
import { kuotaUnit } from "@/lib/had-unit";
import { normalKohort, senaraiKohort } from "@/lib/kohort";

export default async function TetapanPage({ searchParams }: { searchParams: Promise<{ kohort?: string }> }) {
  // Had ahli unit: lalai kohort terkini; admin boleh taip kohort baharu (cth STPM 2028).
  const kohortList = await senaraiKohort();
  const kohort = normalKohort((await searchParams).kohort) ?? kohortList[0] ?? "STPM 2027";
  const [items, jumlah, kuota, { t, locale }] = await Promise.all([
    prisma.tetapanMarkah.findMany({
      where: { kategori: { not: "Kehadiran" } }, // diurus oleh KehadiranTetapan
      orderBy: [{ kategori: "asc" }, { nilaiMarkah: "desc" }],
    }),
    jumlahAktiviti(),
    kuotaUnit(kohort),
    getT(),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="group inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark ring-1 ring-brand/20 transition hover:bg-brand hover:text-white">{t.admin.back}</Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{t.admin.tetapanPage.title}</h1>
        <p className="text-sm text-slate-500">
          {t.admin.tetapanPage.subtitle}
        </p>
      </div>
      <KehadiranTetapan
        awal={jumlah}
        label={{ Kelab: `${t.common.kelab} (KP)`, Sukan: `${t.common.sukan} (SP)`, Uniform: `${t.common.uniform} (BU)` }}
        locale={locale}
      />
      <HadUnitTetapan
        key={kohort}
        kohort={kohort}
        kohortList={kohortList}
        kuota={kuota}
        label={{ Sukan: `${t.common.sukan} (SP)`, Kelab: `${t.common.kelab} (KP)`, Uniform: `${t.common.uniform} (BU)` }}
        t={t.admin.hadUnit}
      />
      <TetapanClient
        items={items.map((i) => ({ id: i.id, kategori: i.kategori, namaItem: i.namaItem, nilaiMarkah: i.nilaiMarkah }))}
        t={t.admin.tetapanClient}
      />
    </div>
  );
}
