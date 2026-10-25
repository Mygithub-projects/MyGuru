// ===========================================================================
//  Penjanaan PDF — e-Cert & Butiran Diri (pdf-lib, tanpa pelayar headless).
// ===========================================================================
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage } from "pdf-lib";
import { getDict, type Locale } from "./i18n";
import { labelStatusPilihanT6 } from "./pajsk";
import { ECERT, ECERT_NOTA } from "./ecert-layout";

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
  /** Data URL PNG/JPEG tandatangan pengesah (kosong = garisan sahaja). */
  tandatangan?: string | null;
}

export async function janaECertPDF(d: ECertData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const aset = await asetECert(doc, d.tandatangan);
  lukisECert(doc, aset, {
    ...d,
    barisIdentiti: `No. KP: ${d.noIc}  ·  ${d.kelas}`,
    ayat: "telah menyertai dan menunjukkan pencapaian dalam",
    barisPeringkat: `Peringkat ${d.peringkat}  ·  Markah PAJSK: ${d.markah}`,
  });
  return doc.save();
}

/** e-Cert Program: satu halaman bagi setiap peserta dalam satu PDF. */
export interface ECertProgramData {
  namaProgram: string;
  peringkat: string;
  tarikh: string;
  tempat?: string | null;
  peserta: { nama: string; noKp: string; namaSekolah?: string | null; peranan: string; noSiri: string }[];
  institusi?: string;
  tajukSijil?: string;
  namaPenandatangan?: string;
  jawatanPenandatangan?: string;
  teksCop?: string;
  tandatangan?: string | null;
}

export async function janaECertProgramPDF(d: ECertProgramData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const aset = await asetECert(doc, d.tandatangan);
  const peringkat = `Peringkat ${d.peringkat}${d.tempat ? `  ·  ${d.tempat}` : ""}`;
  for (const p of d.peserta) {
    lukisECert(doc, aset, {
      nama: p.nama,
      barisIdentiti: `No. KP: ${p.noKp}`,
      ayat: p.peranan && p.peranan !== "Peserta"
        ? `telah berkhidmat sebagai ${p.peranan} dalam`
        : "telah menyertai",
      namaAktiviti: d.namaProgram,
      barisPeringkat: peringkat,
      tarikh: d.tarikh,
      noSiri: p.noSiri,
      institusi: d.institusi,
      tajukSijil: d.tajukSijil,
      namaPenandatangan: d.namaPenandatangan,
      jawatanPenandatangan: d.jawatanPenandatangan,
      teksCop: d.teksCop,
    });
  }
  return doc.save();
}

type AsetECert = { font: PDFFont; bold: PDFFont; latar: PDFImage | null; ttd: PDFImage | null };

/** Imej dibenam sekali bagi setiap dokumen dan dikongsi oleh semua halaman. */
async function asetECert(doc: PDFDocument, tandatangan?: string | null): Promise<AsetECert> {
  let latar: PDFImage | null = null;
  try {
    latar = await doc.embedJpg(await readFile(path.join(process.cwd(), "public", ECERT.latar)));
  } catch {
    // Templat hilang — sijil masih dijana atas latar putih.
  }
  return {
    font: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    latar,
    ttd: await benamTandatangan(doc, tandatangan),
  };
}

async function benamTandatangan(doc: PDFDocument, dataUrl?: string | null): Promise<PDFImage | null> {
  const m = dataUrl?.match(/^data:image\/(png|jpeg);base64,(.+)$/);
  if (!m) return null;
  try {
    const buf = Buffer.from(m[2], "base64");
    return m[1] === "png" ? await doc.embedPng(buf) : await doc.embedJpg(buf);
  } catch {
    return null;
  }
}

interface HalamanECert {
  nama: string;
  barisIdentiti: string;
  ayat: string;
  namaAktiviti: string;
  barisPeringkat: string;
  tarikh: string;
  noSiri: string;
  institusi?: string;
  tajukSijil?: string;
  namaPenandatangan?: string;
  jawatanPenandatangan?: string;
  teksCop?: string;
}

/** Lukis satu halaman e-Cert (A4 potret atas templat). Susun atur dari ecert-layout.ts — sama dengan SijilPreview. */
function lukisECert(doc: PDFDocument, { font, bold, latar, ttd }: AsetECert, d: HalamanECert) {
  const { w: width, h: height, y: Y, lebarTeks } = ECERT;
  const page = doc.addPage([width, height]);
  const [MERAH, EMAS, GELAP, KELABU] = [ECERT.warna.merah, ECERT.warna.emas, ECERT.warna.gelap, ECERT.warna.kelabu].map((c) => rgb(c[0], c[1], c[2]));

  if (latar) page.drawImage(latar, { x: 0, y: 0, width, height });

  // Teks berpusat; saiz dikecilkan (hingga 60%) supaya muat lebarTeks, kemudian dipendekkan jika masih panjang.
  const center = (text: string, y: number, size: number, f = font, color = GELAP) => {
    const s = Math.max(size * 0.6, Math.min(size, (size * lebarTeks) / f.widthOfTextAtSize(text, size)));
    const t = muat(text, s, f);
    page.drawText(t, { x: width / 2 - f.widthOfTextAtSize(t, s) / 2, y: height - y, size: s, font: f, color });
  };

  center((d.institusi ?? INSTITUSI).toUpperCase(), Y.institusi, 13, bold, MERAH);
  center(d.tajukSijil ?? "SIJIL PENGHARGAAN KOKURIKULUM", Y.tajuk, 22, bold, GELAP);
  center("e-Cert · Sistem KoKurikulum", Y.subtajuk, 10, font, KELABU);
  page.drawLine({ start: { x: width / 2 - 60, y: height - Y.garis }, end: { x: width / 2 + 60, y: height - Y.garis }, thickness: 1, color: EMAS });

  center("Dengan ini disahkan bahawa", Y.disahkan, 12, font, KELABU);
  center(d.nama.toUpperCase(), Y.nama, 22, bold, GELAP);
  center(d.barisIdentiti, Y.identiti, 11, font, KELABU);

  center(d.ayat, Y.ayat, 12, font, KELABU);
  center(d.namaAktiviti, Y.aktiviti, 17, bold, MERAH);
  center(d.barisPeringkat, Y.peringkat, 12, font, GELAP);

  // Tandatangan pengesah — imej dipusatkan atas garisan
  if (ttd) {
    const skala = Math.min(ECERT.ttd.maksW / ttd.width, ECERT.ttd.maksH / ttd.height);
    const [iw, ih] = [ttd.width * skala, ttd.height * skala];
    page.drawImage(ttd, { x: width / 2 - iw / 2, y: height - Y.ttdBawah, width: iw, height: ih });
  }
  const separuh = ECERT.garisTtdLebar / 2;
  page.drawLine({ start: { x: width / 2 - separuh, y: height - Y.garisTtd }, end: { x: width / 2 + separuh, y: height - Y.garisTtd }, thickness: 0.8, color: KELABU });
  if (d.namaPenandatangan) center(d.namaPenandatangan, Y.namaTtd, 10, bold, GELAP);
  center(d.jawatanPenandatangan ?? "Penyelaras Kokurikulum", Y.jawatan, 9, font, KELABU);
  if (d.teksCop) center(d.teksCop, Y.cop, 8, font, KELABU);

  center(`Tarikh: ${d.tarikh}   ·   No. Siri: ${d.noSiri}`, Y.tarikh, 9, font, GELAP);
  center(ECERT_NOTA, Y.nota, 7, font, KELABU);

  // Pendekkan teks yang masih melebihi lebarTeks selepas saiz dikecilkan.
  function muat(teks: string, size: number, f: PDFFont): string {
    if (f.widthOfTextAtSize(teks, size) <= lebarTeks) return teks;
    let t = teks;
    while (t.length > 1 && f.widthOfTextAtSize(`${t}…`, size) > lebarTeks) t = t.slice(0, -1);
    return `${t.trimEnd()}…`;
  }
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
    if (k.status && k.status !== "Kekal") {
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
