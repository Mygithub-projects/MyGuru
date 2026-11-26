// ===========================================================================
//  Import Borang Rumusan Markah (BRM) T6 Bawah 2026 untuk SATU unit sahaja,
//  tanpa menyentuh unit lain (berbeza dengan import-brm-t6b-2026.ts yang
//  mengosongkan semua). Format & peraturan sama dengan import asal:
//   - jawatanT6 ikut dokumen; markah dokumen yang beza disimpan "JAWATAN (n)".
//   - peringkatT6 = peringkat penglibatan.
//   - Sesi kehadiran 1..N (N = bilangan hadir tertinggi), semua disahkan.
//   - Pencapaian (markah > 0) & laporan projek, semua Approved.
//  Data unit lama (sesi, kehadiran, pencapaian, projek) dibuang dahulu supaya
//  boleh diulang jalan dengan BRM yang lebih terkini.
//
//  Jalankan: npx tsx scripts/import-brm-satu-unit.ts <data.json> [--apply]
//  Data: [{ bil, ting, namaDok, icDok, unit, hadir, jawatan, mJawatan,
//           pglbPeringkat, mPglb, pcpTahap, pcpBorang, mPcp, pjJawatan, pjJNama,
//           mPjJ, pjPeringkat, pjPNama, mPjP }]
// ===========================================================================
import { readFileSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";
import { prisma } from "../src/lib/prisma";
import { kiraSemulaKehadiran } from "../src/lib/kehadiran";
import {
  markahJawatanUnit, markahProjekJawatan, markahPenglibatan, normalizePeringkat, normalizeKedudukan,
} from "../src/lib/pajsk";

const KOHORT = "STPM 2027";
const SUMBER = "Import BRM T6 Bawah 2026";
const [dataPath] = process.argv.slice(2);
const APPLY = process.argv.includes("--apply");
const bersih = (s?: string | null) => (s ?? "").replace(/[￼ ]/g, " ").replace(/\s+/g, " ").trim();

interface Rec {
  bil: number; ting: string; namaDok: string; icDok: string; unit: string; hadir: number | null;
  jawatan: string; mJawatan: number | null; pglbPeringkat: string; mPglb: number | null;
  pcpTahap: string; pcpBorang: string; mPcp: number | null;
  pjJawatan: string; pjJNama: string; mPjJ: number | null; pjPeringkat: string; pjPNama: string; mPjP: number | null; jumlah?: number | null;
}

async function main() {
  const recs: Rec[] = JSON.parse(readFileSync(dataPath, "utf8"));
  const unitSet = new Set(recs.map((r) => bersih(r.unit).toUpperCase()));
  if (unitSet.size !== 1) throw new Error(`Fail mesti untuk satu unit sahaja: ${[...unitSet].join(", ")}`);

  // Nama rasmi unit & jenis dari GuruPenasihatKelab (padan tanpa kira huruf besar).
  const gpk = await prisma.guruPenasihatKelab.findMany({ select: { namaUnit: true, jenisKoko: true, guruId: true, peranan: true } });
  const padan = gpk.filter((g) => g.namaUnit.toUpperCase() === [...unitSet][0]);
  if (!padan.length) throw new Error(`Unit tidak dikenali: ${[...unitSet][0]}`);
  const unit = padan[0].namaUnit;
  const jenis = padan[0].jenisKoko;
  const guruId = (padan.find((g) => g.peranan === "KetuaPenasihat") ?? padan[0]).guruId;
  const nota: string[] = [];

  // Padan pelajar: IC dahulu, kemudian nama penuh.
  const pelan: (Rec & { pelajarId: string; namaDb: string })[] = [];
  for (const r of recs) {
    let p = await prisma.pelajar.findUnique({ where: { noIc: r.icDok }, select: { id: true, nama: true } });
    if (!p) {
      p = await prisma.pelajar.findFirst({ where: { nama: { equals: bersih(r.namaDok), mode: "insensitive" } }, select: { id: true, nama: true } });
      if (p) nota.push(`Padan ikut nama (IC dokumen ${r.icDok} tidak wujud): ${p.nama}`);
    }
    if (!p) { nota.push(`TIDAK DIJUMPAI, dilangkau: ${r.bil}. ${r.namaDok} ${r.icDok}`); continue; }
    pelan.push({ ...r, pelajarId: p.id, namaDb: p.nama });
  }

  // Pelajar yang sudah berada dalam bidang yang sama tetapi unit lain akan dipindah.
  for (const r of pelan) {
    const k = await prisma.kokurikulum.findUnique({ where: { pelajarId_jenisKoko: { pelajarId: r.pelajarId, jenisKoko: jenis } } });
    if (k?.namaUnitT6 && k.namaUnitT6 !== unit) nota.push(`Akan dipindah dari ${k.namaUnitT6} → ${unit}: ${r.namaDb}`);
  }
  const ahliDb = await prisma.kokurikulum.findMany({ where: { namaUnitT6: unit }, select: { pelajarId: true, pelajar: { select: { nama: true } } } });
  const dlmPelan = new Set(pelan.map((r) => r.pelajarId));
  for (const k of ahliDb) if (!dlmPelan.has(k.pelajarId)) nota.push(`Dalam sistem tetapi tiada dalam BRM (tag dikekalkan, tiada markah): ${k.pelajar.nama}`);

  const koko = pelan.map((r) => {
    const jw = bersih(r.jawatan).toUpperCase();
    const sistem = markahJawatanUnit(jw || null, jenis, true);
    const dok = r.mJawatan ?? (jw ? 0 : 2);
    const jawatanT6 = jw ? (dok !== sistem ? `${jw} (${dok})` : jw) : null;
    const prk = normalizePeringkat(bersih(r.pglbPeringkat));
    if ((r.mPglb ?? 0) !== markahPenglibatan(prk)) nota.push(`Penglibatan beza: ${r.namaDb} '${r.pglbPeringkat}' dok=${r.mPglb} sistem=${markahPenglibatan(prk)}`);
    return { r, jawatanT6, peringkatT6: prk === "Zon/Daerah" ? "Daerah" : prk };
  });
  const pencapaian = pelan.filter((r) => (r.mPcp ?? 0) > 0).map((r) => {
    const tahap = bersih(r.pcpTahap);
    const m = r.mPcp!;
    const prk = normalizePeringkat(tahap) ?? (m >= 9 ? "Kebangsaan" : m >= 7 ? "Negeri" : m >= 5 ? "Daerah" : "Sekolah");
    return {
      pelajarId: r.pelajarId, namaPencapaian: tahap || `Pencapaian ${unit}`, kategori: "biasa", namaUnit: unit,
      peringkat: prk, kedudukan: normalizeKedudukan(tahap), markah: m, statusSemakan: "Approved",
      komenGuru: `${SUMBER}${bersih(r.pcpBorang) ? ` (No. Borang ${bersih(r.pcpBorang)})` : ""}`,
    };
  });
  const projek = pelan
    .filter((r) => bersih(r.pjJawatan) || ((r.mPjP ?? 0) > 0 && bersih(r.pjPeringkat)))
    .map((r) => {
      const jw = bersih(r.pjJawatan).toUpperCase();
      const dokJ = r.mPjJ ?? 0;
      const prkTeks = bersih(r.pjPeringkat).toUpperCase();
      return {
        namaProjek: bersih(r.pjJNama) || bersih(r.pjPNama) || `Projek ${unit}`, jenisKoko: jenis, namaUnit: unit,
        jawatanProjek: jw ? (markahProjekJawatan(jw) !== dokJ ? `${jw} (${dokJ})` : jw) : null,
        peringkatProjek: (r.mPjP ?? 0) > 0 ? (/KOMUNITI/.test(prkTeks) ? "Daerah/Komuniti" : prkTeks === "SEKOLAH" ? "Sekolah" : bersih(r.pjPeringkat)) : null,
        setiausahaId: r.pelajarId, statusPengesahan: "Approved", laporan: SUMBER, disahkanOleh: SUMBER, tarikhSahkan: new Date(),
      };
    });
  const n = Math.max(0, ...pelan.map((r) => Math.round(r.hadir ?? 0)));

  console.log(`Unit: ${unit} (${jenis}) | Pelajar: ${pelan.length}/${recs.length} | Sesi: ${n}`);
  console.log(`Jawatan ikut markah dokumen (kurungan): ${koko.filter((k) => k.jawatanT6?.includes("(")).length} | Pencapaian: ${pencapaian.length} | Projek: ${projek.length}`);
  for (const { r, jawatanT6, peringkatT6 } of koko)
    console.log(`  ${r.namaDb.padEnd(44)} hadir ${String(Math.round(r.hadir ?? 0)).padStart(2)} | ${jawatanT6 ?? "-"} | ${peringkatT6 ?? "-"} | pcp ${r.mPcp ?? 0} | BRM ${Number(r.jumlah ?? 0).toFixed(2)}`);
  nota.forEach((x) => console.log("  •", x));
  if (!APPLY) { console.log("\nDRY RUN — tiada perubahan. Tambah --apply untuk laksana."); return; }

  // Backup data unit ini sahaja.
  const ids = pelan.map((r) => r.pelajarId);
  const backup = {
    pelajar: await prisma.pelajar.findMany({ where: { id: { in: ids } } }),
    kokurikulum: await prisma.kokurikulum.findMany({ where: { OR: [{ namaUnitT6: unit }, { pelajarId: { in: ids }, jenisKoko: jenis }] } }),
    sesiKehadiran: await prisma.sesiKehadiran.findMany({ where: { namaUnit: unit } }),
    kehadiran: await prisma.kehadiran.findMany({ where: { namaUnit: unit } }),
    pencapaian: await prisma.pencapaian.findMany({ where: { namaUnit: unit } }),
    laporanProjek: await prisma.laporanProjek.findMany({ where: { namaUnit: unit } }),
  };
  const fail = `../backup-sebelum-brm-${unit.replace(/\W+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(fail, JSON.stringify(backup));
  console.log(`Backup: ${fail}`);

  const kini = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.kehadiran.deleteMany({ where: { namaUnit: unit } });
    await tx.sesiKehadiran.deleteMany({ where: { namaUnit: unit } });
    await tx.pencapaian.deleteMany({ where: { namaUnit: unit, komenGuru: { startsWith: SUMBER } } });
    await tx.laporanProjek.deleteMany({ where: { namaUnit: unit, laporan: SUMBER } });
    for (const { r, jawatanT6, peringkatT6 } of koko) {
      const data = { namaUnitT6: unit, jawatanT6, peringkatT6, guruLulusId: guruId, statusPertukaran: "None", tarikhKemaskini: kini };
      await tx.kokurikulum.upsert({
        where: { pelajarId_jenisKoko: { pelajarId: r.pelajarId, jenisKoko: jenis } },
        update: data,
        create: { pelajarId: r.pelajarId, jenisKoko: jenis, ...data },
      });
    }
    const akhir = new Date("2026-11-20T02:00:00Z").getTime();
    for (let bil = 1; bil <= n; bil++) {
      const tarikh = new Date(akhir - (n - bil) * 7 * 86400000);
      const sesi = await tx.sesiKehadiran.create({
        data: { kohort: KOHORT, jenisKoko: jenis, namaUnit: unit, tarikh, bilPerjumpaan: bil, token: randomBytes(16).toString("hex"), dibuka: false, disahkan: true, guruId },
      });
      await tx.kehadiran.createMany({
        data: pelan.map((r) => ({ pelajarId: r.pelajarId, jenisKoko: jenis, namaUnit: unit, tarikh, bilPerjumpaan: bil, statusHadir: bil <= Math.round(r.hadir ?? 0), disahkan: true, sesiId: sesi.id })),
      });
    }
    await tx.pencapaian.createMany({ data: pencapaian });
    await tx.laporanProjek.createMany({ data: projek });
  }, { timeout: 300000, maxWait: 20000 });

  for (const id of ids) await kiraSemulaKehadiran(id);
  console.log(`Selesai. Markah dikira semula untuk ${ids.length} pelajar.`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); }).finally(() => prisma.$disconnect());
