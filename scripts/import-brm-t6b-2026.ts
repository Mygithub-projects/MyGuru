// ===========================================================================
//  Import Borang Rumusan Markah (BRM) T6 Bawah 2026 — kohort STPM 2027.
//  1) Backup jadual berkaitan ke JSON.  2) Kosongkan markah & pengisian pelajar.
//  3) Tag unit + jawatan + penglibatan + kehadiran + pencapaian + projek ikut
//     dokumen, semua DISAHKAN terus.  4) Kira semula markah setiap pelajar.
//  Markah dokumen yang berbeza dari jadual sistem disimpan sebagai
//  "JAWATAN (n)" — format sedia ada yang dihormati markahJawatan/markahProjekJawatan.
//
//  Jalankan:  npx tsx scripts/import-brm-t6b-2026.ts <data.json> <backup.json> [--apply]
//  Tanpa --apply = dry run (tiada perubahan).
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
const [dataPath, backupPath] = process.argv.slice(2);
const APPLY = process.argv.includes("--apply");

interface Rec {
  fail: string; jenis: string; unit: string; pelajarId: string; namaDb: string;
  hadir: number | null; jawatan: string; mJawatan: number | null;
  pglbPeringkat: string; mPglb: number | null; pcpTahap: string; pcpBorang: string; mPcp: number | null;
  pjJawatan: string; pjJNama: string; mPjJ: number | null; pjPeringkat?: string; pjPNama?: string; mPjP: number | null;
}

const bersih = (s?: string | null) => (s ?? "").replace(/[￼ ]/g, " ").replace(/\s+/g, " ").trim();

async function main() {
  const { recs } = JSON.parse(readFileSync(dataPath, "utf8")) as { recs: Rec[] };
  const nota: string[] = [];

  // Penasihat setiap unit (KetuaPenasihat diutamakan) — untuk guruLulus/pengesah.
  const gpk = await prisma.guruPenasihatKelab.findMany();
  const penasihat = new Map<string, string>();
  for (const g of gpk) if (!penasihat.has(g.namaUnit) || g.peranan === "KetuaPenasihat") penasihat.set(g.namaUnit, g.guruId);
  for (const u of new Set(recs.map((r) => r.unit))) if (!penasihat.has(u)) nota.push(`Tiada guru penasihat untuk unit ${u}`);

  // ---- Bina pelan ----------------------------------------------------------
  const sesiUnit = new Map<string, { jenis: string; n: number }>();
  for (const r of recs) {
    const s = sesiUnit.get(r.unit) ?? { jenis: r.jenis, n: 0 };
    s.n = Math.max(s.n, Math.round(r.hadir ?? 0));
    sesiUnit.set(r.unit, s);
  }
  const koko = recs.map((r) => {
    const jw = bersih(r.jawatan).toUpperCase();
    const sistem = markahJawatanUnit(jw || null, r.jenis, true);
    const dok = r.mJawatan ?? (jw ? 0 : 2);
    const jawatanT6 = jw ? (dok !== sistem ? `${jw} (${dok})` : jw) : null;
    if (!jw && r.mJawatan != null && r.mJawatan !== 2) nota.push(`Markah jawatan tanpa jawatan: ${r.namaDb} ${r.unit} dok=${r.mJawatan}`);
    const prk = normalizePeringkat(bersih(r.pglbPeringkat));
    if ((r.mPglb ?? 0) !== markahPenglibatan(prk)) nota.push(`Penglibatan beza: ${r.namaDb} ${r.unit} '${r.pglbPeringkat}' dok=${r.mPglb} sistem=${markahPenglibatan(prk)}`);
    return { r, jawatanT6, peringkatT6: prk === "Zon/Daerah" ? "Daerah" : prk };
  });
  const pencapaian = recs.filter((r) => (r.mPcp ?? 0) > 0).map((r) => {
    const tahap = bersih(r.pcpTahap);
    const m = r.mPcp!;
    const prk = normalizePeringkat(tahap) ?? (m >= 9 ? "Kebangsaan" : m >= 7 ? "Negeri" : m >= 5 ? "Daerah" : "Sekolah");
    return {
      pelajarId: r.pelajarId, namaPencapaian: tahap || `Pencapaian ${r.unit}`, kategori: "biasa", namaUnit: r.unit,
      peringkat: prk, kedudukan: normalizeKedudukan(tahap), markah: m, statusSemakan: "Approved",
      komenGuru: `${SUMBER}${bersih(r.pcpBorang) ? ` (No. Borang ${bersih(r.pcpBorang)})` : ""}`,
    };
  });
  for (const r of recs.filter((r) => bersih(r.pcpTahap) && !(r.mPcp ?? 0))) {
    nota.push(`Pencapaian tanpa markah (tidak diimport): ${r.namaDb} ${r.unit} '${r.pcpTahap}'`);
  }

  const projek = recs
    .filter((r) => bersih(r.pjJawatan) || ((r.mPjP ?? 0) > 0 && bersih(r.pjPeringkat)))
    .map((r) => {
      const jw = bersih(r.pjJawatan).toUpperCase();
      const dokJ = r.mPjJ ?? 0;
      const jawatanProjek = jw ? (markahProjekJawatan(jw) !== dokJ ? `${jw} (${dokJ})` : jw) : null;
      const prkTeks = bersih(r.pjPeringkat).toUpperCase();
      const peringkatProjek = (r.mPjP ?? 0) > 0
        ? (/KOMUNITI/.test(prkTeks) ? "Daerah/Komuniti" : prkTeks === "SEKOLAH" ? "Sekolah" : bersih(r.pjPeringkat))
        : null;
      if (peringkatProjek === "Sekolah" && r.mPjP !== 6) nota.push(`Projek peringkat beza: ${r.namaDb} ${r.unit} dok=${r.mPjP} sistem=6`);
      if (peringkatProjek && /KOMUNITI/.test(prkTeks) && r.mPjP !== 8) nota.push(`Projek peringkat beza: ${r.namaDb} ${r.unit} dok=${r.mPjP} sistem=8`);
      return {
        namaProjek: bersih(r.pjJNama) || bersih(r.pjPNama) || `Projek ${r.unit}`, jenisKoko: r.jenis, namaUnit: r.unit,
        jawatanProjek, peringkatProjek, setiausahaId: r.pelajarId, statusPengesahan: "Approved",
        laporan: SUMBER, disahkanOleh: SUMBER, tarikhSahkan: new Date(),
      };
    });

  console.log(`Rekod dokumen: ${recs.length} | pelajar: ${new Set(recs.map((r) => r.pelajarId)).size}`);
  console.log(`Sesi kehadiran per unit:`, Object.fromEntries([...sesiUnit].map(([u, s]) => [u, s.n])));
  console.log(`Kehadiran (baris): ${recs.reduce((a, r) => a + sesiUnit.get(r.unit)!.n, 0)} | hadir: ${recs.reduce((a, r) => a + Math.round(r.hadir ?? 0), 0)}`);
  console.log(`Jawatan ikut markah dokumen (kurungan): ${koko.filter((k) => k.jawatanT6?.includes("(")).length}`);
  console.log(`Pencapaian: ${pencapaian.length} | Laporan projek: ${projek.length} (jawatan kurungan: ${projek.filter((p) => p.jawatanProjek?.includes("(")).length})`);
  nota.forEach((n) => console.log("  •", n));
  if (!APPLY) { console.log("\nDRY RUN — tiada perubahan. Tambah --apply untuk laksana."); return; }
  if (!backupPath) throw new Error("Laluan backup diperlukan");

  // ---- 1. Backup -------------------------------------------------------------
  const backup: Record<string, unknown> = {};
  for (const m of ["pelajar", "kokurikulum", "kehadiran", "sesiKehadiran", "kehadiranGuru", "pencapaian", "aktivitiLuar",
    "laporanMingguan", "laporanProjek", "projek", "projekTag", "projekPeserta", "programKolej", "programKolejPeserta",
    "aktivitiUnit", "aktivitiUnitPeserta", "cadanganJawatan", "cadanganAgent", "logPertukaran"]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    backup[m] = await (prisma as any)[m].findMany();
  }
  writeFileSync(backupPath, JSON.stringify(backup));
  console.log(`Backup ditulis: ${backupPath}`);

  // ---- 2. Kosongkan + 3. Import (satu transaksi) ---------------------------
  const kini = new Date();
  const pengesahPelajar = new Map<string, string>();
  for (const r of recs) if (!pengesahPelajar.has(r.pelajarId) && penasihat.has(r.unit)) pengesahPelajar.set(r.pelajarId, penasihat.get(r.unit)!);

  await prisma.$transaction(async (tx) => {
    await tx.kehadiranGuru.deleteMany();
    await tx.kehadiran.deleteMany();
    await tx.laporanMingguan.deleteMany();
    await tx.projekPeserta.deleteMany();
    await tx.laporanProjek.deleteMany();
    await tx.projekTag.deleteMany();
    await tx.projek.deleteMany();
    await tx.sesiKehadiran.deleteMany();
    await tx.pencapaian.deleteMany();
    await tx.aktivitiLuar.deleteMany();
    await tx.aktivitiUnitPeserta.deleteMany();
    await tx.aktivitiUnit.deleteMany();
    await tx.programKolejPeserta.deleteMany();
    await tx.cadanganJawatan.deleteMany();
    await tx.cadanganAgent.deleteMany();
    await tx.logPertukaran.deleteMany();
    await tx.pelajar.updateMany({
      data: {
        markahPajskT6: null, peratusPajskT6: null, gredPajskT6: null, markahKehadiran: 0, markahPenglibatan: 0,
        markahPencapaian: 0, markahProjekJawatan: 0, markahProjekPeringkat: 0, markahEkstra: 0,
        statusButiran: "Approved", tarikhSahkan: kini,
      },
    });
    // Tag sedia ada dikekalkan & disahkan; jawatan/peringkat/markah dikosongkan.
    await tx.kokurikulum.updateMany({
      data: { jawatanT6: null, peringkatT6: null, markahJawatanT6: null, markahPeringkatT6: null, statusPertukaran: "None", tarikhKemaskini: kini },
    });
    const semuaKoko = await tx.kokurikulum.findMany({ select: { id: true, namaUnitT6: true, pelajarId: true } });
    for (const k of semuaKoko) {
      const g = k.namaUnitT6 ? penasihat.get(k.namaUnitT6) : undefined;
      if (g) await tx.kokurikulum.update({ where: { id: k.id }, data: { guruLulusId: g } });
      if (g && !pengesahPelajar.has(k.pelajarId)) pengesahPelajar.set(k.pelajarId, g);
    }
    for (const [pid, g] of pengesahPelajar) await tx.pelajar.update({ where: { id: pid }, data: { disahkanOlehId: g } });

    // Tag + jawatan + penglibatan ikut dokumen.
    for (const { r, jawatanT6, peringkatT6 } of koko) {
      const data = { namaUnitT6: r.unit, jawatanT6, peringkatT6, guruLulusId: penasihat.get(r.unit) ?? null, statusPertukaran: "None", tarikhKemaskini: kini };
      await tx.kokurikulum.upsert({
        where: { pelajarId_jenisKoko: { pelajarId: r.pelajarId, jenisKoko: r.jenis } },
        update: data,
        create: { pelajarId: r.pelajarId, jenisKoko: r.jenis, ...data },
      });
    }

    // Sesi + kehadiran (disahkan). Tarikh mingguan berakhir 20 Nov 2026.
    const akhir = new Date("2026-11-20T02:00:00Z").getTime();
    for (const [unit, s] of sesiUnit) {
      const ahli = recs.filter((r) => r.unit === unit);
      for (let bil = 1; bil <= s.n; bil++) {
        const tarikh = new Date(akhir - (s.n - bil) * 7 * 86400000);
        const sesi = await tx.sesiKehadiran.create({
          data: {
            kohort: KOHORT, jenisKoko: s.jenis, namaUnit: unit, tarikh, bilPerjumpaan: bil, token: randomBytes(16).toString("hex"),
            dibuka: false, disahkan: true, guruId: penasihat.get(unit) ?? null,
          },
        });
        await tx.kehadiran.createMany({
          data: ahli.map((r) => ({
            pelajarId: r.pelajarId, jenisKoko: s.jenis, namaUnit: unit, tarikh, bilPerjumpaan: bil,
            statusHadir: bil <= Math.round(r.hadir ?? 0), disahkan: true, sesiId: sesi.id,
          })),
        });
      }
    }
    await tx.pencapaian.createMany({ data: pencapaian });
    await tx.laporanProjek.createMany({ data: projek });
  }, { timeout: 900000, maxWait: 20000 });
  console.log("Kosongkan + import selesai. Kira semula markah ...");

  // ---- 4. Kira semula --------------------------------------------------------
  const semua = await prisma.pelajar.findMany({ select: { id: true } });
  for (const p of semua) await kiraSemulaKehadiran(p.id);
  console.log(`Markah dikira semula untuk ${semua.length} pelajar.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
