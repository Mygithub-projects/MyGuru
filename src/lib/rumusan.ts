// ===========================================================================
//  Borang Rumusan Markah Kokurikulum T6 — satu helaian setiap unit, ikut
//  format rasmi "22.1 Borang Rumusan Markah T6A" (Kelab/Sukan/Uniform: lajur
//  A–AA; Unit Perkhidmatan: format jawatan + anugerah khas).
//  Markah setiap baris ialah markah UNIT itu (kehadiran, jawatan, penglibatan,
//  pencapaian & projek unit tersebut), dikira oleh skorUnit() (skor-unit.ts).
//  Turut menyediakan analitik ringkas ikut bahagian / unit / kelas untuk Admin.
// ===========================================================================
import ExcelJS from "exceljs";
import { prisma } from "./prisma";
import { nilaiEkstra, type Gred } from "./pajsk";
import { skorUnit, type SkorUnit } from "./skor-unit";
import { jumlahAktiviti, jumlahKehadiranUntuk } from "./tetapan-kehadiran";

export const BAHAGIAN = ["Kelab", "Sukan", "Uniform", "Perkhidmatan"] as const;
export type Bahagian = (typeof BAHAGIAN)[number];

export const LABEL_BAHAGIAN: Record<Bahagian, string> = {
  Kelab: "KELAB / PERSATUAN",
  Sukan: "SUKAN / PERMAINAN",
  Uniform: "BADAN BERUNIFORM",
  Perkhidmatan: "UNIT PERKHIDMATAN",
};

export function isBahagian(v: unknown): v is Bahagian {
  return typeof v === "string" && (BAHAGIAN as readonly string[]).includes(v);
}

export interface BarisRumusan extends SkorUnit {
  nama: string;
  noIc: string;
  kelas: string;
  kohort: string;
  bahagian: Bahagian;
  // Unit Perkhidmatan sahaja
  anugerah: string;
  mAnugerah: number;
  mTertinggi: number;
}

export interface FilterRumusan {
  pelajarId?: string;
  units?: string[];
  bahagian?: Bahagian;
  kelas?: string;
  kohort?: string;
}

const terbaik = <T>(arr: T[], skor: (x: T) => number) =>
  arr.reduce<T | null>((m, x) => (m === null || skor(x) > skor(m) ? x : m), null);

/** Satu baris bagi setiap (pelajar, unit T6) yang padan dengan penapis. */
export async function dataRumusan(f: FilterRumusan = {}): Promise<BarisRumusan[]> {
  const whereKoko = {
    namaUnitT6: f.units ? { in: f.units } : { not: null },
    ...(f.bahagian ? { jenisKoko: f.bahagian } : {}),
  };
  const pelajar = await prisma.pelajar.findMany({
    where: {
      kokurikulum: { some: whereKoko },
      ...(f.pelajarId ? { id: f.pelajarId } : {}),
      ...(f.kelas ? { kelasT6: f.kelas } : {}),
      ...(f.kohort ? { kohort: f.kohort } : {}),
    },
    include: {
      kokurikulum: { where: whereKoko },
      kehadiran: { where: { statusHadir: true, disahkan: true }, select: { jenisKoko: true } },
      pencapaian: { where: { statusSemakan: "Approved" } },
      aktivitiLuar: { where: { statusPengesahan: "Approved" } },
      laporanProjek: { where: { statusPengesahan: "Approved" } },
    },
  });

  const jumlah = await jumlahAktiviti();
  const baris: BarisRumusan[] = [];
  for (const p of pelajar) {
    // Anugerah khas (ekstra) — dipaparkan dalam borang Unit Perkhidmatan.
    const ekstra = terbaik(
      p.pencapaian.filter((c) => c.kategori === "ekstra"),
      (c) => nilaiEkstra(c.namaPencapaian),
    );
    for (const k of p.kokurikulum) {
      if (!isBahagian(k.jenisKoko) || !k.namaUnitT6) continue;
      const s = skorUnit(p, k, jumlahKehadiranUntuk(jumlah, k.jenisKoko));
      const mAnugerah = ekstra ? nilaiEkstra(ekstra.namaPencapaian) : 0;
      baris.push({
        ...s,
        nama: p.nama,
        noIc: p.noIc,
        kelas: p.kelasT6?.trim() ?? "",
        kohort: p.kohort ?? "",
        bahagian: k.jenisKoko,
        anugerah: ekstra?.namaPencapaian ?? "",
        mAnugerah,
        mTertinggi: k.jenisKoko === "Perkhidmatan" ? Math.max(s.mJawatan, mAnugerah) : 0,
      });
    }
  }
  // "Susun ikut kelas" (arahan borang), kemudian nama.
  return baris.sort(
    (a, b) => a.kelas.localeCompare(b.kelas, "ms", { numeric: true }) || a.nama.localeCompare(b.nama, "ms"),
  );
}

/** Peta unit -> nama guru penasihat (untuk "NAMA GURU BERTANGGUNGJAWAB"). */
async function guruIkutUnit(units: string[]): Promise<Map<string, string[]>> {
  const rows = await prisma.guruPenasihatKelab.findMany({
    where: { namaUnit: { in: units } },
    select: { namaUnit: true, peranan: true, guru: { select: { nama: true } } },
    orderBy: { peranan: "asc" }, // KetuaPenasihat dahulu
  });
  const peta = new Map<string, string[]>();
  for (const r of rows) peta.set(r.namaUnit, [...(peta.get(r.namaUnit) ?? []), r.guru.nama]);
  return peta;
}

// ---------------------------------------------------------------------------
//  Analitik (Admin)
// ---------------------------------------------------------------------------

export interface StatKumpulan {
  nama: string;
  bahagian?: Bahagian;
  ahli: number;
  purata: number | null;
  gred: Record<Gred, number>;
  gps: number | null;
}

const GRED: Gred[] = ["A", "B", "C", "D", "E"];

// Gred Purata Sekolah (GPS): A=1 … E=5; GPS = Σ(bil gred × nilai) / jumlah bergred.
// Makin RENDAH makin baik (1.00 = semua A).
const NILAI_GPS: Record<Gred, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 };

export function kiraGps(gred: Record<Gred, number>): number | null {
  const n = GRED.reduce((s, g) => s + gred[g], 0);
  if (!n) return null;
  return Math.round((GRED.reduce((s, g) => s + gred[g] * NILAI_GPS[g], 0) / n) * 100) / 100;
}

function stat(nama: string, rows: BarisRumusan[], bahagian?: Bahagian): StatKumpulan {
  const bermarkah = rows.filter((r) => r.jumlah !== null);
  const g = Object.fromEntries(GRED.map((x) => [x, 0])) as Record<Gred, number>;
  for (const r of bermarkah) g[r.gred!]++;
  const purata = bermarkah.length
    ? Math.round((bermarkah.reduce((s, r) => s + r.jumlah!, 0) / bermarkah.length) * 100) / 100
    : null;
  return { nama, bahagian, ahli: rows.length, purata, gred: g, gps: kiraGps(g) };
}

function kumpul<K>(rows: BarisRumusan[], kunci: (r: BarisRumusan) => K): Map<K, BarisRumusan[]> {
  const m = new Map<K, BarisRumusan[]>();
  for (const r of rows) m.set(kunci(r), [...(m.get(kunci(r)) ?? []), r]);
  return m;
}

export function analitikRumusan(rows: BarisRumusan[]) {
  const ikutNama = (a: StatKumpulan, b: StatKumpulan) => a.nama.localeCompare(b.nama, "ms", { numeric: true });
  return {
    keseluruhan: stat("Keseluruhan", rows),
    bahagian: BAHAGIAN.map((b) => stat(LABEL_BAHAGIAN[b], rows.filter((r) => r.bahagian === b), b)),
    unit: [...kumpul(rows, (r) => `${r.bahagian}|${r.unit}`).values()]
      .map((rs) => stat(rs[0].unit, rs, rs[0].bahagian))
      .sort((a, b) => BAHAGIAN.indexOf(a.bahagian!) - BAHAGIAN.indexOf(b.bahagian!) || ikutNama(a, b)),
    kelas: [...kumpul(rows, (r) => r.kelas || "TIADA KELAS").entries()].map(([k, rs]) => stat(k, rs)).sort(ikutNama),
  };
}

/** GPS setiap kohort — keseluruhan + setiap bahagian (terkini dahulu). */
export function gpsIkutKohort(rows: BarisRumusan[]) {
  return [...kumpul(rows, (r) => r.kohort || "—").entries()]
    .map(([kohort, rs]) => ({
      kohort,
      pelajar: new Set(rs.map((r) => r.noIc)).size,
      keseluruhan: stat(kohort, rs),
      bahagian: BAHAGIAN.map((b) => stat(b, rs.filter((r) => r.bahagian === b), b)),
    }))
    .sort((a, b) => b.kohort.localeCompare(a.kohort, "ms", { numeric: true }));
}

/** Senarai kelas yang ada (untuk penapis Admin). */
export async function senaraiKelas(): Promise<string[]> {
  const rows = await prisma.pelajar.findMany({ distinct: ["kelasT6"], select: { kelasT6: true } });
  return rows
    .map((r) => r.kelasT6?.trim())
    .filter((k): k is string => !!k)
    .sort((a, b) => a.localeCompare(b, "ms", { numeric: true }));
}

// ---------------------------------------------------------------------------
//  Excel
// ---------------------------------------------------------------------------

type Nilai = string | number | null;
const INSTITUSI = (process.env.NEXT_PUBLIC_INSTITUSI || "KTE (Prauniversiti) Desa Mahkota").toUpperCase();
const SEMPADAN: Partial<ExcelJS.Borders> = {
  top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" },
};
const FONT = { name: "Arial", size: 9 };
const KEPALA = "FFF2F2F2";

// Nama tab Excel: maks 31 aksara, tiada \ / ? * [ ] : , dan mesti unik.
function namaTabUnik(nama: string, digunakan: Set<string>): string {
  const bersih = nama.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Unit";
  let hasil = bersih;
  let i = 2;
  while (digunakan.has(hasil.toLowerCase())) {
    const sufiks = ` (${i})`;
    hasil = bersih.slice(0, 31 - sufiks.length) + sufiks;
    i++;
  }
  digunakan.add(hasil.toLowerCase());
  return hasil;
}

/** Kepala borang (baris 1–4) — sama seperti borang rasmi. */
function kepalaBorang(ws: ExcelJS.Worksheet, lajurAkhir: number, bahagian: Bahagian, unit: string, guru: string[]) {
  const tahun = new Date().getFullYear();
  const baris: [string, number][] = [
    [INSTITUSI, 12],
    [`BORANG RUMUSAN MARKAH KOKURIKULUM T6 ATAS ${tahun}`, 11],
    [`NAMA ${LABEL_BAHAGIAN[bahagian]} : ${unit.toUpperCase()}`, 10],
    [`NAMA GURU BERTANGGUNGJAWAB : ${guru.join(", ").toUpperCase() || "-"}`, 10],
  ];
  baris.forEach(([teks, saiz], i) => {
    const c = ws.getCell(i + 1, 1);
    c.value = teks;
    c.font = { ...FONT, bold: true, size: saiz };
    if (i < 2) {
      ws.mergeCells(i + 1, 1, i + 1, lajurAkhir);
      c.alignment = { horizontal: "center" };
    }
  });
}

/** Tulis sel tajuk (baris 6–7) dengan cantuman & gaya. */
function tajuk(ws: ExcelJS.Worksheet, r1: number, c1: number, r2: number, c2: number, teks: string) {
  if (r1 !== r2 || c1 !== c2) ws.mergeCells(r1, c1, r2, c2);
  const c = ws.getCell(r1, c1);
  c.value = teks;
  c.font = { ...FONT, bold: true };
  c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: KEPALA } };
  for (let r = r1; r <= r2; r++) for (let k = c1; k <= c2; k++) ws.getCell(r, k).border = SEMPADAN;
}

function tulisBaris(ws: ExcelJS.Worksheet, mula: number, data: Nilai[][], lajurTeks: number[]) {
  data.forEach((nilai, i) => {
    nilai.forEach((v, j) => {
      const c = ws.getCell(mula + i, j + 1);
      c.value = v;
      c.font = FONT;
      c.border = SEMPADAN;
      c.alignment = { vertical: "middle", wrapText: true };
      if (lajurTeks.includes(j + 1)) c.numFmt = "@";
    });
  });
}

/** Helaian Kelab / Sukan / Badan Beruniform (lajur A–AA seperti borang rasmi). */
function helaianUnit(ws: ExcelJS.Worksheet, bahagian: Bahagian, unit: string, guru: string[], rows: BarisRumusan[]) {
  const maks = rows[0]?.jumlahAktiviti ?? 30; // jumlah aktiviti penuh bahagian (tetapan Admin)
  const lebar = [5, 9, 36, 16, 28, 9, 11, 8, 18, 7, 16, 7, 7, 18, 7, 7, 18, 7, 24, 7, 14, 7, 24, 7, 8, 7, 12];
  lebar.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  kepalaBorang(ws, 27, bahagian, unit, guru);

  const namaUnit = { Kelab: "Nama Kelab/Persatuan", Sukan: "Nama Sukan/Permainan", Uniform: "Nama Badan Beruniform", Perkhidmatan: "" }[bahagian];
  [
    [1, "Bil"], [2, "Ting (Susun ikut kelas)"], [3, "Nama Pelajar (Seperti dalam K/P)"],
    [4, "No. Kad Pengenalan"], [5, namaUnit], [25, "Jumlah"], [26, "GRED"], [27, "T. Tangan Ahli"],
  ].forEach(([c, t]) => tajuk(ws, 6, c as number, 7, c as number, t as string));
  tajuk(ws, 6, 6, 6, 8, "KEHADIRAN");
  tajuk(ws, 6, 9, 6, 10, "JAWATAN");
  tajuk(ws, 6, 11, 6, 13, "PENGLIBATAN");
  tajuk(ws, 6, 14, 6, 16, "PENCAPAIAN");
  tajuk(ws, 6, 17, 6, 24, "PROJEK");
  [
    `Bilangan Kali Hadir (max ${maks})`, "Bil Perjumpaan PAJSK gabungan KP+SP+BU (max 15)", "Markah",
    "Jawatan", "Markah",
    "Peringkat Sek/Zon/Negeri/Keb", "No. Borang", "Markah",
    "Peringkat Sek/Zon/Negeri/Keb", "No. Borang", "Markah",
    "Jawatan", "No. Borang", "NAMA PROJEK", "Markah",
    "Peringkat Sek / Daerah / Komuniti / Negeri", "No. Borang", "NAMA PROJEK", "Markah",
  ].forEach((t, i) => tajuk(ws, 7, 6 + i, 7, 6 + i, t));
  ws.getRow(7).height = 48;

  tulisBaris(
    ws,
    8,
    rows.map((r, i) => [
      i + 1, r.kelas, r.nama.toUpperCase(), r.noIc, r.unit.toUpperCase(),
      r.hadir, r.perjumpaan, r.mKehadiran,
      r.jawatan.toUpperCase(), r.mJawatan,
      r.peringkat.toUpperCase(), null, r.mPenglibatan,
      r.pcpTahap.toUpperCase(), null, r.pcpMarkah,
      r.pjJawatan.toUpperCase(), null, r.pjNamaJ.toUpperCase(), r.pjMJ,
      r.pjTahap, null, r.pjNamaP.toUpperCase(), r.pjMP,
      r.jumlah, r.gred, null,
    ]),
    [4],
  );
  ws.views = [{ state: "frozen", ySplit: 7, xSplit: 3 }];
}

/** Helaian Unit Perkhidmatan (jawatan + anugerah khas, ambil markah tertinggi). */
function helaianPerkhidmatan(ws: ExcelJS.Worksheet, unit: string, guru: string[], rows: BarisRumusan[]) {
  [6, 10, 28, 36, 16, 22, 8, 26, 8, 10, 12].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  kepalaBorang(ws, 11, "Perkhidmatan", unit, guru);
  [
    "BIL.", "TING. (Susun ikut kelas)", "NAMA BADAN", "NAMA AHLI", "No. Kad Pengenalan",
    "JAWATAN", "MARKAH", "ANUGERAH KHAS", "MARKAH", "MARKAH TERTINGGI", "T. Tangan Ahli",
  ].forEach((t, i) => tajuk(ws, 6, i + 1, 6, i + 1, t));
  ws.getRow(6).height = 30;
  tulisBaris(
    ws,
    7,
    rows.map((r, i) => [
      i + 1, r.kelas, r.unit.toUpperCase(), r.nama.toUpperCase(), r.noIc,
      r.jawatan.toUpperCase(), r.mJawatan, r.anugerah.toUpperCase(), r.mAnugerah, r.mTertinggi, null,
    ]),
    [5],
  );
  ws.views = [{ state: "frozen", ySplit: 6 }];
}

/** Helaian ringkasan analitik (Admin). */
function helaianRingkasan(ws: ExcelJS.Worksheet, rows: BarisRumusan[], penapis: string) {
  const a = analitikRumusan(rows);
  ws.columns = [
    { width: 34 }, { width: 20 }, { width: 10 }, { width: 10 },
    { width: 7 }, { width: 7 }, { width: 7 }, { width: 7 }, { width: 7 },
  ];
  ws.getCell(1, 1).value = "RUMUSAN MARKAH KOKURIKULUM T6";
  ws.getCell(1, 1).font = { ...FONT, bold: true, size: 12 };
  ws.getCell(2, 1).value = penapis;
  ws.getCell(2, 1).font = FONT;

  let r = 4;
  const seksyen = (judul: string, kolPertama: string, data: StatKumpulan[], denganBahagian: boolean) => {
    ws.getCell(r, 1).value = judul;
    ws.getCell(r, 1).font = { ...FONT, bold: true, size: 10 };
    r++;
    [kolPertama, denganBahagian ? "Bahagian" : "", "Bil Ahli", "Purata", ...GRED].forEach((t, i) => {
      if (t) tajuk(ws, r, i + 1, r, i + 1, t);
    });
    r++;
    tulisBaris(
      ws,
      r,
      data.map((s) => [
        s.nama, denganBahagian && s.bahagian ? LABEL_BAHAGIAN[s.bahagian] : null, s.ahli, s.purata,
        ...GRED.map((g) => (s.purata === null ? null : s.gred[g])),
      ]),
      [],
    );
    r += data.length + 2;
  };
  seksyen("IKUT BAHAGIAN", "Bahagian", [...a.bahagian, a.keseluruhan], false);
  seksyen("IKUT UNIT", "Unit", a.unit, true);
  seksyen("IKUT KELAS", "Kelas", a.kelas, false);
  ws.getCell(r, 1).value = "Unit Perkhidmatan ialah markah bonus (ekstra) — tidak dikira dalam purata & taburan gred.";
  ws.getCell(r, 1).font = { ...FONT, italic: true };
}

/**
 * Jana fail Excel Borang Rumusan: satu helaian setiap unit (ikut bahagian,
 * kemudian nama unit). `ringkasan` menambah helaian analitik di hadapan.
 */
export async function eksportBorangRumusan(f: FilterRumusan, opts: { ringkasan?: boolean } = {}): Promise<Buffer> {
  const rows = await dataRumusan(f);
  const ikutUnit = kumpul(rows, (r) => `${r.bahagian}|${r.unit}`);
  const guru = await guruIkutUnit([...new Set(rows.map((r) => r.unit))]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "EzKokoT6";
  const digunakan = new Set<string>();
  if (opts.ringkasan) {
    const penapis = [
      f.bahagian ? `Bahagian: ${LABEL_BAHAGIAN[f.bahagian]}` : "Semua bahagian",
      f.kelas ? `Kelas: ${f.kelas}` : "Semua kelas",
    ].join(" · ");
    helaianRingkasan(wb.addWorksheet(namaTabUnik("RINGKASAN", digunakan)), rows, penapis);
  }
  const kunci = [...ikutUnit.keys()].sort((a, b) => {
    const [ba, ua] = a.split("|");
    const [bb, ub] = b.split("|");
    return BAHAGIAN.indexOf(ba as Bahagian) - BAHAGIAN.indexOf(bb as Bahagian) || ua.localeCompare(ub, "ms");
  });
  for (const k of kunci) {
    const rs = ikutUnit.get(k)!;
    const { bahagian, unit } = rs[0];
    const ws = wb.addWorksheet(namaTabUnik(unit, digunakan), {
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
    });
    if (bahagian === "Perkhidmatan") helaianPerkhidmatan(ws, unit, guru.get(unit) ?? [], rs);
    else helaianUnit(ws, bahagian, unit, guru.get(unit) ?? [], rs);
  }
  if (wb.worksheets.length === 0) wb.addWorksheet("Tiada Data");
  return Buffer.from(await wb.xlsx.writeBuffer());
}
