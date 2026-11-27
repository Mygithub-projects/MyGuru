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
  jenis: "Mingguan" | "Projek" | "Aktiviti" | "Luar";
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
  /** Baris tambahan jadual Maklumat Program (cth Aktiviti Luar: Kedudukan, Guru Pengiring). */
  tambahan?: [string, string][];
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

/** Songsang teksLaporanOpr() — untuk isi semula borang bila laporan dikuiri dihantar semula. */
export function huraiTeksLaporanOpr(teks: string): { tempat: string; objektif: string; aktiviti: string; refleksi: string } {
  const LABEL = ["Tempat", "Objektif", "Aktiviti", "Refleksi"];
  const ambil = (label: string) => {
    // Bahagian bermula pada "Label: " (awal teks atau selepas baris kosong) hingga label seterusnya.
    const mula = teks.startsWith(`${label}: `) ? 0 : teks.indexOf(`\n\n${label}: `);
    if (mula < 0) return "";
    const isi = teks.slice(mula + (mula === 0 ? 0 : 2) + label.length + 2);
    const tamat = Math.min(...LABEL.map((l) => isi.indexOf(`\n\n${l}: `)).filter((i) => i >= 0), isi.length);
    return isi.slice(0, tamat).trim();
  };
  const aktiviti = ambil("Aktiviti");
  // Rekod lama/bukan OPR: seluruh teks dianggap laporan aktiviti.
  if (!aktiviti && !/^(Tempat|Objektif|Refleksi): /m.test(teks)) return { tempat: "", objektif: "", aktiviti: teks.trim(), refleksi: "" };
  return { tempat: ambil("Tempat"), objektif: ambil("Objektif"), aktiviti, refleksi: ambil("Refleksi") };
}

const str = (form: FormData, k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);

export function jenisImej(buf: Uint8Array): "jpg" | "png" | null {
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
  jenis: "Mingguan" | "Projek" | "Aktiviti" | "Luar",
  pelajar: { id: string; subRole: string | null | undefined },
  /** Laporan Projek: nama projek rasmi (dari tag guru) & peserta yang telah disahkan. */
  projek?: { nama: string; peranan: string; peserta: OprData["peserta"] },
): Promise<{ data: OprData } | { ralat: string }> {
  const namaProgram =
    projek?.nama ?? str(form, jenis === "Mingguan" ? "namaProgram" : jenis === "Aktiviti" || jenis === "Luar" ? "namaAktiviti" : "namaProjek", 200);
  const peringkat = str(form, jenis === "Projek" ? "peringkatProjek" : "peringkat", 60);
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

/** Pengesahan guru untuk dicop pada kaki OPR (dokumen disahkan). */
export interface PengesahanOpr {
  oleh: string; // cth "NAMA (Guru Penasihat) · 27/11/2026"
  komen: string | null;
}

// Kaki OPR: lajur kanan (Pengesahan Guru Penasihat). Mesti sepadan dengan janaOprPDF.
const A4 = { w: 595, h: 842 };
const KAKI_M = 34;
const KAKI_TINGGI = 52;
const KAKI_Y = KAKI_M + KAKI_TINGGI - 12; // garis asas teks kaki
const KAKI_X = KAKI_M + (A4.w - 2 * KAKI_M) / 2;
const KAKI_W = A4.w - KAKI_M - KAKI_X;

const KAKI_ATAS = KAKI_M + KAKI_TINGGI; // sempadan bawah kandungan (atas kaki)
const KOMEN_SZ = 9;
const KOMEN_LS = 11.5;
const KOMEN_W = A4.w - 2 * KAKI_M;

/** Tinggi seksyen "KOMEN GURU PENASIHAT" (bar tajuk + kotak teks). */
function tinggiKomen(font: PDFFont, komen: string): number {
  return 15 + balut(komen, font, KOMEN_SZ, KOMEN_W - 12).length * KOMEN_LS + 8;
}

/** Lukis seksyen komen guru (lebar penuh) bermula di yAtas — diletak selepas gambar. */
function lukisKomen(page: PDFPage, font: PDFFont, bold: PDFFont, komen: string, yAtas: number) {
  page.drawRectangle({ x: KAKI_M, y: yAtas - 15, width: KOMEN_W, height: 15, color: BRAND });
  page.drawText("KOMEN GURU PENASIHAT", { x: KAKI_M + 6, y: yAtas - 11, size: 9, font: bold, color: rgb(1, 1, 1) });
  const baris = balut(komen, font, KOMEN_SZ, KOMEN_W - 12);
  const h = baris.length * KOMEN_LS + 8;
  const y0 = yAtas - 15;
  page.drawRectangle({ x: KAKI_M, y: y0 - h, width: KOMEN_W, height: h, color: rgb(0.99, 0.98, 0.93), borderColor: LINE, borderWidth: 0.5 });
  baris.forEach((b, k) => page.drawText(b, { x: KAKI_M + 6, y: y0 - 11 - k * KOMEN_LS, size: KOMEN_SZ, font, color: DARK }));
}

/** Lukis blok pengesahan di lajur kanan kaki muka surat 1 (nama pengesah & tarikh). */
function lukisPengesahan(page: PDFPage, bold: PDFFont, p: PengesahanOpr) {
  page.drawText("Pengesahan Guru Penasihat:", { x: KAKI_X, y: KAKI_Y - 6, size: 8, font: bold, color: BRAND });
  const oleh = hadBaris(balut(`DISAHKAN oleh ${p.oleh}`, bold, 8, KAKI_W), 2, bold, 8, KAKI_W);
  oleh.forEach((b, k) => page.drawText(b, { x: KAKI_X, y: KAKI_Y - 17 - k * 9.5, size: 8, font: bold, color: rgb(0.02, 0.47, 0.34) }));
}

/**
 * Cop pengesahan guru pada OPR sedia ada (PDF yang dihantar pelajar): ganti
 * "Menunggu pengesahan" di kaki muka surat 1. Jika ada komen, kandungan muka
 * surat 1 dikecilkan sedikit (seragam, tanpa herot) supaya seksyen komen guru
 * muat SELEPAS gambar, sebelum kaki. Gambar & isi asal dikekalkan.
 */
export async function copPengesahanOpr(pdf: Uint8Array, p: PengesahanOpr): Promise<Uint8Array> {
  const src = await PDFDocument.load(pdf);
  const out = await PDFDocument.create();
  out.setTitle(src.getTitle() ?? "OPR");
  const font = await out.embedFont(StandardFonts.Helvetica);
  const bold = await out.embedFont(StandardFonts.HelveticaBold);
  const asal = src.getPage(0);
  const page = out.addPage([A4.w, A4.h]);

  // Kaki asal (disediakan oleh / tarikh jana) — saiz sebenar.
  const [kaki] = await out.embedPages([asal], [{ left: 0, bottom: 0, right: A4.w, top: KAKI_ATAS }]);
  page.drawPage(kaki, { x: 0, y: 0, width: A4.w, height: KAKI_ATAS });

  // Kandungan (kepala → gambar), dikecilkan jika perlu ruang untuk komen.
  const [isi] = await out.embedPages([asal], [{ left: 0, bottom: KAKI_ATAS, right: A4.w, top: A4.h }]);
  const ruangKomen = p.komen ? tinggiKomen(font, p.komen) + 8 : 0;
  const tinggiAsal = A4.h - KAKI_ATAS;
  const sk = (tinggiAsal - ruangKomen) / tinggiAsal;
  page.drawPage(isi, { x: (A4.w - A4.w * sk) / 2, y: KAKI_ATAS + ruangKomen, width: A4.w * sk, height: tinggiAsal * sk });
  if (p.komen) lukisKomen(page, font, bold, p.komen, KAKI_ATAS + ruangKomen - 4);

  // Tutup "Menunggu pengesahan" asal & cop pengesahan.
  page.drawRectangle({ x: KAKI_X - 2, y: 14, width: KAKI_W + 2, height: KAKI_Y + 3 - 14, color: rgb(1, 1, 1) });
  lukisPengesahan(page, bold, p);

  // Muka surat lain (cth lampiran senarai peserta) disalin seadanya.
  const lain = await out.copyPages(src, src.getPageIndices().slice(1));
  lain.forEach((pg) => out.addPage(pg));
  return out.save();
}

export async function janaOprPDF(d: OprData, opts: { pengesahan?: PengesahanOpr } = {}): Promise<Uint8Array> {
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
  tengah(`Laporan ${d.jenis === "Luar" ? "Aktiviti Luar" : d.jenis} Kokurikulum Tingkatan 6`, y - 42, 9, font, GREY);
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
  for (const t of d.tambahan ?? []) sel.push(t);
  if (d.peserta.length)
    sel.push(["Bil. Peserta", d.jenis === "Aktiviti" ? `${d.peserta.length} orang` : `${d.peserta.length + 1} orang (termasuk penyedia laporan)`]);
  if (d.kehadiran) sel.push(["Kehadiran Ahli", `${d.kehadiran.hadir}/${d.kehadiran.total} orang (${d.kehadiran.peratus}%) - Perjumpaan ${d.kehadiran.bil}`]);
  const lajurW = W / 2;
  const labelW = 78;
  const SZ = 8.5;
  for (let i = 0; i < sel.length; i += 2) {
    const pasangan = sel.slice(i, i + 2);
    // Label panjang (cth "Jawatan dalam Projek") dibalut supaya tidak melimpah ke sel nilai.
    const barisLabel = (l: string) => balut(l, bold, SZ - 0.5, labelW - 8);
    const tinggiBaris = Math.max(...pasangan.flatMap(([l, v]) => [
      barisLabel(l).length,
      hadBaris(balut(v, font, SZ, lajurW - labelW - 8), 2, font, SZ, lajurW - labelW - 8).length,
    ])) * 10.5 + 5;
    pasangan.forEach(([label, nilai], j) => {
      const x = M + j * lajurW;
      page.drawRectangle({ x, y: y - tinggiBaris, width: labelW, height: tinggiBaris, color: BRAND_LIGHT, borderColor: LINE, borderWidth: 0.5 });
      page.drawRectangle({ x: x + labelW, y: y - tinggiBaris, width: lajurW - labelW, height: tinggiBaris, borderColor: LINE, borderWidth: 0.5 });
      barisLabel(label).forEach((b, k) => teks(page, b, x + 4, y - 10 - k * 10.5, SZ - 0.5, bold, BRAND));
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

  // --- 5. Jadual peserta: Bil. | Nama | Kelas | Jawatan — SEMUA peserta dipapar penuh. ---
  const KAKI = 52;
  const tajukPeserta = d.jenis === "Aktiviti" ? "PESERTA & KEDUDUKAN" : "PESERTA & JAWATAN";
  const kolum = [
    { t: "Bil.", w: 30 },
    { t: "Nama Peserta", w: W - 30 - 80 - 150 },
    { t: "Kelas", w: 80 },
    { t: d.jenis === "Aktiviti" ? "Kedudukan" : "Jawatan", w: 150 },
  ];
  const TS = 9;
  const TL = 11;
  const barisPeserta = d.peserta.map((p, i) =>
    [String(i + 1), p.nama, p.kelas || "-", p.jawatan].map((v, c) => balut(v, font, TS, kolum[c].w - 10)));
  const tinggiBaris = (sel: string[][]) => Math.max(1, ...sel.map((l) => l.length)) * TL + 6;
  const TH = 16; // tinggi baris kepala jadual

  /** Lukis kepala + baris [dari..) selagi muat di atas `had`; pulangkan indeks baris seterusnya & y baharu. */
  const lukisJadual = (pg: PDFPage, yy: number, dari: number, had: number) => {
    let x = M;
    for (const k of kolum) {
      pg.drawRectangle({ x, y: yy - TH, width: k.w, height: TH, color: BRAND_LIGHT, borderColor: LINE, borderWidth: 0.5 });
      teks(pg, k.t, x + 5, yy - 11, TS, bold, BRAND);
      x += k.w;
    }
    yy -= TH;
    let i = dari;
    for (; i < barisPeserta.length; i++) {
      const sel = barisPeserta[i];
      const h = tinggiBaris(sel);
      if (yy - h < had) break;
      x = M;
      sel.forEach((baris, c) => {
        pg.drawRectangle({ x, y: yy - h, width: kolum[c].w, height: h, borderColor: LINE, borderWidth: 0.5 });
        baris.forEach((b, k) => teks(pg, b, x + 5, yy - 11.5 - k * TL, TS, c === 1 ? bold : font));
        x += kolum[c].w;
      });
      yy -= h;
    }
    return { i, y: yy };
  };

  let noSeksyen = 5;
  let lampiranPeserta = false;
  if (d.peserta.length) {
    seksyen(`${noSeksyen++}. ${tajukPeserta} (${d.peserta.length} orang)`);
    const jumlahTinggi = TH + barisPeserta.reduce((s, sel) => s + tinggiBaris(sel), 0);
    const RUANG_GAMBAR_MIN = 15 + 6 + 150; // bar tajuk + ruang minimum gambar
    if (y - jumlahTinggi - 8 >= M + KAKI + RUANG_GAMBAR_MIN) {
      y = lukisJadual(page, y, 0, -Infinity).y - 8;
    } else {
      // Terlalu ramai untuk satu muka surat — senarai penuh di lampiran (muka surat 2+).
      lampiranPeserta = true;
      const nota = `Senarai penuh ${d.peserta.length} peserta (Bil., Nama, Kelas, ${kolum[3].t}) dilampirkan di muka surat 2.`;
      page.drawRectangle({ x: M, y: y - 18, width: W, height: 18, borderColor: LINE, borderWidth: 0.5 });
      teks(page, nota, M + 6, y - 12, TS);
      y -= 18 + 8;
    }
  }

  // --- Gambar (grid mengisi ruang baki) ---
  seksyen(`${noSeksyen}. GAMBAR AKTIVITI`);
  const ruangAtas = y - 6;
  // Komen guru (dokumen disahkan) diletak SELEPAS gambar, sebelum kaki.
  const komen = opts.pengesahan?.komen || null;
  const ruangKomen = komen ? tinggiKomen(font, komen) + 8 : 0;
  const ruangBawah = M + KAKI + ruangKomen;
  const n = d.gambar.length;
  if (n === 0) {
    const h = Math.max(40, ruangAtas - ruangBawah);
    page.drawRectangle({ x: M, y: ruangAtas - h, width: W, height: h, color: rgb(0.97, 0.98, 0.98), borderColor: LINE, borderWidth: 0.5 });
    const nota = "Tiada gambar aktiviti dilampirkan.";
    teks(page, nota, M + (W - font.widthOfTextAtSize(nota, 9)) / 2, ruangAtas - h / 2 - 3, 9, font, GREY);
  }
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
  if (komen) lukisKomen(page, font, bold, komen, M + KAKI + ruangKomen - 4);
  if (opts.pengesahan) {
    lukisPengesahan(page, bold, opts.pengesahan);
  } else {
    teks(page, d.jenis === "Luar" ? "Pengesahan Guru Pengiring:" : "Pengesahan Guru Penasihat:", M + W / 2, ky - 6, 8, bold, BRAND);
    teks(page, "Menunggu pengesahan (selepas dihantar)", M + W / 2, ky - 18, 8.5, font, GREY);
  }
  teks(page, `Dokumen dijana oleh sistem pada ${new Date().toLocaleDateString("ms-MY")}`, M, M - 8, 7, font, GREY);

  // --- Lampiran: senarai penuh peserta (jika tidak muat di muka surat 1) ---
  if (lampiranPeserta) {
    let dari = 0;
    let bil = 2;
    while (dari < barisPeserta.length) {
      const pg = doc.addPage([595, 842]);
      let yy = height - M;
      teks(pg, `LAMPIRAN: SENARAI ${tajukPeserta}${dari > 0 ? " (sambungan)" : ""}`, M, yy - 12, 11, bold, BRAND);
      teks(pg, `${d.namaProgram} - ${d.namaUnit} (${d.jenisKoko}) - ${formatTarikh(d.tarikh)}`, M, yy - 26, 8.5, font, GREY);
      yy -= 34;
      pg.drawLine({ start: { x: M, y: yy }, end: { x: width - M, y: yy }, thickness: 1.5, color: BRAND });
      yy -= 8;
      const r = lukisJadual(pg, yy, dari, M + 14);
      if (r.i === dari) break; // pengaman: satu baris terlalu tinggi untuk satu muka surat
      dari = r.i;
      teks(pg, `Muka surat ${bil++} - Jumlah peserta: ${d.peserta.length} orang`, M, M - 8, 7, font, GREY);
    }
  }

  return doc.save();
}
