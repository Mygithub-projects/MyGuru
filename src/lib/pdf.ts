// ===========================================================================
//  Penjanaan PDF — e-Cert & Butiran Diri (pdf-lib, tanpa pelayar headless).
// ===========================================================================
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage } from "pdf-lib";
import { getDict, type Locale } from "./i18n";
import type { BarisRumusan } from "./rumusan";
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
  center("e-Cert · EzKokoT6", Y.subtajuk, 10, font, KELABU);
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
  /** Baris rumusan pelajar (satu setiap unit) — sumber sama dengan Slip PAJSK pelajar. */
  rows: BarisRumusan[];
  markahT6: number | null;
  gred: string | null;
  markahEkstra: number;
  /** Butiran disahkan guru? Jika belum, jumlah & gred tidak dipaparkan. */
  disahkan: boolean;
}

const BAHAGIAN_SLIP = ["Sukan", "Kelab", "Uniform"] as const;

interface SelSlip {
  r: number; c: number; rs?: number; cs?: number;
  teks: string; bold?: boolean; fill?: boolean; tengah?: boolean; kanan?: boolean;
  size?: number; warna?: ReturnType<typeof rgb>; nota?: string; italik?: boolean;
}

/**
 * PDF Butiran Diri = Rekod Pentaksiran Kokurikulum (PAJSK) — susun atur sama
 * dengan SlipPajsk di papan pemuka pelajar (A4 landskap).
 */
export async function janaButiranPDF(d: ButiranData): Promise<Uint8Array> {
  const locale = d.locale ?? "ms";
  const dict = getDict(locale);
  const t = dict.pelajar.slip;
  const label: Record<string, string> = { Sukan: dict.common.sukan, Kelab: dict.common.kelab, Uniform: dict.common.uniform };
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 landskap
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);
  // Helvetica (WinAnsi) tidak boleh mengekod semua aksara — ganti yang tidak disokong.
  const set = new Set(font.getCharacterSet());
  const selamat = (s: string) => [...s].map((ch) => (set.has(ch.codePointAt(0)!) ? ch : "?")).join("");
  const M = 36;
  let y = height - M;

  // Kepala: logo, institusi, nama pelajar
  const logo = await muatLogo(doc);
  if (logo) {
    const dims = logo.scale(40 / logo.height);
    page.drawImage(logo, { x: M, y: y - 40, width: dims.width, height: dims.height });
  }
  page.drawText(selamat(INSTITUSI), { x: M + 56, y: y - 14, size: 12, font: bold, color: BRAND });
  page.drawText(selamat(t.title.toUpperCase()), { x: M + 56, y: y - 30, size: 10, font: bold, color: DARK });
  y -= 58;
  page.drawText(selamat(d.nama), { x: M, y, size: 13, font: bold, color: DARK });
  y -= 15;
  page.drawText(selamat(`${d.kelas}  ·  No. KP: ${d.noIc}`), { x: M, y, size: 10, font, color: GREY });
  y -= 14;

  // Data lajur (sama dengan SlipPajsk)
  const sel = (teks: string, markah?: number | null) =>
    !teks ? "—" : markah == null ? teks.toUpperCase() : `${teks.toUpperCase()} (${markah})`;
  const lajur = BAHAGIAN_SLIP.map((b) => d.rows.find((r) => r.bahagian === b) ?? null);
  const up = d.rows.find((r) => r.bahagian === "Perkhidmatan") ?? null;
  const anugerah = d.rows.find((r) => r.anugerah)?.anugerah ?? "";
  const mAnugerah = d.rows.find((r) => r.anugerah)?.mAnugerah ?? 0;
  const tiga = (r0: number, f: (r: BarisRumusan) => string, extra: Partial<SelSlip> = {}): SelSlip[] =>
    lajur.map((r, i) => ({ r: r0, c: 2 + i, teks: r ? f(r) : "—", warna: r ? DARK : GREY, ...extra }));
  const markahAkhir = !d.disahkan
    ? (locale === "en"
      ? "Marks are computed once particulars are confirmed by the Head/Assistant Head Advisor Teacher."
      : "Markah dikira selepas butiran disahkan oleh Ketua GP / Penolong Ketua GP.")
    : d.markahT6 == null ? "—" : `${Math.round(d.markahT6 * 10) / 100} / ${d.gred ?? "-"}`;

  const sel_: SelSlip[] = [
    { r: 0, c: 0, teks: t.elemen.toUpperCase(), bold: true, fill: true },
    { r: 0, c: 1, teks: t.aspek.toUpperCase(), bold: true, fill: true },
    ...BAHAGIAN_SLIP.map((b, i): SelSlip => ({ r: 0, c: 2 + i, teks: label[b].toUpperCase(), bold: true, fill: true })),
    { r: 0, c: 5, teks: t.ekstra.toUpperCase(), bold: true, fill: true },
    // Pelibatan
    { r: 1, c: 0, rs: 4, teks: t.pelibatan, bold: true },
    { r: 1, c: 1, teks: t.aktiviti },
    ...lajur.map((r, i): SelSlip => ({ r: 1, c: 2 + i, teks: r ? r.unit.toUpperCase() : t.belumDaftar, bold: !!r, italik: !r, warna: r ? DARK : GREY })),
    { r: 1, c: 5, teks: t.perkhidmatan, bold: true, fill: true, tengah: true },
    { r: 2, c: 1, teks: t.jawatan },
    ...tiga(2, (r) => sel(r.jawatan, r.mJawatan)),
    { r: 2, c: 5, teks: up ? `${up.unit.toUpperCase()} — ${sel(up.jawatan, up.mJawatan)}` : "—" },
    { r: 3, c: 1, teks: t.peringkat },
    ...tiga(3, (r) => sel(r.peringkat, r.mPenglibatan)),
    { r: 3, c: 5, teks: t.anugerah, bold: true, fill: true, tengah: true },
    { r: 4, c: 1, teks: t.tahapPencapaian },
    ...tiga(4, (r) => sel(r.pcpTahap, r.pcpTahap ? r.pcpMarkah : null)),
    { r: 4, c: 5, teks: sel(anugerah, anugerah ? mAnugerah : null) },
    // Projek
    { r: 5, c: 0, cs: 2, teks: t.namaProjek, bold: true },
    ...tiga(5, (r) => (r.pjNamaJ || r.pjNamaP || "—").toUpperCase()),
    { r: 5, c: 5, rs: 4, teks: "" },
    { r: 6, c: 0, rs: 2, teks: t.pengurusan, bold: true },
    { r: 6, c: 1, teks: t.jawatan },
    ...tiga(6, (r) => sel(r.pjJawatan, r.pjJawatan ? r.pjMJ : null)),
    { r: 7, c: 1, teks: t.peringkatPelaksanaan },
    ...tiga(7, (r) => sel(r.pjTahap, r.pjTahap ? r.pjMP : null)),
    // Penyertaan
    { r: 8, c: 0, teks: t.penyertaan, bold: true },
    { r: 8, c: 1, teks: t.kehadiran, nota: t.kehadiranNote },
    ...tiga(8, (r) => `${r.perjumpaan} (${r.mKehadiran})`, { tengah: true }),
    // Pelaporan markah
    { r: 9, c: 0, cs: 6, teks: t.pelaporan.toUpperCase(), bold: true, fill: true, tengah: true },
    { r: 10, c: 0, cs: 2, teks: t.jumlahSkor, bold: true, kanan: true },
    ...tiga(10, (r) => (d.disahkan && r.jumlah != null ? `${r.jumlah} (${r.jumlah}%)` : "—"), { bold: true, tengah: true }),
    { r: 10, c: 5, teks: d.disahkan ? String(d.markahEkstra) : "—", bold: true, tengah: true },
    // GPA/CGPA — markah keseluruhan (purata 2 bidang terbaik + ekstra), ikut slip KPM.
    { r: 11, c: 0, cs: 2, teks: t.gpa, bold: true, kanan: true },
    { r: 11, c: 2, cs: 4, teks: `${t.gpaTeks} : ${d.disahkan && d.markahT6 != null ? d.markahT6 : "—"}`, bold: true },
    { r: 12, c: 0, cs: 2, teks: t.gred10, bold: true, kanan: true },
    {
      r: 12, c: 2, cs: 4, teks: markahAkhir, bold: true, tengah: true,
      size: d.disahkan ? 12 : 9, warna: d.disahkan ? BRAND : rgb(0.7, 0.45, 0.05),
    },
  ];

  // Geometri jadual
  const lebar = [88, 128, 156, 156, 132, 110];
  const xKol = lebar.reduce<number[]>((a, w) => [...a, a[a.length - 1] + w], [M]);
  const PAD = 4, SIZE = 8.5, LH = 10.5, NOTA = 7;
  const fontOf = (s: SelSlip) => (s.bold ? bold : s.italik ? oblique : font);
  const balut = (teks: string, f: PDFFont, size: number, maks: number): string[] => {
    const baris: string[] = [];
    for (const perenggan of selamat(teks).split("\n")) {
      let semasa = "";
      for (const kata of perenggan.split(/\s+/)) {
        const cuba = semasa ? `${semasa} ${kata}` : kata;
        if (f.widthOfTextAtSize(cuba, size) <= maks || !semasa) semasa = cuba;
        else { baris.push(semasa); semasa = kata; }
      }
      baris.push(semasa);
    }
    return baris;
  };
  const lebarSel = (s: SelSlip) => xKol[s.c + (s.cs ?? 1)] - xKol[s.c] - PAD * 2;
  const tinggiPerlu = (s: SelSlip) => {
    const size = s.size ?? SIZE;
    const n = balut(s.teks, fontOf(s), size, lebarSel(s)).length;
    const nNota = s.nota ? balut(s.nota, font, NOTA, lebarSel(s)).length : 0;
    return n * Math.max(LH, size + 2) + nNota * (NOTA + 2) + PAD * 2;
  };
  const bilBaris = 13;
  const tinggi = Array.from({ length: bilBaris }, (_, r) =>
    Math.max(18, ...sel_.filter((s) => s.r === r && (s.rs ?? 1) === 1).map(tinggiPerlu)));
  const yBaris = tinggi.reduce<number[]>((a, h) => [...a, a[a.length - 1] - h], [y]);
  const BORDER = rgb(0.8, 0.83, 0.87), FILL = rgb(0.95, 0.96, 0.97);

  for (const s of sel_) {
    const xa = xKol[s.c], xb = xKol[s.c + (s.cs ?? 1)];
    const ya = yBaris[s.r], yb = yBaris[s.r + (s.rs ?? 1)];
    page.drawRectangle({
      x: xa, y: yb, width: xb - xa, height: ya - yb,
      color: s.fill ? FILL : undefined, borderColor: BORDER, borderWidth: 0.6,
    });
    const size = s.size ?? SIZE;
    const f = fontOf(s);
    const lh = Math.max(LH, size + 2);
    const baris = balut(s.teks, f, size, lebarSel(s));
    const nota = s.nota ? balut(s.nota, font, NOTA, lebarSel(s)) : [];
    // Sel tengah/kanan dipusatkan menegak; selebihnya rapat atas.
    const jumlahT = baris.length * lh + nota.length * (NOTA + 2);
    let ty = s.tengah || s.kanan ? ya - (ya - yb - jumlahT) / 2 - size : ya - PAD - size;
    for (const b of baris) {
      const w = f.widthOfTextAtSize(b, size);
      const tx = s.tengah ? (xa + xb - w) / 2 : s.kanan ? xb - PAD - w : xa + PAD;
      page.drawText(b, { x: tx, y: ty, size, font: f, color: s.warna ?? DARK });
      ty -= lh;
    }
    for (const b of nota) {
      page.drawText(b, { x: xa + PAD, y: ty + 2, size: NOTA, font, color: GREY });
      ty -= NOTA + 2;
    }
  }
  y = yBaris[bilBaris] - 14;

  for (const b of balut(t.note, font, 7.5, width - M * 2)) {
    page.drawText(b, { x: M, y, size: 7.5, font, color: GREY });
    y -= 10;
  }
  const dijana = locale === "en" ? "Generated by EzKokoT6" : "Dijana oleh EzKokoT6";
  page.drawText(selamat(`${dijana} · ${new Date().toLocaleDateString("ms-MY")}`), { x: M, y: 24, size: 7.5, font, color: GREY });
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
  page.drawText("Dokumen dijana oleh EzKokoT6. Sah tanpa tandatangan basah.", { x: 40, y: 44, size: 8, font, color: GREY });
  return doc.save();
}
