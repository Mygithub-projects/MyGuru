import { prisma } from "../src/lib/prisma";

// Seed contoh CadanganAgent untuk demo panel "Cadangan AI" di dashboard guru.
// Dirujuk ke rekod sebenar supaya label paparan kemas. Tag dicadangOleh="DEMO"
// untuk pembersihan mudah. Jalankan: npx tsx scripts/_seed_cadangan_demo.ts
async function main() {
  // Reviewer: guru pertama (untukSemakan). Admin tetap nampak semua (skop sekolah).
  const guruUser = await prisma.user.findFirst({
    where: { role: "Guru" },
    select: { id: true, guru: { select: { nama: true } } },
  });
  const reviewerId = guruUser?.id ?? "admin";

  const [p1, p2] = await prisma.pelajar.findMany({ take: 2, select: { id: true, nama: true } });
  const log = await prisma.logPertukaran.findFirst({ select: { id: true } });
  const pen = await prisma.pencapaian.findFirst({ select: { id: true } });
  const akt = await prisma.aktivitiLuar.findFirst({ select: { id: true } });

  await prisma.cadanganAgent.deleteMany({ where: { dicadangOleh: "DEMO" } });

  const rows: {
    jenis: string;
    rujukanId: string;
    keputusan?: string;
    justifikasi: string;
  }[] = [];

  if (p1)
    rows.push({
      jenis: "RECALC",
      rujukanId: p1.id,
      justifikasi: `Komponen markah ${p1.nama} berubah selepas kemas kini kehadiran — disyorkan kira semula PAJSK T6.`,
    });
  if (log)
    rows.push({
      jenis: "UNIT_TRANSFER",
      rujukanId: log.id,
      keputusan: "LULUS",
      justifikasi: "Permohonan pertukaran lengkap & munasabah; tiada konflik unit. Disyorkan LULUS.",
    });
  if (pen)
    rows.push({
      jenis: "ACHIEVEMENT",
      rujukanId: pen.id,
      keputusan: "SAHKAN",
      justifikasi: "Eviden pencapaian dilampirkan dan sah. Disyorkan SAHKAN dengan markah berkaitan.",
    });
  if (akt)
    rows.push({
      jenis: "ECERT",
      rujukanId: akt.id,
      justifikasi: "Aktiviti luar telah diluluskan & eviden lengkap — sedia untuk jana e-Cert.",
    });
  // Fallback RECALC kedua jika rekod lain tiada
  if (rows.length < 2 && p2)
    rows.push({
      jenis: "RECALC",
      rujukanId: p2.id,
      justifikasi: `Semakan berkala markah PAJSK T6 untuk ${p2.nama}.`,
    });

  for (const r of rows) {
    await prisma.cadanganAgent.create({
      data: {
        jenis: r.jenis,
        rujukanId: r.rujukanId,
        keputusan: r.keputusan ?? null,
        justifikasi: r.justifikasi,
        dicadangOleh: "DEMO",
        untukSemakan: reviewerId,
        status: "Pending",
      },
    });
  }

  console.log(`Reviewer (untukSemakan): ${reviewerId} (${guruUser?.guru?.nama ?? "—"})`);
  console.log(`Dicipta ${rows.length} cadangan demo:`);
  rows.forEach((r) => console.log(` - ${r.jenis} → ${r.rujukanId}`));
  console.log("Lihat di /guru (log masuk sebagai Admin atau guru tersebut).");
}
main().finally(() => prisma.$disconnect());
