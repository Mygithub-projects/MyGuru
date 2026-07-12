// ===========================================================================
//  Seed dari DUMM PAJSK.xlsx — jadikan fail PAJSK sumber data pelajar.
//  Jalankan: npx tsx scripts/seed-pajsk.ts
//  - 277 pelajar dari DUMM PAJSK.xlsx (unit/jawatan/peringkat/markah = T6 semasa)
//  - Demografi (kelas, jantina, kaum, agama) diperkaya dari namelist.xlsx (padan IC)
//  - T5 = salinan baseline T6 supaya jadual perbandingan berisi
//  - Kekalkan: guru, admin, tetapan. Padam: pelajar sedia ada + rekod berkaitan.
// ===========================================================================
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";
import { loadWorkbookFromFile, parsePajskWorksheet, parseNamelistWorksheet } from "../src/lib/import";
import { kiraSemulaT6 } from "../src/lib/workflow";

const DATA_DIR = path.resolve(process.cwd(), "..");
const FILE_PAJSK = path.join(DATA_DIR, "DUMM PAJSK.xlsx");
const FILE_NAMELIST = path.join(DATA_DIR, "namelist.xlsx");
const PW = process.env.DEFAULT_SEED_PASSWORD || "ekoko2026";

async function padamPelajar() {
  await prisma.notifikasi.deleteMany({});
  await prisma.cadanganAgent.deleteMany({});
  await prisma.cadanganJawatan.deleteMany({});
  await prisma.kehadiran.deleteMany({});
  await prisma.sesiKehadiran.deleteMany({});
  await prisma.laporanMingguan.deleteMany({});
  await prisma.laporanProjek.deleteMany({});
  await prisma.logPertukaran.deleteMany({});
  await prisma.pencapaian.deleteMany({});
  await prisma.aktivitiLuar.deleteMany({});
  await prisma.kokurikulum.deleteMany({});
  await prisma.user.deleteMany({ where: { role: "Pelajar" } });
  const del = await prisma.pelajar.deleteMany({});
  console.log(`  Padam ${del.count} pelajar sedia ada + rekod berkaitan`);
}

/** SU jika Setiausaha (bukan Naib/Penolong); NSU jika Naib/Penolong Setiausaha. */
function subRoleDari(jawatanList: string[]): "SU" | "NSU" | null {
  const up = jawatanList.map((j) => j.toUpperCase());
  if (up.some((j) => /NAIB SETIAUSAHA|PENOLONG SETIAUSAHA/.test(j))) return "NSU";
  if (up.some((j) => /SETIAUSAHA/.test(j))) return "SU";
  return null;
}

async function main() {
  console.log("Seeding pelajar dari DUMM PAJSK.xlsx ...");

  // Demografi dari namelist (padan ikut IC) — pilihan
  const demoByIc = new Map<string, { kelas: string; jantina: string; kaum: string; agama: string }>();
  try {
    const wbN = await loadWorkbookFromFile(FILE_NAMELIST);
    for (const r of parseNamelistWorksheet(wbN.worksheets[0])) {
      if (/^\d{12}$/.test(r.noIc)) demoByIc.set(r.noIc, { kelas: r.kelas, jantina: r.jantina, kaum: r.kaum, agama: r.agama });
    }
    console.log(`  Demografi namelist: ${demoByIc.size} rekod`);
  } catch {
    console.log("  namelist.xlsx tiada — demografi dilangkau");
  }

  const wb = await loadWorkbookFromFile(FILE_PAJSK);
  const rows = parsePajskWorksheet(wb.worksheets[0]);
  const valid = rows.filter((r) => /^\d{12}$/.test(r.noIc));

  await padamPelajar();
  const passwordHash = await hashPassword(PW);
  let ok = 0;

  for (const r of valid) {
    const demo = demoByIc.get(r.noIc);
    const pelajar = await prisma.pelajar.create({
      data: {
        nama: r.nama,
        noIc: r.noIc,
        kelasT6: demo?.kelas || null,
        jantina: demo?.jantina || null,
        kaum: demo?.kaum || null,
        agama: demo?.agama || null,
        komitmen: r.komitmen ?? 0,
        khidmatSumbangan: r.khidmatSumbangan ?? 0,
        markahKehadiran: r.markahKehadiran ?? 0,
        markahEkstra: 0,
        markahPajskT6: 0,
        peratusPajskT6: 0,
      },
    });

    // Unit T6 (semasa) = data fail; T5 = salinan baseline
    for (const k of r.koko) {
      await prisma.kokurikulum.create({
        data: {
          pelajarId: pelajar.id,
          jenisKoko: k.jenisKoko,
          statusPertukaran: "None",
          namaUnitT6: k.namaUnit,
          jawatanT6: k.jawatan,
          peringkatT6: k.peringkat,
          markahJawatanT6: k.markahJawatan,
          markahPeringkatT6: k.markahPeringkat,
          namaUnitT5: k.namaUnit,
          jawatanT5: k.jawatan,
          peringkatT5: k.peringkat,
          markahJawatanT5: k.markahJawatan,
          markahPeringkatT5: k.markahPeringkat,
        },
      });
    }

    // Sub-peranan ikut jawatan yang direkod
    const sr = subRoleDari(r.koko.map((k) => k.jawatan));
    if (sr) await prisma.pelajar.update({ where: { id: pelajar.id }, data: { subRole: sr } });

    // Pencapaian ekstra (disahkan)
    for (const e of r.ekstra) {
      await prisma.pencapaian.create({
        data: { pelajarId: pelajar.id, namaPencapaian: e, kategori: "ekstra", statusSemakan: "Approved", markah: 0 },
      });
    }

    // Kira markah PAJSK T6, kemudian tetapkan T5 = baseline sama
    const skor = await kiraSemulaT6(pelajar.id);
    const t6 = skor?.jumlahTeras ?? 0;
    const pct6 = skor?.peratus ?? 0;
    await prisma.pelajar.update({
      where: { id: pelajar.id },
      data: { markahPajskT5: t6, peratusPajskT5: pct6 },
    });

    await prisma.user.create({
      data: { username: r.noIc, passwordHash, role: "Pelajar", pelajarId: pelajar.id, mustChangePw: false },
    });
    ok++;
  }

  const total = await prisma.pelajar.count();
  console.log(`Selesai ✓  ${ok}/${valid.length} pelajar dimuat dari DUMM PAJSK.xlsx (jumlah dalam DB: ${total}).`);
  console.log(`Log masuk pelajar: No. IC, kata laluan ${PW}.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
