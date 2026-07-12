// ===========================================================================
//  Seed LAPORAN — jana laporan mingguan & projek (pelbagai status) demo.
//  Jalankan: npx tsx scripts/seed-reports.ts
//  Difailkan oleh SU/NSU, dipaut ke unit + sesi kehadiran. Sebahagian
//  Approved (boleh muat turun PDF), sebahagian Pending (menunggu guru), Kuiri.
// ===========================================================================
import { prisma } from "../src/lib/prisma";

const AKTIVITI = [
  "Mesyuarat mingguan: perancangan aktiviti & pembahagian tugas",
  "Bengkel kemahiran ahli & latihan berkumpulan",
  "Gotong-royong dan penyediaan bahan projek",
  "Perbincangan laporan kemajuan & refleksi aktiviti",
  "Sesi latihan / perjumpaan biasa unit",
];
const PROJEK = [
  "Projek Khidmat Masyarakat",
  "Kempen Kesedaran Alam Sekitar",
  "Pameran & Karnival Unit",
  "Program Jalinan Komuniti",
];

function statusMingguan(i: number, n: number): "Approved" | "Pending" | "Kuiri" {
  const m = (i + n) % 10;
  if (m === 3) return "Kuiri";
  if (m === 6 || m === 9) return "Pending";
  return "Approved";
}

async function main() {
  console.log("Menjana laporan demo ...");
  await prisma.laporanMingguan.deleteMany({});
  await prisma.laporanProjek.deleteMany({});

  const officers = await prisma.pelajar.findMany({
    where: { subRole: { in: ["SU", "NSU"] } },
    include: { kokurikulum: { select: { jenisKoko: true, namaUnitT6: true } } },
    orderBy: { nama: "asc" },
  });

  let mingguan = 0;
  let projek = 0;
  let approved = 0;

  for (let i = 0; i < officers.length; i++) {
    const su = officers[i];
    // Unit utama: kelab jika ada, jika tidak unit pertama
    const unit =
      su.kokurikulum.find((k) => k.jenisKoko === "Kelab" && k.namaUnitT6) ??
      su.kokurikulum.find((k) => k.namaUnitT6);
    if (!unit?.namaUnitT6) continue;
    const namaUnit = unit.namaUnitT6;

    const sesi = await prisma.sesiKehadiran.findMany({
      where: { namaUnit },
      orderBy: { bilPerjumpaan: "asc" },
      take: 3,
      select: { id: true, tarikh: true, bilPerjumpaan: true },
    });

    // 3 laporan mingguan (dipaut ke sesi jika ada)
    for (let n = 1; n <= 3; n++) {
      const s = sesi[n - 1];
      const status = statusMingguan(i, n);
      await prisma.laporanMingguan.create({
        data: {
          jenisKoko: unit.jenisKoko,
          namaUnit,
          tarikh: s?.tarikh ?? new Date(Date.UTC(2026, 1, n * 7)),
          masa: "3:00 PM",
          aktiviti: `${AKTIVITI[(i + n) % AKTIVITI.length]} (Perjumpaan ${s?.bilPerjumpaan ?? n})`,
          lampiran: n === 1 ? "lampiran/minit-mesyuarat.pdf" : null,
          setiausahaId: su.id,
          statusSemakan: status,
          komenGuru:
            status === "Approved" ? "Disahkan. Laporan lengkap & kemas." :
            status === "Kuiri" ? "Sila lampirkan gambar aktiviti & senarai kehadiran." : null,
          sesiId: s?.id ?? null,
        },
      });
      mingguan++;
      if (status === "Approved") approved++;
    }

    // Laporan projek untuk separuh SU
    if (i % 2 === 0) {
      const pstatus = i % 3 === 0 ? "Pending" : "Approved";
      await prisma.laporanProjek.create({
        data: {
          namaProjek: `${PROJEK[i % PROJEK.length]} — ${namaUnit}`,
          jenisKoko: unit.jenisKoko,
          namaUnit,
          setiausahaId: su.id,
          failKertasKerja: "projek/kertas-kerja.pdf",
          failLaporanImpak: pstatus === "Approved" ? "projek/laporan-impak.pdf" : null,
          kewangan: "Peruntukan RM500; perbelanjaan RM420; baki RM80.",
          kekuatan: "Penyertaan ahli menggalakkan; kerjasama pihak sekolah baik.",
          kelemahan: "Kekangan masa; perlu promosi lebih awal pada masa hadapan.",
          statusPengesahan: pstatus,
          komenGuru: pstatus === "Approved" ? "Projek dilaksanakan dengan jayanya. Disahkan." : null,
        },
      });
      projek++;
      if (pstatus === "Approved") approved++;
    }
  }

  console.log(
    `Selesai ✓  ${mingguan} laporan mingguan + ${projek} laporan projek (${approved} Approved) ` +
      `daripada ${officers.length} SU/NSU.`
  );
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
