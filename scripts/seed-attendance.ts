// ===========================================================================
//  Seed KEHADIRAN — jana sesi perjumpaan + rekod kehadiran demo.
//  Jalankan: npx tsx scripts/seed-attendance.ts
//  10 sesi setiap unit → setiap pelajar (3 unit) = 30 rekod = 30 perjumpaan/tahun.
//  Kadar hadir berbeza antara pelajar. Markah kehadiran & PAJSK T6 dikira semula.
// ===========================================================================
import { randomBytes } from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { kiraSemulaKehadiran } from "../src/lib/kehadiran";

const SESI_PER_UNIT = 10;
const HARI = 24 * 60 * 60 * 1000;
const BASE = new Date(Date.UTC(2026, 0, 15)); // 15 Jan 2026, mingguan

async function main() {
  console.log("Menjana kehadiran demo ...");

  // Buang kehadiran sedia ada (mula bersih)
  await prisma.kehadiran.deleteMany({});
  await prisma.sesiKehadiran.deleteMany({});

  // Kumpul ahli setiap unit T6
  const koko = await prisma.kokurikulum.findMany({
    where: { namaUnitT6: { not: null } },
    select: { pelajarId: true, jenisKoko: true, namaUnitT6: true },
  });
  const units = new Map<string, { jenisKoko: string; members: string[] }>();
  for (const k of koko) {
    const nama = k.namaUnitT6 as string;
    if (!units.has(nama)) units.set(nama, { jenisKoko: k.jenisKoko, members: [] });
    units.get(nama)!.members.push(k.pelajarId);
  }

  // Kadar hadir per pelajar (deterministik ikut hash IC-less: guna urutan)
  const semuaPelajar = [...new Set(koko.map((k) => k.pelajarId))];
  const kadar = new Map<string, number>();
  semuaPelajar.forEach((id, i) => kadar.set(id, 0.6 + (i % 9) * 0.05)); // 0.60..1.00

  let bilSesi = 0;
  let bilRekod = 0;

  for (const [namaUnit, info] of units) {
    for (let bil = 1; bil <= SESI_PER_UNIT; bil++) {
      const tarikh = new Date(BASE.getTime() + (bil - 1) * 7 * HARI);
      const sesi = await prisma.sesiKehadiran.create({
        data: {
          jenisKoko: info.jenisKoko,
          namaUnit,
          tarikh,
          bilPerjumpaan: bil,
          token: randomBytes(9).toString("base64url"),
          dibuka: false,
          disahkan: true, // dianggap telah disahkan guru
        },
      });
      bilSesi++;

      const rows = info.members.map((pelajarId) => ({
        pelajarId,
        jenisKoko: info.jenisKoko,
        namaUnit,
        tarikh,
        bilPerjumpaan: bil,
        statusHadir: Math.random() < (kadar.get(pelajarId) ?? 0.8),
        disahkan: true,
        sesiId: sesi.id,
      }));
      await prisma.kehadiran.createMany({ data: rows });
      bilRekod += rows.length;
    }
  }
  console.log(`  ${bilSesi} sesi, ${bilRekod} rekod kehadiran dicipta`);

  // Kira semula markah kehadiran + PAJSK T6 untuk setiap pelajar
  console.log(`  Mengira semula markah untuk ${semuaPelajar.length} pelajar ...`);
  for (const id of semuaPelajar) {
    await kiraSemulaKehadiran(id);
  }

  // Re-baseline T5 = T6 + delta kecil (varian tahun-ke-tahun) supaya perbandingan
  // T5 vs T6 kekal konsisten selepas markah T6 berubah dek kehadiran.
  const delta = [-4, -2, 0, 3, 5, -3, 2, 6, -1, 1];
  const semua = await prisma.pelajar.findMany({ select: { id: true, markahPajskT6: true }, orderBy: { nama: "asc" } });
  let bi = 0;
  for (const p of semua) {
    const t6 = p.markahPajskT6 ?? 0;
    const t5 = Math.max(0, Math.min(100, Math.round((t6 + delta[bi % delta.length]) * 100) / 100));
    await prisma.pelajar.update({ where: { id: p.id }, data: { markahPajskT5: t5, peratusPajskT5: t5 } });
    bi++;
  }

  const agg = await prisma.pelajar.aggregate({
    _avg: { markahKehadiran: true, peratusPajskT6: true },
    _min: { markahKehadiran: true },
    _max: { markahKehadiran: true },
  });
  console.log(
    `Selesai ✓  Markah kehadiran: purata ${Math.round((agg._avg.markahKehadiran ?? 0) * 10) / 10}` +
      ` (min ${agg._min.markahKehadiran}, max ${agg._max.markahKehadiran}) · purata PAJSK T6 ${Math.round((agg._avg.peratusPajskT6 ?? 0) * 10) / 10}%`
  );
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
