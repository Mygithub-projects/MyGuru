import { prisma } from "../src/lib/prisma";
import { mohonPertukaran } from "../src/lib/workflow";

// Tambah satu contoh UNIT_TRANSFER untuk panel Cadangan AI. Mencipta permohonan
// pertukaran sebenar (LogPertukaran Pending) dahulu, kemudian cadangan AI yang
// merujuknya — supaya butang "Luluskan" benar-benar memproses pertukaran itu.
async function main() {
  const guruUser = await prisma.user.findFirst({
    where: { role: "Guru" },
    select: { id: true },
  });
  const reviewerId = guruUser?.id ?? "admin";

  // Pelajar dengan unit Kelab sedia ada & tiada permohonan tergantung.
  const koko = await prisma.kokurikulum.findFirst({
    where: { jenisKoko: "Kelab", namaUnitT6: { not: null }, statusPertukaran: { not: "Pending" } },
    select: { pelajarId: true, namaUnitT6: true },
  });
  if (!koko) {
    console.log("Tiada baris Kokurikulum sesuai dijumpai — dilangkau.");
    return;
  }

  const unitBaru = koko.namaUnitT6 === "KELAB ROBOTIK" ? "KELAB BAHASA" : "KELAB ROBOTIK";
  const log = await mohonPertukaran({
    pelajarId: koko.pelajarId,
    jenisKoko: "Kelab",
    unitBaru,
    sebab: "Minat baharu dalam bidang teknologi.",
  });

  // Buang demo UNIT_TRANSFER lama sahaja, kekalkan jenis demo lain.
  await prisma.cadanganAgent.deleteMany({ where: { dicadangOleh: "DEMO", jenis: "UNIT_TRANSFER" } });

  await prisma.cadanganAgent.create({
    data: {
      jenis: "UNIT_TRANSFER",
      rujukanId: log.id,
      keputusan: "LULUS",
      justifikasi: `Permohonan pertukaran ke ${unitBaru} lengkap & munasabah; tiada konflik unit. Disyorkan LULUS.`,
      dicadangOleh: "DEMO",
      untukSemakan: reviewerId,
      status: "Pending",
    },
  });

  const pelajar = await prisma.pelajar.findUnique({
    where: { id: koko.pelajarId },
    select: { nama: true },
  });
  console.log(`UNIT_TRANSFER demo dicipta untuk ${pelajar?.nama}: ${koko.namaUnitT6} → ${unitBaru}`);
  console.log(`LogPertukaran: ${log.id}`);
}
main().finally(() => prisma.$disconnect());
