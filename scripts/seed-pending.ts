import { prisma } from "../src/lib/prisma";
(async () => {
  // Ambil 3 pelajar untuk data ujian
  const pelajar = await prisma.pelajar.findMany({ take: 3 });
  // 1. Pencapaian pending
  await prisma.pencapaian.create({
    data: { pelajarId: pelajar[0].id, namaPencapaian: "Pertandingan Robotik Peringkat Negeri", kategori: "biasa", peringkat: "Negeri", statusSemakan: "Pending", markah: 0 },
  });
  // 2. Aktiviti luar pending (eviden lengkap)
  await prisma.aktivitiLuar.create({
    data: { pelajarId: pelajar[1].id, namaAktiviti: "Kursus Kepimpinan Belia Kebangsaan", peringkat: "Kebangsaan", lampiranSurat: "/uploads/surat-demo.pdf", lampiranSijil: "/uploads/sijil-demo.pdf", statusPengesahan: "Pending" },
  });
  // 3. Aktiviti luar pending (eviden TIDAK lengkap - patut tak boleh sahkan)
  await prisma.aktivitiLuar.create({
    data: { pelajarId: pelajar[2].id, namaAktiviti: "Webinar Kerjaya (tiada sijil)", peringkat: "Sekolah", lampiranSurat: "/uploads/surat-demo.pdf", statusPengesahan: "Pending" },
  });
  // 4. Pertukaran unit pending
  await prisma.logPertukaran.create({
    data: { pelajarId: pelajar[0].id, jenisKoko: "Kelab", unitLama: "PERSATUAN BAHASA ARAB", unitBaru: "Kelab Robotik", sebab: "Minat dalam teknologi", status: "Pending" },
  });
  await prisma.kokurikulum.updateMany({ where: { pelajarId: pelajar[0].id, jenisKoko: "Kelab" }, data: { statusPertukaran: "Pending" } });
  console.log("Data pending ujian dicipta.");
  await prisma.$disconnect();
})();
