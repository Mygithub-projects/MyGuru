// ===========================================================================
//  Import ahli Unit Sidang Redaksi 2027 (25 pelajar) dari Excel Unit Perkhidmatan.
//  Data: ../data-sidang-redaksi-2027.json. Jalankan:
//    npx tsx scripts/import-perkhidmatan-sidang-redaksi-2027.ts         (larian percubaan)
//    npx tsx scripts/import-perkhidmatan-sidang-redaksi-2027.ts --tulis (tulis ke DB)
//  Padanan jawatan (keputusan pengguna 2026-11-26): Sidang Redaksi = badan perkhidmatan.
// ===========================================================================
import { readFileSync, writeFileSync } from "fs";
import { prisma } from "../src/lib/prisma";
import { nilaiEkstra } from "../src/lib/pajsk";
import { kiraSemulaT6 } from "../src/lib/workflow";

const UNIT = "Unit Sidang Redaksi";
const TULIS = process.argv.includes("--tulis");

function padanJawatan(j: string): string {
  const t = j.toUpperCase().trim();
  if (t === "PENGERUSI") return "Pengerusi Badan Perkhidmatan";
  if (t.startsWith("NAIB PENGERUSI")) return "Naib Pengerusi Badan Perkhidmatan";
  if (t.startsWith("NAIB ")) return "AJK Utama";
  if (t === "SETIAUSAHA") return "Setiausaha";
  if (t === "BENDAHARI") return "Bendahari";
  if (t.startsWith("KETUA BIRO")) return "Ketua Biro";
  if (t.startsWith("AHLI")) return "AJK Kecil Biro";
  throw new Error(`Jawatan tidak dikenali: ${j}`);
}

async function main() {
  const rows: { bil: number; nama: string; kelas: string; ic: string; jawatan: string }[] =
    JSON.parse(readFileSync("../data-sidang-redaksi-2027.json", "utf8"));
  const penasihat = await prisma.guruPenasihatKelab.findFirst({
    where: { namaUnit: UNIT, peranan: "KetuaPenasihat" }, select: { guruId: true, guru: { select: { nama: true } } },
  });
  if (!penasihat) throw new Error("Ketua penasihat Sidang Redaksi tiada");
  console.log("Guru lulus:", penasihat.guru.nama);

  const rancang = [];
  for (const r of rows) {
    const p = await prisma.pelajar.findUnique({
      where: { noIc: r.ic },
      select: { id: true, nama: true, subRole: true, kokurikulum: { where: { jenisKoko: "Perkhidmatan" } } },
    });
    if (!p) throw new Error(`Pelajar tiada: ${r.nama} ${r.ic}`);
    if (p.kokurikulum.length) throw new Error(`${p.nama} sudah ada unit perkhidmatan: ${p.kokurikulum[0].namaUnitT6}`);
    const jawatan = padanJawatan(r.jawatan);
    rancang.push({ pelajarId: p.id, nama: p.nama, asal: r.jawatan, jawatan, markah: nilaiEkstra(jawatan), subRole: p.subRole });
  }
  for (const x of rancang) console.log(`${x.nama.padEnd(46)} ${x.asal.padEnd(28)} → ${x.jawatan} (${x.markah})  subRole=${x.subRole}`);
  if (!TULIS) return console.log("\nLarian percubaan sahaja. Guna --tulis untuk simpan.");

  writeFileSync(`../backup-sebelum-import-sidang-redaksi-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(await prisma.pelajar.findMany({ where: { id: { in: rancang.map((x) => x.pelajarId) } } }), null, 1));
  for (const x of rancang) {
    await prisma.kokurikulum.create({
      data: { pelajarId: x.pelajarId, jenisKoko: "Perkhidmatan", namaUnitT6: UNIT, jawatanT6: x.jawatan,
        markahJawatanT6: x.markah, markahPeringkatT6: 0, guruLulusId: penasihat.guruId },
    });
    await kiraSemulaT6(x.pelajarId);
  }
  console.log(`\nSelesai: ${rancang.length} pelajar ditambah ke ${UNIT}.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
