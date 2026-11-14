// ===========================================================================
//  OPR (One Page Report / Laporan Satu Muka Surat) untuk laporan SU/NSU.
//  Pelajar isi butiran + gambar → sistem jana OPR (PDF A4, satu muka surat)
//  → pelajar pratonton & semak → hantar. PDF OPR disimpan sebagai eviden
//  laporan (lampiran / failLaporanImpak) untuk pengesahan guru penasihat.
// ===========================================================================
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { prisma } from "./prisma";
import { storage } from "./storage";
import { ringkasanSesi } from "./kehadiran";

export const OPR_MAKS_GAMBAR = 4;
const MAKS_BAIT_GAMBAR = 5 * 1024 * 1024;
export const OPR_HAD = { objektif: 500, aktiviti: 1500, refleksi: 600, tempat: 120, masa: 60 } as const;

const BRAND = rgb(0.05, 0.43, 0.37);
const BRAND_LIGHT = rgb(0.9, 0.96, 0.94);
const DARK = rgb(0.06, 0.09, 0.16);
const GREY = rgb(0.4, 0.45, 0.5);
const LINE = rgb(0.8, 0.84, 0.87);
const INSTITUSI = process.env.NEXT_PUBLIC_INSTITUSI || "KTE (Prauniversiti) Desa Mahkota";

export interface OprData {
  jenis: "Mingguan" | "Projek";
  namaProgram: string;
  namaUnit: string;
  jenisKoko: string;
  peringkat: string;
  tarikh: string; // yyyy-mm-dd
  masa: string;
  tempat: string;
  jawatanProjek: string | null;
  objektif: string;
  aktiviti: string;
  refleksi: string;
  kehadiran: { bil: number; hadir: number; total: number; peratus: number } | null;
  disediakanOleh: string;
  jawatanPenyedia: string; // "Setiausaha (SU)" | "Naib Setiausaha (NSU)"
  gambar: { data: Uint8Array; jenis: "jpg" | "png" }[];
  /** Laporan Projek: peserta dipilih SU/NSU (kosong untuk mingguan). */
  peserta: { nama: string; kelas: string | null; jawatan: string }[];
}

/** Teks laporan ringkas yang disimpan dalam DB (dipapar pada panel semakan guru). */
export function teksLaporanOpr(d: Pick<OprData, "objektif" | "aktiviti" | "refleksi" | "tempat">): string {
  return [
    d.tempat && `Tempat: ${d.tempat}`,
    d.objektif && `Objektif: ${d.objektif}`,
    `Aktiviti: ${d.aktiviti}`,
    d.refleksi && `Refleksi: ${d.refleksi}`,
  ].filter(Boolean).join("\n\n");
}

const str = (form: FormData, k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);

function jenisImej(buf: Uint8Array): "jpg" | "png" | null {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  return null;
}

/**
 * Baca medan OPR dari FormData & sahkan. Medan asas (nama, peringkat, tarikh,
 * unit) mengikut nama medan sedia ada borang mingguan/projek.
 * Pulang { data } atau { ralat }.
 */
export async function bacaOprDariForm(
  form: FormData,
  jenis: "Mingguan" | "Projek",
  pelajar: { id: string; subRole: string | null | undefined },
  /** Laporan Projek: nama projek rasmi (dari tag guru) & peserta yang telah disahkan. */
  projek?: { nama: string; peranan: string; peserta: OprData["peserta"] },
): Promise<{ data: OprData } | { ralat: string }> {
  const namaProgram = projek?.nama ?? str(form, jenis === "Mingguan" ? "namaProgram" : "namaProjek", 200);
  const peringkat = str(form, jenis === "Mingguan" ? "peringkat" : "peringkatProjek", 60);
  const tarikh = str(form, "tarikh", 20);
  const namaUnit = str(form, "namaUnit", 200);
  const aktiviti = str(form, "laporan", OPR_HAD.aktiviti);
  const sesiId = str(form, "sesiId", 60) || null;

  if (!namaProgram) return { ralat: "Nama program/aktiviti diperlukan" };
  if (!tarikh || isNaN(new Date(tarikh).getTime())) return { ralat: "Tarikh program/aktiviti diperlukan" };
  if (!aktiviti) return { ralat: "Aktiviti / pengisian program diperlukan" };

  const unit = await prisma.kokurikulum.findFirst({
    where: { pelajarId: pelajar.id, namaUnitT6: namaUnit },
    select: { jenisKoko: true },
  });
  if (!unit) return { ralat: "Unit berkaitan diperlukan/tidak sah" };

  const gambarFail = form.getAll("gambar").filter((f): f is File => f instanceof File && f.size > 0);
  if (gambarFail.length === 0) return { ralat: "Sekurang-kurangnya 1 gambar aktiviti diperlukan" };
  if (gambarFail.length > OPR_MAKS_GAMBAR) return { ralat: `Maksimum ${OPR_MAKS_GAMBAR} gambar` };
  const gambar: OprData["gambar"] = [];
  for (const f of gambarFail) {
    if (f.size > MAKS_BAIT_GAMBAR) return { ralat: "Gambar terlalu besar (maks 5MB setiap satu)" };
    const data = new Uint8Array(await f.arrayBuffer());
    const j = jenisImej(data);
    if (!j) return { ralat: "Gambar mesti JPG atau PNG" };
    gambar.push({ data, jenis: j });
  }

  // Kehadiran hanya jika sesi itu milik unit yang sama (elak bocor data unit lain).
  let kehadiran: OprData["kehadiran"] = null;
  if (sesiId) {
    const sesi = await prisma.sesiKehadiran.findUnique({ where: { id: sesiId }, select: { namaUnit: true, bilPerjumpaan: true } });
    if (sesi && sesi.namaUnit === namaUnit) {
      const r = await ringkasanSesi(sesiId);
      kehadiran = { bil: sesi.bilPerjumpaan, ...r };
    }
  }

  const p = await prisma.pelajar.findUnique({ where: { id: pelajar.id }, select: { nama: true } });

  return {
    data: {
      jenis,
      namaProgram,
      namaUnit,
      jenisKoko: unit.jenisKoko,
      peringkat,
      tarikh,
      masa: str(form, "masa", OPR_HAD.masa),
      tempat: str(form, "tempat", OPR_HAD.tempat),
      jawatanProjek: jenis === "Projek" ? str(form, "jawatanProjek", 60) || null : null,
      objektif: str(form, "objektif", OPR_HAD.objektif),
      aktiviti,
      refleksi: str(form, "refleksi", OPR_HAD.refleksi),
      kehadiran,
      disediakanOleh: p?.nama ?? "-",
      jawatanPenyedia: (projek?.peranan ?? pelajar.subRole) === "NSU" ? "Naib Setiausaha (NSU)" : "Setiausaha (SU)",
      gambar,
      peserta: projek?.peserta ?? [],
    },
  };
}

/** Simpan PDF OPR ke storan peribadi; pulang URL route /api/fail/... */
export async function simpanOpr(pdf: Uint8Array): Promise<string> {
  return storage().simpan(Buffer.from(pdf), `opr-${randomBytes(6).toString("hex")}.pdf`, "application/pdf");
}

// --- Penjanaan PDF ----------------------------------------------------------

/** Font standard pdf-lib hanya menyokong WinAnsi — tukar/buang aksara lain. */
function bersih(s: string): string {
  return s
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/\t/g, " ")
    .replace(/[^\n\x20-\x7E\xA0-\xFF]/g, "");
}

function balut(teks: string, font: PDFFont, size: number, lebar: number): string[] {
  const out: string[] = [];
  for (const perenggan of bersih(teks).split(/\r?\n/)) {
    let cur = "";
    for (const kata of perenggan.split(/\s+/).filter(Boolean)) {
      const cuba = cur ? `${cur} ${kata}` : kata;
      if (font.widthOfTextAtSize(cuba, size) <= lebar) { cur = cuba; continue; }
      if (cur) out.push(cur);
      // Kata terlalu panjang — potong ikut aksara.
      let k = kata;
      while (font.widthOfTextAtSize(k, size) > lebar) {
        let n = k.length;
        while (n > 1 && font.widthOfTextAtSize(k.slice(0, n), size) > lebar) n--;
        out.push(k.slice(0, n));
        k = k.slice(n);
      }
      cur = k;
    }
    out.push(cur);
  }
  // Buang baris kosong berganda di hujung
  while (out.length && !out[out.length - 1]) out.pop();
  return out;
}

function hadBaris(baris: string[], maks: number, font: PDFFont, size: number, lebar: number): string[] {
  if (baris.length <= maks) return baris;
  const potong = baris.slice(0, maks);
  let akhir = potong[maks - 1];
  while (akhir && font.widthOfTextAtSize(akhir + "...", size) > lebar) akhir = akhir.slice(0, -1);
  potong[maks - 1] = akhir + "...";
  return potong;
}

async function muatImej(doc: PDFDocument, fail: string): Promise<PDFImage | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), "public", fail));
    return fail.endsWith(".png") ? await doc.embedPng(buf) : await doc.embedJpg(buf);
  } catch {
    return null;
  }
}

function formatTarikh(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const hari = d.toLocaleDateString("ms-MY", { weekday: "long" });
  return `${d.toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" })} (${hari})`;
}

export async function janaOprPDF(d: OprData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`OPR - ${bersih(d.namaProgram)}`);
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const M = 34;
  const W = width - 2 * M;
  let y = height - M;

  const teks = (page: PDFPage, s: string, x: number, yy: number, size: number, f = font, color = DARK) =>
    page.drawText(bersih(s), { x, y: yy, size, font: f, color });

  // --- Kepala ---
  const [logoKiri, logoKanan] = await Promise.all([muatImej(doc, "logo-kpm.jpeg"), muatImej(doc, "logo-ktedm.jpeg")]);
  const LH = 44;
  if (logoKiri) { const s = logoKiri.scale(LH / logoKiri.height); page.drawImage(logoKiri, { x: M, y: y - LH, width: s.width, height: LH }); }
  if (logoKanan) { const s = logoKanan.scale(LH / logoKanan.height); page.drawImage(logoKanan, { x: width - M - s.width, y: y - LH, width: s.width, height: LH }); }
  const tengah = (s: string, yy: number, size: number, f: PDFFont, color = DARK) => {
    const b = bersih(s);
    page.drawText(b, { x: (width - f.widthOfTextAtSize(b, size)) / 2, y: yy, size, font: f, color });
  };
  tengah(INSTITUSI.toUpperCase(), y - 14, 12, bold, BRAND);
  tengah("LAPORAN SATU MUKA SURAT (OPR)", y - 29, 11, bold);
  tengah(`Laporan ${d.jenis} Kokurikulum Tingkatan 6`, y - 42, 9, font, GREY);
  y -= LH + 10;
  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 1.5, color: BRAND });
  y -= 8;

  // --- Bar tajuk seksyen ---
  const seksyen = (tajuk: string) => {
    page.drawRectangle({ x: M, y: y - 15, width: W, height: 15, color: BRAND });
    teks(page, tajuk, M + 6, y - 11, 9, bold, rgb(1, 1, 1));
    y -= 15;
  };

  // --- 1. Maklumat program (jadual 2 lajur) ---
  seksyen("1. MAKLUMAT PROGRAM");
  const sel: [string, string][] = [
    ["Nama Program", d.namaProgram],
    ["Unit", `${d.namaUnit} (${d.jenisKoko})`],
    ["Tarikh", formatTarikh(d.tarikh)],
    ["Masa", d.masa || "-"],
    ["Tempat", d.tempat || "-"],
    ["Peringkat", d.peringkat === "Sekolah" ? "Kolej / Sekolah" : d.peringkat || "-"],
  ];
  if (d.jawatanProjek) sel.push(["Jawatan dalam Projek", d.jawatanProjek]);
  if (d.peserta.length) sel.push(["Bil. Peserta", `${d.peserta.length + 1} orang (termasuk penyedia laporan)`]);
  if (d.kehadiran) sel.push(["Kehadiran Ahli", `${d.kehadiran.hadir}/${d.kehadiran.total} orang (${d.kehadiran.peratus}%) - Perjumpaan ${d.kehadiran.bil}`]);
  const lajurW = W / 2;
  const labelW = 78;
  const SZ = 8.5;
  for (let i = 0; i < sel.length; i += 2) {
    const pasangan = sel.slice(i, i + 2);
    const tinggiBaris = Math.max(...pasangan.map(([, v]) => hadBaris(balut(v, font, SZ, lajurW - labelW - 8), 2, font, SZ, lajurW - labelW - 8).length)) * 10.5 + 5;
    pasangan.forEach(([label, nilai], j) => {
      const x = M + j * lajurW;
      page.drawRectangle({ x, y: y - tinggiBaris, width: labelW, height: tinggiBaris, color: BRAND_LIGHT, borderColor: LINE, borderWidth: 0.5 });
      page.drawRectangle({ x: x + labelW, y: y - tinggiBaris, width: lajurW - labelW, height: tinggiBaris, borderColor: LINE, borderWidth: 0.5 });
      teks(page, label, x + 4, y - 10, SZ - 0.5, bold, BRAND);
      hadBaris(balut(nilai, font, SZ, lajurW - labelW - 8), 2, font, SZ, lajurW - labelW - 8)
        .forEach((b, k) => teks(page, b, x + labelW + 4, y - 10 - k * 10.5, SZ));
    });
    if (pasangan.length === 1) page.drawRectangle({ x: M + lajurW, y: y - tinggiBaris, width: lajurW, height: tinggiBaris, borderColor: LINE, borderWidth: 0.5 });
    y -= tinggiBaris;
  }
  y -= 8;

  // --- 2-4. Seksyen teks ---
  const BS = 9;
  const LS = 11.5;
  const blokTeks = (tajuk: string, isi: string, maks: number) => {
    seksyen(tajuk);
    const baris = hadBaris(balut(isi || "-", font, BS, W - 12), maks, font, BS, W - 12);
    const h = baris.length * LS + 8;
    page.drawRectangle({ x: M, y: y - h, width: W, height: h, borderColor: LINE, borderWidth: 0.5 });
    baris.forEach((b, k) => teks(page, b, M + 6, y - 11 - k * LS, BS));
    y -= h + 8;
  };
  blokTeks("2. OBJEKTIF", d.objektif, 4);
  blokTeks("3. AKTIVITI / PENGISIAN PROGRAM", d.aktiviti, 12);
  blokTeks("4. REFLEKSI / RUMUSAN", d.refleksi, 5);

  let noSeksyen = 5;
  if (d.peserta.length) {
    seksyen(`${noSeksyen++}. PESERTA & JAWATAN`);
    const PS = 7.5;
    const PL = 9.5;
    const teksPeserta = d.peserta.map((p, i) => `${i + 1}. ${p.nama}${p.kelas ? ` (${p.kelas})` : ""} - ${p.jawatan}`).join("   ");
    const baris = hadBaris(balut(teksPeserta, font, PS, W - 12), 6, font, PS, W - 12);
    const h = baris.length * PL + 7;
    page.drawRectangle({ x: M, y: y - h, width: W, height: h, borderColor: LINE, borderWidth: 0.5 });
    baris.forEach((b, k) => teks(page, b, M + 6, y - 9.5 - k * PL, PS));
    y -= h + 8;
  }

  // --- Gambar (grid mengisi ruang baki) ---
  const KAKI = 52;
  seksyen(`${noSeksyen}. GAMBAR AKTIVITI`);
  const ruangAtas = y - 6;
  const ruangBawah = M + KAKI;
  const n = d.gambar.length;
  const lajur = n === 1 ? 1 : 2;
  const barisG = Math.ceil(n / lajur);
  const GAP = 6;
  const sw = (W - GAP * (lajur - 1)) / lajur;
  const sh = Math.max(60, (ruangAtas - ruangBawah - GAP * (barisG - 1)) / barisG);
  for (let i = 0; i < n; i++) {
    const g = d.gambar[i];
    let img: PDFImage;
    try {
      img = g.jenis === "png" ? await doc.embedPng(g.data) : await doc.embedJpg(g.data);
    } catch {
      continue;
    }
    const c = i % lajur;
    const r = Math.floor(i / lajur);
    const sx = M + c * (sw + GAP);
    const sy = ruangAtas - (r + 1) * sh - r * GAP;
    page.drawRectangle({ x: sx, y: sy, width: sw, height: sh, color: rgb(0.96, 0.97, 0.98), borderColor: LINE, borderWidth: 0.5 });
    const sk = Math.min((sw - 4) / img.width, (sh - 4) / img.height);
    const iw = img.width * sk;
    const ih = img.height * sk;
    page.drawImage(img, { x: sx + (sw - iw) / 2, y: sy + (sh - ih) / 2, width: iw, height: ih });
  }

  // --- Kaki: disediakan oleh / pengesahan ---
  const ky = M + KAKI - 12;
  page.drawLine({ start: { x: M, y: ky + 6 }, end: { x: width - M, y: ky + 6 }, thickness: 0.5, color: LINE });
  teks(page, "Disediakan oleh:", M, ky - 6, 8, bold, BRAND);
  teks(page, d.disediakanOleh, M, ky - 18, 9, bold);
  teks(page, d.jawatanPenyedia, M, ky - 29, 8, font, GREY);
  teks(page, "Pengesahan Guru Penasihat:", M + W / 2, ky - 6, 8, bold, BRAND);
  teks(page, "Menunggu pengesahan (selepas dihantar)", M + W / 2, ky - 18, 8.5, font, GREY);
  teks(page, `Dokumen dijana oleh sistem pada ${new Date().toLocaleDateString("ms-MY")}`, M, M - 8, 7, font, GREY);

  return doc.save();
}
