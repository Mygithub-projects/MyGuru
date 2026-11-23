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
import { z } from "zod";
import { bacaOprDariForm, type OprData } from "./opr";
import { unitSeliaanSU } from "./pelajar";
import { KEDUDUKAN_AKTIVITI, PERINGKAT_AKTIVITI_UNIT, type KedudukanAktiviti } from "./enums";

const pesertaSchema = z
  .array(z.object({ pelajarId: z.string().min(1), kedudukan: z.enum(KEDUDUKAN_AKTIVITI) }))
  .min(1, "Sekurang-kurangnya seorang peserta diperlukan")
  .max(300);

export interface BorangAktivitiUnit {
  opr: OprData;
  namaUnit: string;
  jenisKoko: string;
  peringkat: string;
  peserta: { pelajarId: string; kedudukan: KedudukanAktiviti }[];
}

/**
 * Baca & sahkan borang Aktiviti Unit (SU/NSU) + bina data OPR (dengan senarai
 * peserta & kedudukan). Dipakai oleh pratonton OPR dan penghantaran sebenar.
 */
export async function bacaAktivitiUnitDariForm(
  form: FormData,
  su: { pelajarId: string; subRole: string | null | undefined },
): Promise<{ data: BorangAktivitiUnit } | { ralat: string; status?: number }> {
  const namaAktiviti = String(form.get("namaAktiviti") ?? "").trim().slice(0, 200);
  const peringkat = String(form.get("peringkat") ?? "");
  const namaUnit = String(form.get("namaUnit") ?? "");
  if (!namaAktiviti) return { ralat: "Nama program/aktiviti diperlukan" };
  if (!PERINGKAT_AKTIVITI_UNIT.includes(peringkat as (typeof PERINGKAT_AKTIVITI_UNIT)[number])) return { ralat: "Peringkat tidak sah" };

  // Unit mesti unit di mana pelajar ini SU/NSU; bidang dari rekod (bukan klien).
  const unitSU = await unitSeliaanSU(su.pelajarId, su.subRole);
  if (!unitSU.includes(namaUnit)) return { ralat: "Anda hanya boleh menghantar untuk unit di mana anda SU/NSU", status: 403 };
  const koko = await prisma.kokurikulum.findFirst({
    where: { pelajarId: su.pelajarId, namaUnitT6: namaUnit },
    select: { jenisKoko: true },
  });
  if (!koko || koko.jenisKoko === "Perkhidmatan") return { ralat: "Aktiviti unit hanya untuk unit Kelab, Sukan atau Badan Beruniform" };

  let peserta: z.infer<typeof pesertaSchema>;
  try {
    const p = pesertaSchema.safeParse(JSON.parse(String(form.get("peserta") ?? "[]")));
    if (!p.success) return { ralat: p.error.issues[0]?.message ?? "Senarai peserta tidak sah" };
    peserta = p.data;
  } catch {
    return { ralat: "Senarai peserta tidak sah" };
  }
  const ids = [...new Set(peserta.map((x) => x.pelajarId))];
  if (ids.length !== peserta.length) return { ralat: "Peserta berulang dalam senarai" };
  const rows = await prisma.pelajar.findMany({ where: { id: { in: ids }, statusAktif: true }, select: { id: true, nama: true, kelasT6: true } });
  if (rows.length !== ids.length) return { ralat: "Sebahagian peserta tidak dijumpai atau tidak aktif" };
  const ikutId = new Map(rows.map((r) => [r.id, r]));

  const r = await bacaOprDariForm(form, "Aktiviti", { id: su.pelajarId, subRole: su.subRole }, {
    nama: namaAktiviti,
    peranan: su.subRole ?? "SU",
    peserta: peserta.map((x) => ({ nama: ikutId.get(x.pelajarId)!.nama, kelas: ikutId.get(x.pelajarId)!.kelasT6, jawatan: x.kedudukan })),
  });
  if ("ralat" in r) return { ralat: r.ralat };
  return { data: { opr: r.data, namaUnit, jenisKoko: koko.jenisKoko, peringkat, peserta } };
}

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
