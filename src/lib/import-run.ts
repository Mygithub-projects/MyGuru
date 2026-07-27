// ===========================================================================
//  Pelaksana import — guna parser (import.ts) + tulis ke DB. Dikongsi oleh
//  endpoint Admin (muat naik UI). Mengembalikan ringkasan + senarai ralat.
// ===========================================================================
import type ExcelJS from "exceljs";
import { prisma } from "./prisma";
import { hashPassword } from "./auth";
import { parsePajskWorksheet, parseGuruWorksheet, type PajskRow, type PelajarBaruRow } from "./import";
import { mapJawatanGuru } from "./jawatan-map";
import { kiraSkor, markahJawatan, markahPenglibatan, bidangDariJenisKoko, buangKurungan } from "./pajsk";
import { syncPenasihatKelab, penasihatDariMedanLama } from "./workflow";

const DEFAULT_PW = process.env.DEFAULT_SEED_PASSWORD || "ekoko2026";

export interface HasilImport {
  jumlah: number;
  berjaya: number;
  ralat: string[];
  pelajarIds?: string[]; // id pelajar yang disentuh (untuk recalc §6)
}

export function jalankanImportPajsk(wb: ExcelJS.Workbook): Promise<HasilImport> {
  return applyPajskRows(parsePajskWorksheet(wb.worksheets[0]));
}

/** Tulis baris PAJSK yang telah diparse ke DB. Dikongsi oleh import terus &
 *  pengesahan import berperingkat (§6). */
export async function applyPajskRows(rows: PajskRow[]): Promise<HasilImport> {
  const ralat: string[] = [];
  const pelajarIds: string[] = [];
  let berjaya = 0;

  for (const r of rows) {
    if (r.ralat.length) ralat.push(`${r.nama || "?"}: ${r.ralat.join("; ")}`);
    if (!/^\d{12}$/.test(r.noIc)) continue;

    // Seed T6 = salinan T5 (anggaran awal). Komponen model baharu (§1.1) dikira
    // daripada data koko import; markah pencapaian/projek/ekstra dibiar 0 sehingga
    // guru sahkan / skrip recalc dijalankan.
    const markahJwt = r.koko.reduce(
      (m, k) => Math.max(m, markahJawatan(k.jawatan, bidangDariJenisKoko(k.jenisKoko))),
      0
    );
    const markahPglb = r.koko.reduce((m, k) => Math.max(m, markahPenglibatan(k.peringkat)), 0);
    const skor = kiraSkor({
      markahKehadiran: r.markahKehadiran,
      markahJawatan: markahJwt,
      markahPenglibatan: markahPglb,
    });

    const pelajar = await prisma.pelajar.upsert({
      where: { noIc: r.noIc },
      update: {
        nama: r.nama,
        komitmen: r.komitmen,
        khidmatSumbangan: r.khidmatSumbangan,
        markahKehadiran: r.markahKehadiran,
        markahPenglibatan: skor.penglibatan,
        markahPajskT6: skor.jumlahTeras,
        peratusPajskT6: skor.peratus,
        gredPajskT6: skor.gred,
      },
      create: {
        nama: r.nama,
        noIc: r.noIc,
        kelasT6: "T6 (Sesi 2026)",
        markahPajskT6: skor.jumlahTeras,
        peratusPajskT6: skor.peratus,
        gredPajskT6: skor.gred,
        komitmen: r.komitmen,
        khidmatSumbangan: r.khidmatSumbangan,
        markahKehadiran: r.markahKehadiran,
        markahPenglibatan: skor.penglibatan,
      },
    });

    for (const k of r.koko) {
      await prisma.kokurikulum.upsert({
        where: { pelajarId_jenisKoko: { pelajarId: pelajar.id, jenisKoko: k.jenisKoko } },
        update: {},
        create: {
          pelajarId: pelajar.id,
          jenisKoko: k.jenisKoko,
          namaUnitT5: k.namaUnit,
          jawatanT5: k.jawatan,
          peringkatT5: k.peringkat,
          markahJawatanT5: k.markahJawatan,
          markahPeringkatT5: k.markahPeringkat,
          namaUnitT6: k.namaUnit,
          jawatanT6: k.jawatan,
          peringkatT6: k.peringkat,
          markahJawatanT6: k.markahJawatan,
          markahPeringkatT6: k.markahPeringkat,
        },
      });
    }

    // Akaun login — username = No. IC, kata laluan awal = No. IC (dipaksa tukar).
    const passwordHash = await hashPassword(r.noIc);
    await prisma.user.upsert({
      where: { username: r.noIc },
      update: { pelajarId: pelajar.id },
      create: { username: r.noIc, passwordHash, role: "Pelajar", pelajarId: pelajar.id, mustChangePw: true },
    });
    pelajarIds.push(pelajar.id);
    berjaya++;
  }
  return { jumlah: rows.length, berjaya, ralat, pelajarIds };
}

// ---------------------------------------------------------------------------
//  Diff pratonton (§6) — bandingkan data import vs data sedia ada SEBELUM tulis.
// ---------------------------------------------------------------------------

export interface DiffBaris {
  noIc: string;
  nama: string;
  status: "baharu" | "berubah" | "sama";
  perubahan: string[];
}
export interface DiffHasil {
  jumlah: number;
  baharu: number;
  berubah: number;
  sama: number;
  tanpaIc: number;
  ralat: string[];
  baris: DiffBaris[]; // dihadkan untuk paparan
}

const samaTeks = (a?: string | null, b?: string | null) =>
  buangKurungan(a).toUpperCase() === buangKurungan(b).toUpperCase();

/** Kira ringkasan perbezaan antara baris import dengan rekod pelajar sedia ada. */
export async function diffPajsk(rows: PajskRow[]): Promise<DiffHasil> {
  const ralat: string[] = [];
  let baharu = 0;
  let berubah = 0;
  let sama = 0;
  let tanpaIc = 0;
  const baris: DiffBaris[] = [];
  const LABEL: Record<string, string> = { Kelab: "Kelab", Sukan: "Sukan", Uniform: "Badan Beruniform" };

  for (const r of rows) {
    if (r.ralat.length) ralat.push(`${r.nama || "?"}: ${r.ralat.join("; ")}`);
    if (!/^\d{12}$/.test(r.noIc)) {
      tanpaIc++;
      continue;
    }
    const sedia = await prisma.pelajar.findUnique({
      where: { noIc: r.noIc },
      include: { kokurikulum: true },
    });

    if (!sedia) {
      baharu++;
      const unitBaru = r.koko.map((k) => `${LABEL[k.jenisKoko] ?? k.jenisKoko}: ${k.namaUnit}`);
      baris.push({ noIc: r.noIc, nama: r.nama, status: "baharu", perubahan: unitBaru.slice(0, 4) });
      continue;
    }

    const perubahan: string[] = [];
    if (!samaTeks(sedia.nama, r.nama)) perubahan.push(`Nama: "${sedia.nama}" → "${r.nama}"`);
    for (const k of r.koko) {
      const kk = sedia.kokurikulum.find((x) => x.jenisKoko === k.jenisKoko);
      const label = LABEL[k.jenisKoko] ?? k.jenisKoko;
      if (!kk || !kk.namaUnitT6) {
        perubahan.push(`${label} (baharu): ${k.namaUnit}`);
      } else {
        if (!samaTeks(kk.namaUnitT6, k.namaUnit)) perubahan.push(`${label} unit: "${kk.namaUnitT6}" → "${k.namaUnit}"`);
        if (!samaTeks(kk.jawatanT6, k.jawatan)) perubahan.push(`${label} jawatan: "${kk.jawatanT6 ?? "-"}" → "${k.jawatan || "-"}"`);
      }
    }

    if (perubahan.length === 0) {
      sama++;
    } else {
      berubah++;
      baris.push({ noIc: r.noIc, nama: r.nama, status: "berubah", perubahan });
    }
  }

  return {
    jumlah: rows.length,
    baharu,
    berubah,
    sama,
    tanpaIc,
    ralat,
    // Papar semua yang baharu/berubah, had 200 supaya JSON tidak terlalu besar.
    baris: baris.slice(0, 200),
  };
}

// ---------------------------------------------------------------------------
//  Pelajar Baharu (tanpa unit) — pratonton diff + tulis DB.
// ---------------------------------------------------------------------------

/** Kira ringkasan perbezaan bagi import pelajar baharu (Nama/Kelas/No.IC
 *  sahaja — tiada unit/markah). Guna semula struktur DiffBaris/DiffHasil. */
export async function diffPelajarBaru(rows: PelajarBaruRow[]): Promise<DiffHasil> {
  const ralat: string[] = [];
  let baharu = 0;
  let berubah = 0;
  let sama = 0;
  let tanpaIc = 0;
  const baris: DiffBaris[] = [];

  for (const r of rows) {
    if (r.ralat.length) ralat.push(`${r.nama || "?"}: ${r.ralat.join("; ")}`);
    if (!/^\d{12}$/.test(r.noIc)) {
      tanpaIc++;
      continue;
    }
    const sedia = await prisma.pelajar.findUnique({ where: { noIc: r.noIc }, select: { nama: true, kelasT6: true } });

    if (!sedia) {
      baharu++;
      baris.push({ noIc: r.noIc, nama: r.nama, status: "baharu", perubahan: r.kelasT6 ? [`Kelas: ${r.kelasT6}`] : [] });
      continue;
    }

    const perubahan: string[] = [];
    if (!samaTeks(sedia.nama, r.nama)) perubahan.push(`Nama: "${sedia.nama}" → "${r.nama}"`);
    if (!samaTeks(sedia.kelasT6, r.kelasT6)) perubahan.push(`Kelas: "${sedia.kelasT6 ?? "-"}" → "${r.kelasT6 || "-"}"`);

    if (perubahan.length === 0) {
      sama++;
    } else {
      berubah++;
      baris.push({ noIc: r.noIc, nama: r.nama, status: "berubah", perubahan });
    }
  }

  return {
    jumlah: rows.length,
    baharu,
    berubah,
    sama,
    tanpaIc,
    ralat,
    baris: baris.slice(0, 200),
  };
}

/** Tulis baris pelajar baharu ke DB — cipta Pelajar + akaun User SAHAJA,
 *  TIADA rekod Kokurikulum dicipta. Pelajar log masuk kali pertama dengan
 *  No. IC sebagai username DAN kata laluan (mustChangePw dipaksa tukar),
 *  kemudian daftar unit sendiri. */
export async function applyPelajarBaruRows(rows: PelajarBaruRow[]): Promise<HasilImport> {
  const ralat: string[] = [];
  let berjaya = 0;

  for (const r of rows) {
    if (r.ralat.length) {
      ralat.push(`${r.nama || "?"}: ${r.ralat.join("; ")}`);
      continue; // baris bermasalah (nama kosong / IC tidak sah) — langkau, jangan cipta rekod pincang.
    }

    const pelajar = await prisma.pelajar.upsert({
      where: { noIc: r.noIc },
      update: { nama: r.nama, kelasT6: r.kelasT6 || undefined },
      create: { nama: r.nama, noIc: r.noIc, kelasT6: r.kelasT6 || null },
    });

    const passwordHash = await hashPassword(r.noIc);
    await prisma.user.upsert({
      where: { username: r.noIc },
      update: { pelajarId: pelajar.id },
      create: { username: r.noIc, passwordHash, role: "Pelajar", pelajarId: pelajar.id, mustChangePw: true },
    });
    berjaya++;
  }
  return { jumlah: rows.length, berjaya, ralat };
}

export async function jalankanImportGuru(wb: ExcelJS.Workbook): Promise<HasilImport> {
  const rows = parseGuruWorksheet(wb.worksheets[0]);
  const ralat: string[] = [];
  let berjaya = 0;

  for (const g of rows) {
    if (!g.email) {
      ralat.push(`${g.nama || "?"}: email kosong`);
      continue;
    }
    const guru = await prisma.guru.upsert({
      where: { email: g.email },
      update: {
        nama: g.nama,
        jawatanKoko: mapJawatanGuru(g.jawatan),
        kelabDiselia: g.kelab || null,
        sukanDiselia: g.sukan || null,
        badanDiselia: g.badan || null,
      },
      create: {
        nama: g.nama,
        noIc: g.noIc || `NA-${g.email}`,
        email: g.email,
        jawatanKoko: mapJawatanGuru(g.jawatan),
        kelabDiselia: g.kelab || null,
        sukanDiselia: g.sukan || null,
        badanDiselia: g.badan || null,
      },
    });
    // §3: sumber kebenaran skop akses = jadual pautan GuruPenasihatKelab.
    await syncPenasihatKelab(
      guru.id,
      penasihatDariMedanLama({ kelabDiselia: g.kelab, sukanDiselia: g.sukan, badanDiselia: g.badan })
    );
    // Akaun login guru — username & kata laluan awal = No. IC (dipaksa tukar);
    // jatuh balik ke emel + kata laluan lalai jika No. IC tidak sah.
    const icSah = /^\d{12}$/.test(guru.noIc);
    const username = icSah ? guru.noIc : g.email;
    const passwordHash = await hashPassword(icSah ? guru.noIc : DEFAULT_PW);
    const akaun = await prisma.user.findFirst({ where: { guruId: guru.id }, select: { id: true } });
    if (akaun) {
      await prisma.user.update({ where: { id: akaun.id }, data: { guruId: guru.id } });
    } else {
      await prisma.user.create({
        data: { username, email: g.email, passwordHash, role: "Guru", guruId: guru.id, mustChangePw: true },
      });
    }
    berjaya++;
  }
  return { jumlah: rows.length, berjaya, ralat };
}
