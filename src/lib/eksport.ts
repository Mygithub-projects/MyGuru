// ===========================================================================
//  Eksport analitik — Excel (exceljs) & PDF (pdf-lib).
// ===========================================================================
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "./prisma";
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

export async function eksportKehadiranExcel(filter: FilterKehadiran): Promise<Buffer> {
  const rows = await dataKehadiran(filter);
  const wb = new ExcelJS.Workbook();
  wb.creator = "KoKurikulum";
  const ws = wb.addWorksheet("Kehadiran Perjumpaan");
  ws.columns = [
    { header: "Unit", key: "namaUnit", width: 36 },
    { header: "Jenis", key: "jenisKoko", width: 12 },
    { header: "Perjumpaan", key: "bil", width: 12 },
    { header: "Tarikh", key: "tarikh", width: 14 },
    { header: "Hadir", key: "hadir", width: 8 },
    { header: "Jumlah", key: "total", width: 8 },
    { header: "Peratus (%)", key: "peratus", width: 12 },
    { header: "Status", key: "status", width: 16 },
  ];
  rows.forEach((r) => ws.addRow(r));
  ws.getRow(1).font = { bold: true };
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
  wb.creator = "KoKurikulum";
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
  wb.creator = "KoKurikulum";

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

  line("Laporan Analitik Kokurikulum — KoKurikulum", 16, bold, BRAND);
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
