// ===========================================================================
//  Aktiviti Unit — dihantar SU/NSU untuk ramai peserta (mana-mana unit).
//  Selepas Ketua GP / Penolong Ketua GP unit SU mengesahkan, setiap peserta
//  mendapat markah PENGLIBATAN (Jadual D) & PENCAPAIAN (Jadual E), dikredit ke
//  unit peserta dalam bidang yang sama dengan unit SU (AktivitiUnit.jenisKoko).
// ===========================================================================
import { prisma } from "./prisma";
import { markahPeserta } from "./aktiviti-unit-markah";
import { unitBolehSahkan, kiraSemulaT6 } from "./workflow";
import { notifyPelajar } from "./notifikasi";
import type { Guru } from "@prisma/client";

/** Aktiviti unit menunggu pengesahan bagi unit di mana guru ini K / P. */
export async function aktivitiUnitUntukSemakan(guru: Pick<Guru, "id">) {
  const units = await unitBolehSahkan(guru);
  if (units.length === 0) return [];
  return prisma.aktivitiUnit.findMany({
    where: { namaUnit: { in: units }, statusPengesahan: "Pending" },
    orderBy: { createdAt: "asc" },
    include: {
      setiausaha: { select: { nama: true, kelasT6: true } },
      peserta: { include: { pelajar: { select: { nama: true, kelasT6: true } } }, orderBy: { pelajar: { nama: "asc" } } },
    },
  });
}

/** Sahkan / kuiri aktiviti unit. Lulus → simpan markah peserta & kira semula T6. */
export async function sahkanAktivitiUnit(input: {
  aktivitiId: string;
  guruId: string;
  status: "Approved" | "Kuiri";
  komen?: string;
}) {
  const a = await prisma.aktivitiUnit.findUnique({ where: { id: input.aktivitiId }, include: { peserta: true } });
  if (!a) throw new Error("Aktiviti tidak dijumpai.");
  if (a.statusPengesahan === "Approved") throw new Error("Aktiviti ini telah disahkan.");
  if (input.status === "Approved" && !a.lampiranEviden) throw new Error("Tiada eviden: aktiviti tidak boleh disahkan.");

  const lulus = input.status === "Approved";
  await prisma.$transaction([
    prisma.aktivitiUnit.update({
      where: { id: a.id },
      data: {
        statusPengesahan: input.status,
        komenGuru: input.komen ?? null,
        disahkanOlehId: lulus ? input.guruId : null,
        tarikhSahkan: lulus ? new Date() : null,
      },
    }),
    ...a.peserta.map((p) => {
      const m = markahPeserta(a.peringkat, p.kedudukan);
      return prisma.aktivitiUnitPeserta.update({
        where: { id: p.id },
        data: { markahPenglibatan: lulus ? m.penglibatan : 0, markahPencapaian: lulus ? m.pencapaian : 0 },
      });
    }),
  ]);

  if (lulus) {
    for (const p of a.peserta) {
      await kiraSemulaT6(p.pelajarId);
      const m = markahPeserta(a.peringkat, p.kedudukan);
      await notifyPelajar(p.pelajarId, {
        tajuk: "Aktiviti disahkan",
        mesej: `"${a.namaAktiviti}" (${p.kedudukan}) disahkan — penglibatan ${m.penglibatan}, pencapaian ${m.pencapaian} markah.`,
        jenis: "lulus",
        pautan: "/pelajar/aktiviti",
      });
    }
  } else {
    await notifyPelajar(a.setiausahaId, {
      tajuk: "Aktiviti dikuiri",
      mesej: `"${a.namaAktiviti}" perlu pembetulan.${input.komen ? " " + input.komen : ""}`,
      jenis: "kuiri",
      pautan: "/pelajar/aktiviti",
    });
  }
  return { id: a.id, peserta: a.peserta.length };
}
