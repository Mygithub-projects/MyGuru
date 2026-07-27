// ===========================================================================
//  Penjanaan PDF — e-Cert & Butiran Diri (pdf-lib, tanpa pelayar headless).
// ===========================================================================
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";
import { getDict, type Locale } from "./i18n";
import { labelStatusPilihanT6 } from "./pajsk";

const BRAND = rgb(0.05, 0.43, 0.37);
const DARK = rgb(0.06, 0.09, 0.16);
const GREY = rgb(0.4, 0.45, 0.5);

async function muatLogo(doc: PDFDocument): Promise<PDFImage | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), "public", "logo-kpm.jpeg"));
    return await doc.embedJpg(buf);
  } catch {
    return null;
  }
}

const INSTITUSI = process.env.NEXT_PUBLIC_INSTITUSI || "KTE (Prauniversiti) Desa Mahkota";

export interface ECertData {
  nama: string;
  noIc: string;
  kelas: string;
  namaAktiviti: string;
  peringkat: string;
  markah: number;
  tarikh: string;
  noSiri: string;
  // Templat boleh-suai (pilihan)
  institusi?: string;
  tajukSijil?: string;
  namaPenandatangan?: string;
  jawatanPenandatangan?: string;
  teksCop?: string;
}

export async function janaECertPDF(d: ECertData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 landskap
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Bingkai
  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: BRAND, borderWidth: 3 });
  page.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 56, borderColor: BRAND, borderWidth: 1 });

  const logo = await muatLogo(doc);
  if (logo) {
    const dims = logo.scale(70 / logo.height);
    page.drawImage(logo, { x: width / 2 - dims.width / 2, y: height - 120, width: dims.width, height: dims.height });
  }

  const center = (text: string, y: number, size: number, f = font, color = DARK) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: width / 2 - w / 2, y, size, font: f, color });
  };

  center((d.institusi ?? INSTITUSI).toUpperCase(), height - 145, 16, bold, BRAND);
  center(d.tajukSijil ?? "SIJIL PENGHARGAAN KOKURIKULUM", height - 175, 22, bold, DARK);
  center("e-Cert · Sistem KoKurikulum", height - 195, 11, font, GREY);

  center("Dengan ini disahkan bahawa", height - 240, 13, font, GREY);
  center(d.nama.toUpperCase(), height - 275, 26, bold, DARK);
  center(`No. KP: ${d.noIc}  ·  ${d.kelas}`, height - 298, 12, font, GREY);

  center("telah menyertai dan menunjukkan pencapaian dalam", height - 335, 13, font, GREY);
  center(d.namaAktiviti, height - 365, 18, bold, BRAND);
  center(`Peringkat ${d.peringkat}  ·  Markah PAJSK: ${d.markah}`, height - 388, 13, font, DARK);

  // Footer: tarikh, no siri, tandatangan
  page.drawText(`Tarikh: ${d.tarikh}`, { x: 80, y: 90, size: 11, font, color: DARK });
  page.drawText(`No. Siri: ${d.noSiri}`, { x: 80, y: 72, size: 10, font, color: GREY });

  page.drawLine({ start: { x: width - 280, y: 110 }, end: { x: width - 80, y: 110 }, thickness: 1, color: GREY });
  if (d.namaPenandatangan) {
    page.drawText(d.namaPenandatangan, { x: width - 275, y: 94, size: 10, font: bold, color: DARK });
  }
  page.drawText(d.jawatanPenandatangan ?? "Penyelaras Kokurikulum", { x: width - 275, y: 80, size: 9, font, color: GREY });
  if (d.teksCop) page.drawText(d.teksCop, { x: width - 275, y: 66, size: 8, font, color: GREY });

  center("Sahkan keaslian sijil ini melalui No. Siri di portal KoKurikulum.", 50, 8, font, GREY);

  return doc.save();
}

export interface ButiranData {
  locale?: Locale;
  nama: string;
  noIc: string;
  kelas: string;
  markahT6: number | null;
  peratusT6: number | null;
  gred: string | null;
  markah: { kunci?: string; kategori: string; nilai: number; maks: number }[];
  kokurikulum: { jenisKoko: string; namaUnitT6: string | null; jawatanT6: string | null; peringkatT6: string | null; status?: string }[];
  kehadiran: { hadir: number; jumlah: number; markah: number; peratus: number };
  kehadiranBidang: { bidang: string; hadir: number; jumlah: number }[];
  pilihanTerbaik: { nama: string; peringkat: string | null; kedudukan: string | null; markah: number }[];
}

// Label PDF dwibahasa (§9 — sediakan templat BM & English; ikut togol §8).
const PDF_L = {
  ms: {
    tajuk: "Butiran Diri Kokurikulum — Tingkatan 6",
    noKp: "No. KP",
    penyertaan: "Penglibatan & Penyertaan Kokurikulum",
    kehadiran: "Kehadiran Perjumpaan",
    kehadiranRingkas: (h: number, j: number, p: number, m: number) =>
      `Hadir ${h} / ${j} perjumpaan (${p}%)  ·  Markah kehadiran: ${m} / 50`,
    ikutBidang: "Mengikut bidang:",
    ringkasan: "Markah & Gred PAJSK",
    jumlahBaris: (mk: number | null, pr: number | null, g: string | null) =>
      `Jumlah: ${mk ?? "-"} / 100  (${pr ?? "-"}%)   ·   Gred: ${g ?? "-"}`,
    komponen: "Komponen Pentaksiran",
    markah: "Markah",
    pilihan: "2 Pilihan Terbaik",
    peringkat: "Peringkat",
    kedudukan: "Kedudukan",
    tiada: "Tiada rekod.",
    dijana: "Dijana oleh KoKurikulum",
  },
  en: {
    tajuk: "Co-curriculum Personal Details — Form 6",
    noKp: "IC No.",
    penyertaan: "Co-curricular Involvement & Participation",
    kehadiran: "Meeting Attendance",
    kehadiranRingkas: (h: number, j: number, p: number, m: number) =>
      `Present ${h} / ${j} meetings (${p}%)  ·  Attendance mark: ${m} / 50`,
    ikutBidang: "By field:",
    ringkasan: "PAJSK Marks & Grade",
    jumlahBaris: (mk: number | null, pr: number | null, g: string | null) =>
      `Total: ${mk ?? "-"} / 100  (${pr ?? "-"}%)   ·   Grade: ${g ?? "-"}`,
    komponen: "Assessment Component",
    markah: "Mark",
    pilihan: "2 Best Selections",
    peringkat: "Level",
    kedudukan: "Placement",
    tiada: "No records.",
    dijana: "Generated by KoKurikulum",
  },
} as const;

export async function janaButiranPDF(d: ButiranData): Promise<Uint8Array> {
  const L = PDF_L[d.locale ?? "ms"];
  const dict = getDict(d.locale ?? "ms");
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4 potret
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let y = height - 50;
  const trim = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
  const tajukSeksyen = (teks: string) => {
    page.drawText(teks, { x: 40, y, size: 12, font: bold, color: BRAND });
    y -= 18;
  };

  const logo = await muatLogo(doc);
  if (logo) {
    const dims = logo.scale(48 / logo.height);
    page.drawImage(logo, { x: 40, y: y - 30, width: dims.width, height: dims.height });
  }
  page.drawText(INSTITUSI, { x: 100, y: y - 5, size: 13, font: bold, color: BRAND });
  page.drawText(L.tajuk, { x: 100, y: y - 22, size: 10, font, color: GREY });
  y -= 70;

  // (1) Maklumat pelajar
  page.drawText(d.nama, { x: 40, y, size: 16, font: bold, color: DARK });
  y -= 18;
  page.drawText(`${L.noKp}: ${d.noIc}   ·   ${d.kelas}`, { x: 40, y, size: 11, font, color: GREY });
  y -= 28;

  // (2) Penglibatan & penyertaan
  tajukSeksyen(L.penyertaan);
  if (d.kokurikulum.length === 0) {
    page.drawText(L.tiada, { x: 48, y, size: 10, font, color: GREY });
    y -= 16;
  }
  for (const k of d.kokurikulum) {
    page.drawText(`• ${k.jenisKoko}: ${k.namaUnitT6 ?? "-"} — ${k.jawatanT6 ?? "-"} (${k.peringkatT6 ?? "-"})`,
      { x: 48, y, size: 10, font, color: DARK });
    if (k.status) {
      const label = `[${labelStatusPilihanT6(k.status, d.locale ?? "ms")}]`;
      const w = font.widthOfTextAtSize(label, 9);
      page.drawText(label, { x: width - 40 - w, y, size: 9, font: bold, color: BRAND });
    }
    y -= 16;
  }
  y -= 12;

  // (3) Kehadiran — ringkasan + ikut bidang (rujukan)
  tajukSeksyen(L.kehadiran);
  page.drawText(L.kehadiranRingkas(d.kehadiran.hadir, d.kehadiran.jumlah, d.kehadiran.peratus, d.kehadiran.markah),
    { x: 40, y, size: 10, font, color: DARK });
  y -= 16;
  if (d.kehadiranBidang.length > 0) {
    const parts = d.kehadiranBidang.map((b) => `${b.bidang}: ${b.hadir}/${b.jumlah}`).join("   ·   ");
    page.drawText(`${L.ikutBidang} ${parts}`, { x: 48, y, size: 9, font, color: GREY });
    y -= 16;
  }
  y -= 8;

  // (4) Markah & gred + pecahan komponen
  tajukSeksyen(L.ringkasan);
  page.drawText(L.jumlahBaris(d.markahT6, d.peratusT6, d.gred), { x: 40, y, size: 11, font: bold, color: DARK });
  y -= 22;
  const cols = [48, 470];
  page.drawText(L.komponen, { x: cols[0], y, size: 9, font: bold, color: GREY });
  page.drawText(L.markah, { x: cols[1], y, size: 9, font: bold, color: GREY });
  y -= 4;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: GREY });
  y -= 14;
  for (const m of d.markah) {
    const label = m.kunci && m.kunci in dict.pajsk ? dict.pajsk[m.kunci as keyof typeof dict.pajsk] : m.kategori;
    page.drawText(trim(label, 48), { x: cols[0], y, size: 9, font, color: DARK });
    page.drawText(`${m.nilai} / ${m.maks}`, { x: cols[1], y, size: 9, font: bold, color: BRAND });
    y -= 15;
  }
  y -= 14;

  // (5) 2 Pilihan Terbaik
  tajukSeksyen(L.pilihan);
  if (d.pilihanTerbaik.length === 0) {
    page.drawText(L.tiada, { x: 48, y, size: 10, font, color: GREY });
    y -= 16;
  }
  d.pilihanTerbaik.forEach((p, i) => {
    page.drawText(`${i + 1}. ${trim(p.nama, 60)}`, { x: 48, y, size: 10, font: bold, color: DARK });
    const w = font.widthOfTextAtSize(`${p.markah} ${L.markah.toLowerCase()}`, 9);
    page.drawText(`${p.markah} ${L.markah.toLowerCase()}`, { x: width - 40 - w, y, size: 9, font: bold, color: BRAND });
    y -= 14;
    const butiran = [
      p.peringkat ? `${L.peringkat}: ${p.peringkat}` : null,
      p.kedudukan ? `${L.kedudukan}: ${p.kedudukan}` : null,
    ].filter(Boolean).join("   ·   ");
    if (butiran) {
      page.drawText(butiran, { x: 60, y, size: 9, font, color: GREY });
      y -= 16;
    } else {
      y -= 4;
    }
  });

  page.drawText(`${L.dijana} · ${d.noIc}`, { x: 40, y: 40, size: 8, font, color: GREY });
  return doc.save();
}

export interface LaporanPdfData {
  jenis: "Mingguan" | "Projek";
  tajuk: string;
  namaUnit: string | null;
  jenisKoko: string | null;
  tarikh: string | null;
  setiausaha: string;
  status: string;
  disahkanOleh?: string | null;
  baris: { label: string; nilai: string }[];
}

/** Dokumen laporan perjumpaan/projek yang telah disahkan — boleh print/muat turun. */
export async function janaLaporanPDF(d: LaporanPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4 potret
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let y = height - 50;

  const logo = await muatLogo(doc);
  if (logo) {
    const dims = logo.scale(48 / logo.height);
    page.drawImage(logo, { x: 40, y: y - 30, width: dims.width, height: dims.height });
  }
  page.drawText(INSTITUSI, { x: 100, y: y - 5, size: 13, font: bold, color: BRAND });
  page.drawText(`Laporan ${d.jenis} Kokurikulum — Tingkatan 6`, { x: 100, y: y - 22, size: 10, font, color: GREY });
  y -= 70;

  page.drawText(d.tajuk, { x: 40, y, size: 15, font: bold, color: DARK });
  y -= 20;
  const meta = [d.jenisKoko, d.namaUnit].filter(Boolean).join(" · ");
  if (meta) { page.drawText(meta, { x: 40, y, size: 11, font, color: GREY }); y -= 16; }
  if (d.tarikh) { page.drawText(`Tarikh: ${d.tarikh}`, { x: 40, y, size: 11, font, color: GREY }); y -= 16; }
  page.drawText(`Setiausaha: ${d.setiausaha}`, { x: 40, y, size: 11, font, color: GREY });
  y -= 26;

  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: GREY });
  y -= 20;

  const wrap = (s: string, n: number) => {
    const out: string[] = [];
    for (const line of s.split(/\n/)) {
      let cur = "";
      for (const word of line.split(/\s+/)) {
        if ((cur + " " + word).trim().length > n) { out.push(cur.trim()); cur = word; }
        else cur += " " + word;
      }
      out.push(cur.trim());
    }
    return out;
  };
  for (const b of d.baris) {
    page.drawText(b.label, { x: 40, y, size: 10, font: bold, color: BRAND });
    y -= 15;
    for (const line of wrap(b.nilai || "-", 95)) {
      page.drawText(line, { x: 48, y, size: 10, font, color: DARK });
      y -= 14;
      if (y < 120) break;
    }
    y -= 8;
    if (y < 120) break;
  }

  // Kotak status pengesahan
  y = Math.max(y, 90);
  page.drawText(`Status: ${d.status}`, { x: 40, y: 80, size: 11, font: bold, color: d.status === "Approved" ? BRAND : GREY });
  page.drawText(`Disahkan oleh: ${d.disahkanOleh ?? "Guru Penasihat"}`, { x: 40, y: 64, size: 10, font, color: DARK });
  page.drawText("Dokumen dijana oleh Sistem KoKurikulum. Sah tanpa tandatangan basah.", { x: 40, y: 44, size: 8, font, color: GREY });
  return doc.save();
}
