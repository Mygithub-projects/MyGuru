// ===========================================================================
//  Tetapkan Guru Pemantau 2027 (dokumen "Pemantau Koko", 5.4.6–5.4.8).
//  - Unit Sukan/Kelab/Uniform setiap guru diganti dengan unit pantauan dalam
//    dokumen, peranan "Pemantau" (LIHAT SAHAJA). Unit Perkhidmatan TIDAK diusik
//    (di situ mereka penasihat sebenar).
//  - jawatanKoko → "GuruPemantau" (skop unit), KECUALI (keputusan pengguna
//    2026-11-26): Shafiza Hanum → KetuaUnitKoko, Rafidah kekal KetuaUnitKoko
//    (kedua-duanya lihat seluruh sekolah).
//  Jalankan SELEPAS kod GuruPemantau di-deploy.
//    npx tsx scripts/tetapkan-guru-pemantau-2027.ts            (percubaan)
//    npx tsx scripts/tetapkan-guru-pemantau-2027.ts --apply    (tulis)
// ===========================================================================
import { writeFileSync } from "fs";
import { prisma } from "../src/lib/prisma";

const APPLY = process.argv.includes("--apply");

const PEMANTAU: Record<string, string[]> = {
  "YU YEW THIAM": ["Bola Tampar", "PISPA", "Kelab Pencegahan Jenayah"],
  "RAMONA BINTI RAMLY": ["Bola Tampar", "Pengakap Kelana", "Kelab Komputer"],
  "MOHD FAISAL BIN HASAN": ["Bola Keranjang", "St. John Ambulans Malaysia", "Kelab Koperasi"],
  "DZULKIFLI BIN MAHMON @ MAHMUN": ["Bola Keranjang", "St. John Ambulans Malaysia", "Kelab Falak"],
  "RAFIDAH BINTI ABDUL RAZAK": ["Badminton", "Catur", "St. John Ambulans Malaysia", "Kelab Rukun Negara"],
  "VIJAYALAKSMI A/P NADARAJAH": ["Badminton", "Briged Bomba", "Kelab Informasi"],
  "SHAFIZA HANUM BINTI ABDUL WAHAB": ["Catur", "PISPA", "Kelab Bimbingan dan Kerjaya"],
  "ELLY ZARINA BINTI AB MANAF": ["Catur", "Pengakap Kelana", "Persatuan Bahasa"],
  "SITI NOR'AISYAH BINTI AB. RAHMAN": ["Bola Jaring", "Pengakap Kelana", "Persatuan Sains dan Matematik"],
  "SHARIFAH KHALIZAH BT SYED ABDUL RAHMAN": ["Bola Jaring", "PISPA", "Persatuan Bahasa", "Kelab Informasi"],
  "KU ZAINAB BINTI KU MANSOR": ["Futsal", "St. John Ambulans Malaysia", "Kelab Rukun Negara"],
  "MUHAMAD TAHRIRI BIN ABD. HAMID": ["Futsal", "Pengakap Kelana", "Kelab Fotografi"],
  "NOOR KHUZAIMAH BINTI ABDUL RAHMAN": ["Ping Pong", "PISPA", "Kelab Komputer"],
  "MIMI HARTINI BINTI OMAR": ["Ping Pong", "Briged Bomba", "Kelab Kebudayaan dan Kesenian"],
  "NUR AHMAD KAMEL BIN AHMAD@MOHAMED": ["Seni Mempertahankan Diri", "Briged Bomba", "Kelab Alam Sekitar dan Keceriaan"],
  "AZLIN BINTI ABDUL HAMID": ["Seni Mempertahankan Diri", "Briged Bomba", "Kelab Kewangan dan Pengguna"],
};
const JAWATAN_KHAS: Record<string, string> = {
  "SHAFIZA HANUM BINTI ABDUL WAHAB": "KetuaUnitKoko",
  "RAFIDAH BINTI ABDUL RAZAK": "KetuaUnitKoko",
};

async function main() {
  // Jenis setiap unit dari jadual sedia ada (nama rasmi).
  const semua = await prisma.guruPenasihatKelab.findMany({ select: { namaUnit: true, jenisKoko: true } });
  const jenisUnit = new Map(semua.map((r) => [r.namaUnit, r.jenisKoko]));

  const pelan: { id: string; nama: string; jawatanLama: string; jawatanBaru: string; buang: string[]; unit: { namaUnit: string; jenisKoko: string }[] }[] = [];
  for (const [nama, units] of Object.entries(PEMANTAU)) {
    const g = await prisma.guru.findFirst({ where: { nama }, include: { penasihatKelab: true } });
    if (!g) throw new Error(`Guru tidak dijumpai: ${nama}`);
    const unit = units.map((u) => {
      const j = jenisUnit.get(u);
      if (!j) throw new Error(`Unit tidak dikenali: ${u}`);
      return { namaUnit: u, jenisKoko: j };
    });
    const buang = g.penasihatKelab.filter((p) => p.jenisKoko !== "Perkhidmatan").map((p) => `${p.namaUnit}(${p.peranan})`);
    pelan.push({ id: g.id, nama, jawatanLama: g.jawatanKoko, jawatanBaru: JAWATAN_KHAS[nama] ?? "GuruPemantau", buang, unit });
  }

  for (const p of pelan) {
    console.log(`${p.nama}\n   jawatan: ${p.jawatanLama} → ${p.jawatanBaru}\n   buang: ${p.buang.join(", ") || "-"}\n   pemantau: ${p.unit.map((u) => u.namaUnit).join(", ")}`);
  }
  if (!APPLY) { console.log("\nPERCUBAAN — tiada perubahan. Tambah --apply."); return; }

  const ids = pelan.map((p) => p.id);
  const fail = `../backup-sebelum-guru-pemantau-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(fail, JSON.stringify({
    guru: await prisma.guru.findMany({ where: { id: { in: ids } } }),
    guruPenasihatKelab: await prisma.guruPenasihatKelab.findMany({ where: { guruId: { in: ids } } }),
  }, null, 1));
  console.log(`Backup: ${fail}`);

  await prisma.$transaction(async (tx) => {
    for (const p of pelan) {
      await tx.guru.update({ where: { id: p.id }, data: { jawatanKoko: p.jawatanBaru } });
      await tx.guruPenasihatKelab.deleteMany({ where: { guruId: p.id, jenisKoko: { not: "Perkhidmatan" } } });
      await tx.guruPenasihatKelab.createMany({
        data: p.unit.map((u) => ({ guruId: p.id, namaUnit: u.namaUnit, jenisKoko: u.jenisKoko, peranan: "Pemantau" })),
      });
    }
  });
  console.log(`Selesai: ${pelan.length} guru dikemas kini.`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); }).finally(() => prisma.$disconnect());
