import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/locale";
import { guruSeluruhSekolah, unitSeliaan } from "@/lib/workflow";
import { PemilihanForm } from "./PemilihanForm";

export default async function PemilihanPertandinganPage() {
  const session = await getSession();
  const { t } = await getT();
  const d = t.guru.pemilihan;
  if (!session) redirect("/login");

  const guru = session.guruId
    ? await prisma.guru.findUnique({ where: { id: session.guruId } })
    : null;
  if (!guru && session.role !== "Admin") redirect("/login");

  const guruEff =
    guru ??
    ({
      id: session.userId,
      nama: "Pentadbir",
      jawatanKoko: "Penyelaras",
      kelabDiselia: null,
      sukanDiselia: null,
      badanDiselia: null,
    } as NonNullable<typeof guru>);

  const seluruh = guruSeluruhSekolah(guruEff);
  const units = await unitSeliaan(guruEff);

  // Pelajar yang boleh dipilih mengikut skop seliaan guru.
  const pelajar =
    seluruh
      ? await prisma.pelajar.findMany({
          where: { statusAktif: true },
          select: { id: true, nama: true, kelasT6: true, kokurikulum: { select: { jenisKoko: true, namaUnitT6: true } } },
          orderBy: [{ kelasT6: "asc" }, { nama: "asc" }],
        })
      : units.length
      ? await prisma.pelajar.findMany({
          where: { statusAktif: true, kokurikulum: { some: { namaUnitT6: { in: units } } } },
          select: { id: true, nama: true, kelasT6: true, kokurikulum: { select: { jenisKoko: true, namaUnitT6: true } } },
          orderBy: [{ kelasT6: "asc" }, { nama: "asc" }],
        })
      : [];

  const senarai = pelajar.map((p) => ({
    id: p.id,
    nama: p.nama,
    kelasT6: p.kelasT6,
    sukan: p.kokurikulum.find((k) => k.jenisKoko === "Sukan")?.namaUnitT6 ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <a href="/guru" className="text-xs font-semibold text-slate-500 hover:text-slate-700">{d.back}</a>
        <h1 className="mt-1 text-xl font-bold text-slate-800">{d.title}</h1>
        <p className="text-sm text-slate-500">
          {d.subtitle}
          {seluruh ? ` ${t.guru.scopeSchool}.` : ` ${t.guru.scopeUnit}.`}
        </p>
      </div>

      {senarai.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
          {d.noStudents}
        </p>
      ) : (
        <PemilihanForm pelajar={senarai} t={d} />
      )}
    </div>
  );
}
