// ===========================================================================
//  Import ahli Unit Perkhidmatan 2027 dari senarai unit (umum, satu unit sekali).
//    npx tsx scripts/import-perkhidmatan-2027.ts <peta> <fail-data.json>           (percubaan)
//    npx tsx scripts/import-perkhidmatan-2027.ts <peta> <fail-data.json> --tulis   (tulis)
//  Data: [{ bil, nama, kelas, ic, jawatan }]. Padan pelajar ikut No. IC; baris
//  tanpa padanan dilangkau & dilaporkan. Pelajar yang sudah ada tag unit sama
//  dibiarkan. Pelajar.subRole TIDAK diubah. Peta jawatan = keputusan pengguna
//  2026-11-26 (lihat PETA di bawah).
// ===========================================================================
import { readFileSync, writeFileSync } from "fs";
import { prisma } from "../src/lib/prisma";
import { nilaiEkstra } from "../src/lib/pajsk";
import { kiraSemulaT6 } from "../src/lib/workflow";

type Peta = { unit: string; jawatan: (j: string) => string };
const PETA: Record<string, Peta> = {
  "sidang-redaksi": {
    unit: "Unit Sidang Redaksi",
    jawatan: (t) =>
      t === "PENGERUSI" ? "Pengerusi Badan Perkhidmatan"
      : t.startsWith("NAIB ") ? "AJK Utama"
      : t === "SETIAUSAHA" ? "Setiausaha"
      : t === "BENDAHARI" ? "Bendahari"
      : t.startsWith("KETUA BIRO") ? "Ketua Biro"
      : t.startsWith("AHLI") ? "AJK Kecil Biro"
      : "",
  },
  // Senarai tulisan tangan; biro tiada ketua bertanda → ahli biro = AJK Kecil Biro.
  "kuarter-master": {
    unit: "Unit Pengurusan Sukan / Kuarter Master",
    jawatan: (t) =>
      t === "PENGERUSI" ? "Pengerusi Badan Perkhidmatan"
      : t.startsWith("NAIB ") ? "AJK Utama"
      : t === "SETIAUSAHA" ? "Setiausaha"
      : t === "BENDAHARI" ? "Bendahari"
      : t.startsWith("AJK") || t.startsWith("AHLI") ? "AJK Kecil Biro"
      : "",
  },
  koperator: {
    unit: "Koperator Koperasi",
    jawatan: (t) =>
      t === "PENGERUSI" ? "Pengerusi Badan Perkhidmatan"
      : ["NAIB PENGERUSI", "SETIAUSAHA", "NAIB SETIAUSAHA", "BENDAHARI", "NAIB BENDAHARI"].includes(t) ? "Ahli Lembaga Pengarah Koperasi"
      : t === "AJK" ? "Pengawas Koperasi"
      : "",
  },
  "pusat-sumber": {
    unit: "Unit Pusat Sumber",
    jawatan: (t) => (t === "PENGERUSI" ? "Pengerusi Badan Perkhidmatan" : "Pengawas Pusat Sumber"),
  },
};

async function main() {
  const [kunci, fail] = process.argv.slice(2);
  const peta = PETA[kunci];
  if (!peta || !fail) throw new Error(`Guna: <${Object.keys(PETA).join("|")}> <fail.json> [--tulis]`);
  const TULIS = process.argv.includes("--tulis");
  const rows: { bil: number; nama: string; kelas: string; ic: string; jawatan: string }[] = JSON.parse(readFileSync(fail, "utf8"));

  const penasihat =
    (await prisma.guruPenasihatKelab.findFirst({ where: { namaUnit: peta.unit, peranan: "KetuaPenasihat" }, select: { guruId: true, guru: { select: { nama: true } } } })) ??
    (await prisma.guruPenasihatKelab.findFirst({ where: { namaUnit: peta.unit }, select: { guruId: true, guru: { select: { nama: true } } } }));
  if (!penasihat) throw new Error(`Tiada penasihat untuk ${peta.unit}`);
  console.log(`Unit: ${peta.unit} | Guru lulus: ${penasihat.guru.nama}\n`);

  const rancang: { pelajarId: string; nama: string; asal: string; jawatan: string; markah: number }[] = [];
  const langkau: string[] = [];
  for (const r of rows) {
    const p = await prisma.pelajar.findUnique({
      where: { noIc: r.ic },
      select: { id: true, nama: true, kokurikulum: { where: { jenisKoko: "Perkhidmatan" } } },
    });
    if (!p) { langkau.push(`${r.bil}. ${r.nama} (${r.kelas}, ${r.ic}) — tiada dalam sistem`); continue; }
    const ada = p.kokurikulum[0];
    if (ada) { langkau.push(`${r.bil}. ${p.nama} — sudah dalam ${ada.namaUnitT6} (${ada.jawatanT6})`); continue; }
    const jawatan = peta.jawatan(r.jawatan.toUpperCase().trim());
    if (!jawatan) throw new Error(`Jawatan tidak dikenali: ${r.jawatan} (${r.nama})`);
    rancang.push({ pelajarId: p.id, nama: p.nama, asal: r.jawatan, jawatan, markah: nilaiEkstra(jawatan) });
  }
  for (const x of rancang) console.log(`${x.nama.padEnd(46)} ${x.asal.padEnd(32)} → ${x.jawatan} (${x.markah})`);
  if (langkau.length) console.log(`\nDilangkau:\n  ${langkau.join("\n  ")}`);
  if (!TULIS) return console.log(`\n${rancang.length} akan ditambah. Larian percubaan sahaja; guna --tulis untuk simpan.`);

  writeFileSync(`../backup-sebelum-import-${kunci}-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(await prisma.pelajar.findMany({ where: { id: { in: rancang.map((x) => x.pelajarId) } } }), null, 1));
  for (const x of rancang) {
    await prisma.kokurikulum.create({
      data: { pelajarId: x.pelajarId, jenisKoko: "Perkhidmatan", namaUnitT6: peta.unit, jawatanT6: x.jawatan,
        markahJawatanT6: x.markah, markahPeringkatT6: 0, guruLulusId: penasihat.guruId },
    });
    await kiraSemulaT6(x.pelajarId);
  }
  console.log(`\nSelesai: ${rancang.length} pelajar ditambah ke ${peta.unit}.`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); }).finally(() => prisma.$disconnect());
