// ===========================================================================
//  Eksport analitik — Excel (exceljs) & PDF (pdf-lib).
// ===========================================================================
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "./prisma";
import { markahKehadiran, markahProjekJawatan, markahProjekPeringkat } from "./pajsk";
import { jumlahAktiviti, jumlahKeseluruhan } from "./tetapan-kehadiran";
import {
  analitikKehadiran,
  analitikProjek,
  analitikLaporan,
  analitikDemografi,
  analitikStatusPilihanT6,
} from "./analitik";

export interface FilterKehadiran {
  unit?: string;
  jenis?: string;
}

async function dataKehadiran(filter: FilterKehadiran) {
  const sesi = await prisma.sesiKehadiran.findMany({
    where: {
      ...(filter.unit ? { namaUnit: filter.unit } : {}),
      ...(filter.jenis ? { jenisKoko: filter.jenis } : {}),
    },
    orderBy: [{ namaUnit: "asc" }, { bilPerjumpaan: "asc" }],
    include: { kehadiran: { select: { statusHadir: true } } },
  });
  return sesi.map((s) => {
    const total = s.kehadiran.length;
    const hadir = s.kehadiran.filter((k) => k.statusHadir).length;
    return {
      namaUnit: s.namaUnit,
      jenisKoko: s.jenisKoko,
      bil: s.bilPerjumpaan,
      tarikh: new Date(s.tarikh).toLocaleDateString("ms-MY"),
      hadir,
      total,
      peratus: total ? Math.round((hadir / total) * 1000) / 10 : 0,
      status: s.disahkan ? "Disahkan" : "Belum Disahkan",
    };
  });
}

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

export async function eksportKehadiranExcel(filter: FilterKehadiran): Promise<Buffer> {
  const rows = await dataKehadiran(filter);
  const wb = new ExcelJS.Workbook();
  wb.creator = "EzKokoT6";

  const kumpulan = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!kumpulan.has(r.namaUnit)) kumpulan.set(r.namaUnit, []);
    kumpulan.get(r.namaUnit)!.push(r);
  }

  const namaDigunakan = new Set<string>();
  for (const [namaUnit, rowsUnit] of kumpulan) {
    const ws = wb.addWorksheet(namaTabUnik(namaUnit, namaDigunakan));
    ws.columns = [
      { header: "Jenis", key: "jenisKoko", width: 12 },
      { header: "Perjumpaan", key: "bil", width: 12 },
      { header: "Tarikh", key: "tarikh", width: 14 },
      { header: "Hadir", key: "hadir", width: 8 },
      { header: "Jumlah", key: "total", width: 8 },
      { header: "Peratus (%)", key: "peratus", width: 12 },
      { header: "Status", key: "status", width: 16 },
    ];
    rowsUnit.forEach((r) => ws.addRow(r));
    ws.getRow(1).font = { bold: true };
  }
  if (kumpulan.size === 0) wb.addWorksheet("Kehadiran Perjumpaan");

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/**
 * Roster penuh semua pelajar T6: nama, IC, kelas, markah, dan 3 unit semasa
 * (Kelab, Sukan, Badan Beruniform) — spec admin §1.
 */
export async function eksportPelajarRosterExcel(): Promise<Buffer> {
  const pelajar = await prisma.pelajar.findMany({
    orderBy: { nama: "asc" },
    include: { kokurikulum: { select: { jenisKoko: true, namaUnitT6: true, jawatanT6: true } } },
  });
  const unitOf = (koko: { jenisKoko: string; namaUnitT6: string | null; jawatanT6: string | null }[], jenis: string) => {
    const k = koko.find((x) => x.jenisKoko === jenis);
    return k?.namaUnitT6 ? `${k.namaUnitT6}${k.jawatanT6 ? ` (${k.jawatanT6})` : ""}` : "";
  };

  const wb = new ExcelJS.Workbook();
  wb.creator = "EzKokoT6";
  const ws = wb.addWorksheet("Roster Pelajar T6");
  ws.columns = [
    { header: "Nama", key: "nama", width: 34 },
    { header: "No. KP", key: "noIc", width: 18 },
    { header: "Kelas T6", key: "kelas", width: 14 },
    { header: "Kelab / Persatuan", key: "kelab", width: 30 },
    { header: "Sukan / Permainan", key: "sukan", width: 30 },
    { header: "Badan Beruniform", key: "badan", width: 30 },
    { header: "Markah PAJSK T6", key: "markahT6", width: 16 },
    { header: "Peratus T6 (%)", key: "peratusT6", width: 14 },
    { header: "Gred", key: "gred", width: 8 },
  ];
  for (const p of pelajar) {
    ws.addRow({
      nama: p.nama,
      noIc: p.noIc,
      kelas: p.kelasT6 ?? "",
      kelab: unitOf(p.kokurikulum, "Kelab"),
      sukan: unitOf(p.kokurikulum, "Sukan"),
      badan: unitOf(p.kokurikulum, "Uniform"),
      markahT6: p.markahPajskT6 ?? "",
      peratusT6: p.peratusPajskT6 ?? "",
      gred: p.gredPajskT6 ?? "",
    });
  }
  ws.getRow(1).font = { bold: true };
  ws.getColumn("noIc").numFmt = "@"; // IC sebagai teks (kekalkan sifar di hadapan)
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ---------------------------------------------------------------------------
//  Raw data keseluruhan pelajar — format borang PAJSK kelas (satu tab setiap
//  kelas; blok Badan Beruniform / Kelab / Sukan / Ekstra sebelah-menyebelah).
//  Markah keseluruhan & gred = purata 2 bidang terbaik + ekstra (kiraSemulaT6).
// ---------------------------------------------------------------------------

type Nilai = string | number | null;

interface BarisBidang {
  unit: string; hadir: number | null; jawatan: string; mJawatan: number | null;
  peringkat: string; mPenglibatan: number | null;
  pcpTahap: string; pcpMarkah: number | null;
  pjJawatan: string; pjNama: string; pjMJ: number | null; pjTahap: string; pjMP: number | null;
}

interface BarisPelajar {
  bil: number; nama: string; noIc: string; jantina: string;
  bidang: Record<"Uniform" | "Kelab" | "Sukan", BarisBidang>;
  upJawatan: string; upUnit: string; anugerah: string; mEkstra: number;
  hadir: number; mKehadiran: number; mJawatan: number; mPenglibatan: number; mPencapaian: number;
  mProjekJawatan: number; mProjekPeringkat: number; markah: number | null; gred: string;
}

interface Kolum {
  h: string; w: number; rot?: boolean; fill?: string; teks?: boolean;
  val: (b: BarisPelajar) => Nilai;
}

const WARNA = { biru: "FFC6D9F0", kuning: "FFFFFF00", peach: "FFFBD4B4", kepala: "FFF2F2F2" };
const SEMPADAN: Partial<ExcelJS.Borders> = {
  top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" },
};

function kolumBidang(jenis: "Uniform" | "Kelab" | "Sukan", kod: string, labelUnit: string): Kolum[] {
  const b = (x: BarisPelajar) => x.bidang[jenis];
  const kosong = () => null;
  return [
    { h: "BIL", w: 4, val: (x) => x.bil },
    { h: "NAMA MURID", w: 36, val: (x) => x.nama },
    { h: labelUnit, w: 30, val: (x) => b(x).unit },
    { h: `Kehadiran ${kod}`, w: 5, rot: true, val: (x) => b(x).hadir },
    { h: `Nama Jawatan ${kod}`, w: 20, val: (x) => b(x).jawatan },
    { h: `Markah Jawatan ${kod}`, w: 4.5, rot: true, val: (x) => b(x).mJawatan },
    { h: `Tahap Penglibatan ${kod}`, w: 15, val: (x) => b(x).peringkat },
    { h: "No. Borang", w: 4, rot: true, val: kosong },
    { h: `Markah Penglibatan ${kod}`, w: 4.5, rot: true, val: (x) => b(x).mPenglibatan },
    { h: `Tahap Pencapaian ${kod}`, w: 20, val: (x) => b(x).pcpTahap },
    { h: "No. Borang", w: 4, rot: true, val: kosong },
    { h: `Markah Pencapaian ${kod}`, w: 4.5, rot: true, val: (x) => b(x).pcpMarkah },
    { h: `Nama Jawatan Projek ${kod}`, w: 20, fill: WARNA.biru, val: (x) => b(x).pjJawatan },
    { h: "No. Borang", w: 4, rot: true, fill: WARNA.biru, val: kosong },
    { h: "Nama Projek", w: 24, fill: WARNA.kuning, val: (x) => b(x).pjNama },
    { h: `Markah Jawatan Projek ${kod}`, w: 4.5, rot: true, fill: WARNA.biru, val: (x) => b(x).pjMJ },
    { h: `Tahap Projek ${kod}`, w: 14, fill: WARNA.biru, val: (x) => b(x).pjTahap },
    { h: "No. Borang", w: 4, rot: true, fill: WARNA.biru, val: kosong },
    { h: "Nama Projek", w: 24, fill: WARNA.kuning, val: (x) => b(x).pjNama },
    { h: `Markah Peringkat Projek ${kod}`, w: 4.5, rot: true, fill: WARNA.biru, val: (x) => b(x).pjMP },
  ];
}

/** Blok-blok lajur borang. `tajuk` null = setiap lajur dicantum baris 3–4. */
function blokBorang(jumlahSemua: number): { tajuk: string | null; kelasDiSini?: boolean; kol: Kolum[] }[] {
  const bu = kolumBidang("Uniform", "BU", "Nama Uniform");
  return [
    {
      tajuk: null, kelasDiSini: true,
      kol: [
        bu[0], bu[1],
        { h: "NO KP", w: 15, teks: true, val: (x) => x.noIc },
        { h: "JANTINA", w: 4, rot: true, val: (x) => x.jantina },
      ],
    },
    { tajuk: "BADAN BERUNIFORM", kol: bu.slice(2) },
    { tajuk: "KELAB / PERSATUAN", kelasDiSini: true, kol: kolumBidang("Kelab", "KP", "Nama Kelab / Persatuan") },
    { tajuk: "SUKAN / PERMAINAN", kelasDiSini: true, kol: kolumBidang("Sukan", "SP", "Nama S/P") },
    {
      tajuk: "EKSTRA KURIKULUM", kelasDiSini: true,
      kol: [
        { h: "BIL", w: 4, val: (x) => x.bil },
        { h: "NAMA MURID", w: 36, val: (x) => x.nama },
        { h: "JAWATAN UNIT PERKHIDMATAN", w: 22, val: (x) => x.upJawatan },
        { h: "UNIT PERKHIDMATAN", w: 26, val: (x) => x.upUnit },
        { h: "Anugerah Khas", w: 26, val: (x) => x.anugerah },
        { h: "Markah Ekstra (bonus)", w: 5, rot: true, val: (x) => x.mEkstra },
      ],
    },
    {
      tajuk: "MARKAH PAJSK (SISTEM)",
      kol: [
        { h: `Kehadiran (/${jumlahSemua})`, w: 5, rot: true, val: (x) => x.hadir },
        { h: "Markah Kehadiran (/50)", w: 5.5, rot: true, val: (x) => x.mKehadiran },
        { h: "Markah Jawatan (/10)", w: 5, rot: true, val: (x) => x.mJawatan },
        { h: "Markah Penglibatan (/10)", w: 5, rot: true, val: (x) => x.mPenglibatan },
        { h: "Markah Pencapaian (/10)", w: 5, rot: true, val: (x) => x.mPencapaian },
        { h: "Markah Projek Jawatan (/10)", w: 5, rot: true, val: (x) => x.mProjekJawatan },
        { h: "Markah Projek Peringkat (/10)", w: 5, rot: true, val: (x) => x.mProjekPeringkat },
      ],
    },
    {
      tajuk: null,
      kol: [
        { h: "MARKAH KESELURUHAN", w: 9, rot: true, fill: WARNA.peach, val: (x) => x.markah },
        { h: "GRED KESELURUHAN", w: 6, rot: true, fill: WARNA.peach, val: (x) => x.gred },
        { h: "10% (MARKAH ÷ 10)", w: 6, rot: true, val: (x) => (x.markah == null ? null : Math.round(x.markah * 10) / 100) },
        { h: "TANDA TANGAN PELAJAR", w: 10, rot: true, val: () => null },
        { h: "CATATAN", w: 14, val: () => null },
      ],
    },
  ];
}

function isiTabKelas(ws: ExcelJS.Worksheet, kelas: string, baris: BarisPelajar[], jumlahSemua: number) {
  const blok = blokBorang(jumlahSemua);
  const font = { name: "Arial", size: 9 };
  let col = 1;
  for (const bk of blok) {
    const mula = col;
    if (bk.kelasDiSini) {
      ws.getCell(1, mula).value = `KELAS ${kelas}`;
      ws.getCell(1, mula).font = { ...font, bold: true, size: 11 };
      ws.getCell(2, mula).value = "GURU TINGKATAN :";
      ws.getCell(2, mula).font = { ...font, bold: true };
    }
    for (const k of bk.kol) {
      ws.getColumn(col).width = k.w;
      // Lajur tanpa tajuk blok dicantum baris 3–4; nilai mesti di sel induk (baris 3).
      if (bk.tajuk === null) ws.mergeCells(3, col, 4, col);
      const h = ws.getCell(bk.tajuk === null ? 3 : 4, col);
      h.value = k.h;
      h.font = { ...font, bold: true };
      h.alignment = { horizontal: "center", vertical: "middle", wrapText: true, ...(k.rot ? { textRotation: 90 } : {}) };
      h.fill = { type: "pattern", pattern: "solid", fgColor: { argb: k.fill ?? WARNA.kepala } };
      h.border = SEMPADAN;
      baris.forEach((b, i) => {
        const c = ws.getCell(5 + i, col);
        c.value = k.val(b) ?? null;
        c.font = font;
        c.border = SEMPADAN;
        c.alignment = { vertical: "middle", wrapText: !k.rot && k.w > 8, horizontal: k.w <= 9 ? "center" : "left" };
        if (k.teks) c.numFmt = "@";
        if (k.fill === WARNA.peach) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WARNA.peach } };
      });
      col++;
    }
    if (bk.tajuk !== null) {
      ws.mergeCells(3, mula, 3, col - 1);
      const t = ws.getCell(3, mula);
      t.value = bk.tajuk;
      t.font = { ...font, bold: true, size: 10 };
      t.alignment = { horizontal: "center", vertical: "middle" };
      t.border = SEMPADAN;
    }
  }
  ws.getRow(4).height = 110;
  ws.getRow(3).height = 18;

  // Analisis kelas (kanan borang): bilangan pelajar & taburan gred.
  const a = col + 1;
  ws.getColumn(a).width = 14;
  ws.getColumn(a + 1).width = 8;
  ws.getColumn(a + 2).width = 8;
  ws.mergeCells(4, a, 4, a + 2);
  const ta = ws.getCell(4, a);
  ta.value = "ANALISIS KELAS";
  ta.font = { ...font, bold: true };
  ta.alignment = { horizontal: "center", vertical: "middle" };
  const bergred = baris.filter((b) => b.gred);
  const analisis: [string, number, number | string][] = [["Bil. Pelajar", baris.length, "%"]];
  for (const g of ["A", "B", "C", "D", "E"]) {
    const n = bergred.filter((b) => b.gred === g).length;
    analisis.push([`Bil. ${g}`, n, bergred.length ? Math.round((n / bergred.length) * 1000) / 10 : 0]);
  }
  analisis.forEach((r, i) => {
    r.forEach((v, j) => {
      const c = ws.getCell(5 + i, a + j);
      c.value = v;
      c.font = { ...font, bold: i === 0 };
      c.border = SEMPADAN;
    });
  });

  ws.views = [{ state: "frozen", xSplit: 4, ySplit: 4 }];
  ws.pageSetup = { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
}

/**
 * Data mentah keseluruhan semua pelajar (Admin) dalam format borang PAJSK
 * kelas: satu tab setiap kelas T6.
 */
export async function eksportRawDataExcel(): Promise<Buffer> {
  const jumlahSemua = jumlahKeseluruhan(await jumlahAktiviti()); // tetapan Admin
  const pelajar = await prisma.pelajar.findMany({
    orderBy: [{ kelasT6: "asc" }, { nama: "asc" }],
    include: {
      kokurikulum: true,
      kehadiran: { where: { statusHadir: true }, select: { jenisKoko: true } },
      pencapaian: { where: { statusSemakan: "Approved" } },
      aktivitiLuar: { where: { statusPengesahan: "Approved" } },
      laporanProjek: { where: { statusPengesahan: "Approved" } },
    },
  });

  const terbaik = <T>(arr: T[], skor: (x: T) => number) =>
    arr.reduce<T | null>((m, x) => (m === null || skor(x) > skor(m) ? x : m), null);

  const kumpulan = new Map<string, BarisPelajar[]>();
  for (const p of pelajar) {
    const kelas = p.kelasT6?.trim() || "TIADA KELAS";
    if (!kumpulan.has(kelas)) kumpulan.set(kelas, []);
    const senarai = kumpulan.get(kelas)!;

    const bidangOf = (jenis: "Uniform" | "Kelab" | "Sukan"): BarisBidang => {
      const k = p.kokurikulum.find((x) => x.jenisKoko === jenis);
      const unit = k?.namaUnitT6 ?? "";
      const padan = (u: string | null) => !!unit && u === unit;
      // Pencapaian unit: tertinggi antara pencapaian & aktiviti luar yang diluluskan.
      const calon = [
        ...p.pencapaian.filter((c) => c.kategori !== "ekstra" && padan(c.namaUnit))
          .map((c) => ({ tahap: [c.kedudukan, c.peringkat].filter(Boolean).join(" ") || c.namaPencapaian, markah: c.markah })),
        ...p.aktivitiLuar.filter((x) => padan(x.namaUnit))
          .map((x) => ({ tahap: x.peringkat, markah: x.markahLuar })),
      ];
      const pcp = terbaik(calon, (c) => c.markah);
      const projek = terbaik(
        p.laporanProjek.filter((pr) => padan(pr.namaUnit) || (!pr.namaUnit && pr.jenisKoko === jenis)),
        (pr) => markahProjekJawatan(pr.jawatanProjek) + markahProjekPeringkat(pr.peringkatProjek),
      );
      return {
        unit,
        hadir: k ? p.kehadiran.filter((h) => h.jenisKoko === jenis).length : null,
        jawatan: k?.jawatanT6 ?? "",
        mJawatan: k ? k.markahJawatanT6 ?? 0 : null,
        peringkat: k?.peringkatT6 ?? "",
        mPenglibatan: k ? k.markahPeringkatT6 ?? 0 : null,
        pcpTahap: pcp?.tahap ?? "",
        pcpMarkah: pcp ? pcp.markah : k ? 0 : null,
        pjJawatan: projek?.jawatanProjek ?? "",
        pjNama: projek?.namaProjek ?? "",
        pjMJ: projek ? markahProjekJawatan(projek.jawatanProjek) : k ? 0 : null,
        pjTahap: projek?.peringkatProjek ?? "",
        pjMP: projek ? markahProjekPeringkat(projek.peringkatProjek) : k ? 0 : null,
      };
    };

    const up = p.kokurikulum.find((x) => x.jenisKoko === "Perkhidmatan");
    const hadir = p.kehadiran.length;
    senarai.push({
      bil: senarai.length + 1,
      nama: p.nama,
      noIc: p.noIc,
      jantina: p.jantina ?? "",
      bidang: { Uniform: bidangOf("Uniform"), Kelab: bidangOf("Kelab"), Sukan: bidangOf("Sukan") },
      upJawatan: up?.jawatanT6 ?? "",
      upUnit: up?.namaUnitT6 ?? "",
      anugerah: p.pencapaian.filter((c) => c.kategori === "ekstra").map((c) => c.namaPencapaian).join("; "),
      mEkstra: p.markahEkstra,
      hadir,
      mKehadiran: markahKehadiran(hadir, jumlahSemua),
      mJawatan: Math.max(0, ...p.kokurikulum.map((k) => k.markahJawatanT6 ?? 0)),
      mPenglibatan: p.markahPenglibatan,
      mPencapaian: p.markahPencapaian,
      mProjekJawatan: p.markahProjekJawatan,
      mProjekPeringkat: p.markahProjekPeringkat,
      markah: p.markahPajskT6,
      gred: p.gredPajskT6 ?? "",
    });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "EzKokoT6";
  const namaDigunakan = new Set<string>();
  const urutanKelas = [...kumpulan.keys()].sort((a, b) => a.localeCompare(b, "ms", { numeric: true }));
  for (const kelas of urutanKelas) {
    const baris = kumpulan.get(kelas)!;
    isiTabKelas(wb.addWorksheet(namaTabUnik(kelas, namaDigunakan)), kelas, baris, jumlahSemua);
  }
  if (kumpulan.size === 0) wb.addWorksheet("Tiada Data");

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Senarai kelas & bilangan pelajar (untuk paparan halaman Raw Data). */
export async function ringkasanKelasRawData() {
  const kumpulan = await prisma.pelajar.groupBy({ by: ["kelasT6"], _count: { _all: true }, orderBy: { kelasT6: "asc" } });
  return kumpulan.map((k) => ({ kelas: k.kelasT6?.trim() || "TIADA KELAS", bil: k._count._all }));
}

export async function eksportKehadiranPdf(filter: FilterKehadiran): Promise<Buffer> {
  const rows = await dataKehadiran(filter);
  const doc = await PDFDocument.create();
  let page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const BRAND = rgb(0.12, 0.23, 0.37);
  const DARK = rgb(0.06, 0.09, 0.16);
  let y = 800;
  page.drawText("Laporan Kehadiran — Setiap Perjumpaan", { x: 40, y, size: 15, font: bold, color: BRAND });
  y -= 18;
  page.drawText(`Tapisan: ${filter.unit ?? "Semua unit"}${filter.jenis ? " · " + filter.jenis : ""}`, { x: 40, y, size: 9, font, color: DARK });
  y -= 22;
  const line = (t: string, size = 9) => {
    if (y < 50) { page = doc.addPage([595, 842]); y = 800; }
    page.drawText(t, { x: 40, y, size, font, color: DARK });
    y -= size + 5;
  };
  for (const r of rows) {
    line(`${r.namaUnit} (${r.jenisKoko}) · Perjumpaan ${r.bil} · ${r.tarikh} · ${r.hadir}/${r.total} (${r.peratus}%) · ${r.status}`);
  }
  if (rows.length === 0) line("(Tiada data)");
  return Buffer.from(await doc.save());
}

export async function eksportExcel(units?: string[]): Promise<Buffer> {
  const [kehadiran, projek, laporan, demografi, statusT6] = await Promise.all([
    analitikKehadiran(units),
    analitikProjek(),
    analitikLaporan(),
    analitikDemografi(),
    analitikStatusPilihanT6(units),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "EzKokoT6";

  const wsK = wb.addWorksheet("Kehadiran");
  wsK.columns = [
    { header: "Unit", key: "namaUnit", width: 40 },
    { header: "Jumlah Rekod", key: "jumlahRekod", width: 15 },
    { header: "Hadir", key: "hadir", width: 12 },
    { header: "Peratus (%)", key: "peratus", width: 14 },
  ];
  kehadiran.forEach((k) => wsK.addRow(k));
  wsK.getRow(1).font = { bold: true };

  const wsP = wb.addWorksheet("Projek");
  wsP.columns = [
    { header: "Status", key: "status", width: 20 },
    { header: "Bilangan", key: "bil", width: 12 },
  ];
  projek.forEach((p) => wsP.addRow(p));
  wsP.getRow(1).font = { bold: true };

  const wsT6 = wb.addWorksheet("Pilihan T6");
  wsT6.columns = [
    { header: "Status Pilihan Unit T6", key: "nama", width: 24 },
    { header: "Bilangan", key: "bil", width: 12 },
  ];
  statusT6.forEach((s) => wsT6.addRow(s));
  wsT6.getRow(1).font = { bold: true };

  const wsL = wb.addWorksheet("Laporan");
  wsL.addRow(["Metrik", "Nilai"]);
  wsL.addRow(["Jumlah Laporan", laporan.jumlah]);
  wsL.addRow(["Disahkan", laporan.disahkan]);
  wsL.addRow(["Pending", laporan.pending]);
  wsL.addRow(["Kuiri", laporan.kuiri]);
  wsL.addRow(["Kadar Pematuhan (%)", laporan.kadarPematuhan]);
  wsL.getRow(1).font = { bold: true };

  const wsD = wb.addWorksheet("Demografi");
  for (const d of demografi) {
    wsD.addRow([d.label]);
    wsD.getRow(wsD.rowCount).font = { bold: true };
    d.data.forEach((x) => wsD.addRow([x.nama, x.bil]));
    wsD.addRow([]);
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function eksportPdf(units?: string[]): Promise<Buffer> {
  const [kehadiran, projek, laporan, statusT6] = await Promise.all([
    analitikKehadiran(units),
    analitikProjek(),
    analitikLaporan(),
    analitikStatusPilihanT6(units),
  ]);

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const { height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const BRAND = rgb(0.05, 0.43, 0.37);
  const DARK = rgb(0.06, 0.09, 0.16);
  let y = height - 50;

  const line = (t: string, size: number, f = font, color = DARK, dx = 40) => {
    page.drawText(t, { x: dx, y, size, font: f, color });
    y -= size + 6;
  };

  line("Laporan Analitik Kokurikulum — EzKokoT6", 16, bold, BRAND);
  line(units ? `Skop: ${units.join(", ")}` : "Skop: Seluruh Sekolah", 10, font);
  y -= 8;

  line("Kehadiran Mengikut Unit", 13, bold, BRAND);
  for (const k of kehadiran.slice(0, 20)) line(`  ${k.namaUnit}: ${k.peratus}% (${k.hadir}/${k.jumlahRekod})`, 10);
  if (kehadiran.length === 0) line("  (tiada data)", 10);
  y -= 8;

  line("Status Laporan Projek", 13, bold, BRAND);
  for (const p of projek) line(`  ${p.status}: ${p.bil}`, 10);
  if (projek.length === 0) line("  (tiada data)", 10);
  y -= 8;

  line("Pematuhan Laporan Mingguan", 13, bold, BRAND);
  line(`  Jumlah ${laporan.jumlah} · Disahkan ${laporan.disahkan} · Pending ${laporan.pending} · Kadar ${laporan.kadarPematuhan}%`, 10);
  y -= 8;

  line("Status Pilihan Unit T6", 13, bold, BRAND);
  for (const s of statusT6) line(`  ${s.nama}: ${s.bil}`, 10);
  if (statusT6.length === 0) line("  (tiada data)", 10);

  return Buffer.from(await doc.save());
}
