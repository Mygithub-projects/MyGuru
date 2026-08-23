// ===========================================================================
//  Penghurai Import — fail PAJSK (T5) & borang pendaftaran Guru
// ---------------------------------------------------------------------------
//  PENTING: No. IC / MyKad dibaca & disimpan sebagai TEKS (string). Fail Excel
//  kerap memaparkan IC dalam format saintifik (cth 7.31E11) atau menggugurkan
//  sifar di hadapan — fungsi `icToString` memastikan digit penuh dikekalkan.
// ===========================================================================
import ExcelJS from "exceljs";
import {
  petikMarkahKurungan,
  jumlahMarkahKurungan,
  huraiKehadiran,
  markahJawatan,
  markahPeringkat,
  buangKurungan,
} from "./pajsk";
import { normalizeIC } from "./auth-core";

// --- Penukar nilai sel ke teks IC yang selamat ---
export function icToString(val: unknown): string {
  if (val == null) return "";
  // ExcelJS boleh pulangkan number, string, atau objek rich-text
  let s: string;
  if (typeof val === "number") {
    // elak format saintifik & kekalkan digit
    s = val.toLocaleString("fullwide", { useGrouping: false });
  } else if (typeof val === "object" && val !== null && "text" in (val as object)) {
    s = String((val as { text: unknown }).text);
  } else {
    s = String(val);
  }
  return normalizeIC(s);
}

function cellText(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "object" && val !== null) {
    if ("text" in (val as object)) return String((val as { text: unknown }).text).trim();
    if ("result" in (val as object)) return String((val as { result: unknown }).result).trim();
    if ("richText" in (val as object))
      return (val as { richText: { text: string }[] }).richText.map((r) => r.text).join("").trim();
  }
  return String(val).trim();
}

function cellNum(val: unknown): number | null {
  const t = cellText(val).replace(/[%,\s]/g, "");
  if (t === "") return null;
  const n = parseFloat(t);
  return isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
//  PAJSK (T5)
// ---------------------------------------------------------------------------

export interface PajskKokoRow {
  jenisKoko: "Sukan" | "Kelab" | "Uniform";
  namaUnit: string;
  jawatan: string;
  peringkat: string;
  markahJawatan: number;
  markahPeringkat: number;
}

export interface PajskRow {
  bil: number | null;
  nama: string;
  noIc: string;
  koko: PajskKokoRow[];
  komitmen: number;
  khidmatSumbangan: number;
  hadir: number;
  markahKehadiran: number;
  tahapPencapaian: string;
  markahPajsk: number | null;
  peratusPajsk: number | null;
  ekstra: string[];
  ralat: string[];
}

// Indeks lajur (1-based) dari struktur fail rasmi (baris header 4)
const COL = {
  BIL: 1,
  NAMA: 2,
  IC: 3,
  SUKAN_NAMA: 4,
  SUKAN_JAWATAN: 5,
  SUKAN_PERINGKAT: 6,
  KELAB_NAMA: 7,
  KELAB_JAWATAN: 8,
  KELAB_PERINGKAT: 9,
  BB_NAMA: 10,
  BB_JAWATAN: 11,
  BB_PERINGKAT: 12,
  KOMITMEN: 13,
  KHIDMAT: 14,
  KEHADIRAN: 15,
  TAHAP: 16,
  MARKAH: 27,
  PERATUS: 28,
  PERKHIDMATAN: 29,
  ANUGERAH: 30,
} as const;

function buildKoko(
  jenis: PajskKokoRow["jenisKoko"],
  nama: string,
  jawatan: string,
  peringkat: string
): PajskKokoRow | null {
  if (!nama && !jawatan && !peringkat) return null;
  return {
    jenisKoko: jenis,
    namaUnit: buangKurungan(nama) || nama,
    jawatan: jawatan,
    peringkat: peringkat,
    markahJawatan: markahJawatan(jawatan),
    markahPeringkat: markahPeringkat(peringkat),
  };
}

// Padanan lajur ikut header. Fail PAJSK wujud dalam sekurang-kurangnya dua
// susun atur: fail rasmi (header baris 4, kedudukan lajur tetap seperti `COL`)
// dan eksport lain yang meletakkan header di baris 1 dengan nama berbeza
// (cth "MYKAD", "SUKAN PENCAPAIAN"). Kita kesan baris header dahulu; hanya
// jika tiada header dikenali barulah jatuh balik ke indeks tetap `COL`.
// Jatuh balik secara separa BAHAYA — indeks tetap pada fail bersusun atur
// lain akan membaca lajur yang salah — jadi ia semua-atau-tiada.
type PajskCols = Partial<Record<keyof typeof COL, number>>;

const normHeader = (val: unknown) => cellText(val).toUpperCase().replace(/\s+/g, " ").trim();

function petaHeader(ws: ExcelJS.Worksheet, baris: number): Record<string, number> {
  const idx: Record<string, number> = {};
  ws.getRow(baris).eachCell((cell, col) => {
    const h = normHeader(cell.value);
    if (h && !(h in idx)) idx[h] = col; // lajur pertama menang jika nama berulang
  });
  return idx;
}

// Baris header ialah baris pertama (dalam 8 baris teratas) yang mempunyai
// kedua-dua lajur nama dan lajur No. IC — tandatangan yang cukup khusus.
function cariBarisHeader(ws: ExcelJS.Worksheet): { baris: number; idx: Record<string, number> } | null {
  const adaIc = (h: string) => /KAD PENGENALAN|MYKAD|\bIC\b/.test(h);
  const adaNama = (h: string) => /NAMA|NAME|MURID|PELAJAR/.test(h);
  for (let b = 1; b <= 8; b++) {
    const idx = petaHeader(ws, b);
    const keys = Object.keys(idx);
    if (keys.some(adaIc) && keys.some(adaNama)) return { baris: b, idx };
  }
  return null;
}

// Untuk setiap unit koko, tiga lajur dibezakan secara struktur, bukan ikut
// nama tepat: lajur nama = mengandungi kata kunci unit TANPA "JAWATAN" atau
// "PERINGKAT"/"PENCAPAIAN"; lajur jawatan & peringkat pula sebaliknya.
function lajurUnit(idx: Record<string, number>, ...kataKunci: string[]) {
  const keys = Object.keys(idx);
  for (const k of kataKunci) {
    const calon = keys.filter((h) => h.includes(k));
    if (!calon.length) continue;
    const adaJawatan = (h: string) => h.includes("JAWATAN");
    const adaPeringkat = (h: string) => h.includes("PERINGKAT") || h.includes("PENCAPAIAN");
    const nama = calon.find((h) => !adaJawatan(h) && !adaPeringkat(h));
    const jawatan = calon.find(adaJawatan);
    const peringkat = calon.find((h) => adaPeringkat(h) && !adaJawatan(h));
    if (nama || jawatan || peringkat) {
      return {
        nama: nama ? idx[nama] : undefined,
        jawatan: jawatan ? idx[jawatan] : undefined,
        peringkat: peringkat ? idx[peringkat] : undefined,
      };
    }
  }
  return { nama: undefined, jawatan: undefined, peringkat: undefined };
}

function lajurPajsk(idx: Record<string, number>): PajskCols {
  const keys = Object.keys(idx);
  const cari = (...pola: RegExp[]): number | undefined => {
    for (const p of pola) {
      const hit = keys.find((h) => p.test(h));
      if (hit) return idx[hit];
    }
    return undefined;
  };
  const sukan = lajurUnit(idx, "SUKAN", "PERMAINAN");
  const kelab = lajurUnit(idx, "KELAB", "PERSATUAN");
  const bb = lajurUnit(idx, "BADAN BERUNIFORM", "BERUNIFORM", "BADAN");
  return {
    BIL: cari(/^BIL/, /^COLUMN ?1$/, /^NO\.?$/),
    NAMA: cari(/NAMA/, /MURID/, /PELAJAR/, /NAME/),
    IC: cari(/KAD PENGENALAN/, /MYKAD/, /\bIC\b/),
    SUKAN_NAMA: sukan.nama,
    SUKAN_JAWATAN: sukan.jawatan,
    SUKAN_PERINGKAT: sukan.peringkat,
    KELAB_NAMA: kelab.nama,
    KELAB_JAWATAN: kelab.jawatan,
    KELAB_PERINGKAT: kelab.peringkat,
    BB_NAMA: bb.nama,
    BB_JAWATAN: bb.jawatan,
    BB_PERINGKAT: bb.peringkat,
    KOMITMEN: cari(/KOMITMEN/),
    KHIDMAT: cari(/KHIDMAT/, /SUMBANGAN/),
    KEHADIRAN: cari(/KEHADIRAN/, /HADIR/),
    TAHAP: cari(/TAHAP/),
    MARKAH: cari(/^MARKAH/, /MARKAH PAJSK/),
    PERATUS: cari(/PERATUS/, /%/),
    PERKHIDMATAN: cari(/PERKHIDMATAN/),
    ANUGERAH: cari(/ANUGERAH/),
  };
}

export function parsePajskWorksheet(ws: ExcelJS.Worksheet): PajskRow[] {
  const rows: PajskRow[] = [];
  const header = cariBarisHeader(ws);
  const cols: PajskCols = header ? lajurPajsk(header.idx) : { ...COL };
  const barisHeader = header ? header.baris : 4; // fail rasmi: header di baris 4

  ws.eachRow((row, rowNumber) => {
    if (rowNumber <= barisHeader) return; // langkau header & apa-apa di atasnya
    const teks = (c?: number) => (c ? cellText(row.getCell(c).value) : "");
    const nombor = (c?: number) => (c ? cellNum(row.getCell(c).value) : null);

    const nama = teks(cols.NAMA);
    const icRaw = cols.IC ? row.getCell(cols.IC).value : "";
    const noIc = padIC(icRaw); // pulihkan sifar di hadapan yang digugurkan Excel
    if (!nama && !noIc) return; // baris kosong

    const ralat: string[] = [];
    if (!/^\d{12}$/.test(noIc)) ralat.push(`No. IC tidak sah: "${cellText(icRaw)}"`);

    const koko = [
      buildKoko("Sukan", teks(cols.SUKAN_NAMA), teks(cols.SUKAN_JAWATAN), teks(cols.SUKAN_PERINGKAT)),
      buildKoko("Kelab", teks(cols.KELAB_NAMA), teks(cols.KELAB_JAWATAN), teks(cols.KELAB_PERINGKAT)),
      buildKoko("Uniform", teks(cols.BB_NAMA), teks(cols.BB_JAWATAN), teks(cols.BB_PERINGKAT)),
    ].filter((k): k is PajskKokoRow => k !== null);

    const { hadir, markahFail } = huraiKehadiran(teks(cols.KEHADIRAN));

    const ekstra: string[] = [];
    const perkhidmatan = teks(cols.PERKHIDMATAN);
    const anugerah = teks(cols.ANUGERAH);
    if (perkhidmatan) ekstra.push(perkhidmatan);
    if (anugerah) ekstra.push(anugerah);

    rows.push({
      bil: nombor(cols.BIL),
      nama,
      noIc,
      koko,
      komitmen: jumlahMarkahKurungan(teks(cols.KOMITMEN)),
      khidmatSumbangan: petikMarkahKurungan(teks(cols.KHIDMAT)) ?? 0,
      hadir,
      markahKehadiran: markahFail ?? 0,
      tahapPencapaian: teks(cols.TAHAP),
      markahPajsk: nombor(cols.MARKAH),
      peratusPajsk: nombor(cols.PERATUS),
      ekstra,
      ralat,
    });
  });
  return rows;
}

// ---------------------------------------------------------------------------
//  NAMELIST (Senarai Pelajar Tingkatan 6 — roster sebenar)
// ---------------------------------------------------------------------------
//  Fail namelist.xlsx mengandungi senarai pelajar T6 semasa: KELAS, NAMA,
//  NO. KAD PENGENALAN, JANTINA, dan unit kokurikulum (Badan Beruniform,
//  Kelab/Persatuan, Sukan/Permainan). TIADA jawatan/peringkat/markah — itu
//  diisi kemudian oleh guru sepanjang sesi T6. IC sering kehilangan sifar di
//  hadapan kerana Excel menyimpannya sebagai nombor; `padIC` memulihkannya.

export interface NamelistRow {
  kelas: string;
  nama: string;
  noIc: string;
  jantina: string; // L | P
  kaum: string;
  agama: string;
  uniform: string;
  kelab: string;
  sukan: string;
  // Jawatan & peringkat T6 (pilihan — diisi jika lajur wujud dalam fail)
  jawatanUniform: string;
  peringkatUniform: string;
  jawatanKelab: string;
  peringkatKelab: string;
  jawatanSukan: string;
  peringkatSukan: string;
  // Komponen markah T6 (pilihan; null jika lajur tiada)
  komitmen: number | null;
  khidmatSumbangan: number | null;
  markahKehadiran: number | null;
  ralat: string[];
}

// Pulihkan IC 12-digit: normalkan sel (icToString tangani nombor/rich-text),
// kemudian pad sifar di hadapan jika Excel menggugurkannya (cth 11-digit
// "70406101797" -> "070406101797"). Had 10-11 digit sahaja — nombor IC benar
// hanya boleh kehilangan 1-2 sifar di hadapan (YY tahun lahir "00"-"09"); apa-apa
// yang lebih pendek ialah IC tidak sah sebenar, bukan sifar yang digugurkan, jadi
// dibiar tidak sah supaya ditangkap oleh semakan `/^\d{12}$/` di pemanggil.
export function padIC(val: unknown): string {
  const norm = icToString(val);
  return norm.length >= 10 && norm.length < 12 ? norm.padStart(12, "0") : norm;
}

export function parseNamelistWorksheet(ws: ExcelJS.Worksheet): NamelistRow[] {
  // Peta header -> indeks lajur (baris 1) supaya tahan susunan lajur berubah.
  const headerRow = ws.getRow(1);
  const idx: Record<string, number> = {};
  headerRow.eachCell((cell, col) => {
    idx[cellText(cell.value).toUpperCase().replace(/\s+/g, " ").trim()] = col;
  });
  const find = (...keys: string[]): number | undefined => {
    for (const k of keys) {
      const hit = Object.keys(idx).find((h) => h.includes(k));
      if (hit) return idx[hit];
    }
    return undefined;
  };
  const cKelas = find("KELAS");
  const cNama = find("NAMA", "NAME", "MURID", "PELAJAR");
  const cIc = find("KAD PENGENALAN", "MYKAD", "IC");
  const cJantina = find("JANTINA");
  const cKaum = find("KAUM");
  const cAgama = find("AGAMA");
  const cUniform = find("BADAN BERUNIFORM", "BERUNIFORM", "BADAN");
  const cKelab = find("KELAB PERSATUAN", "KELAB", "PERSATUAN");
  const cSukan = find("SUKAN PERMAINAN", "SUKAN", "PERMAINAN");
  // Jawatan & peringkat T6 per unit (pilihan)
  const cJawUniform = find("JAWATAN BB", "JAWATAN BADAN");
  const cPerUniform = find("PERINGKAT BB", "PERINGKAT BADAN");
  const cJawKelab = find("JAWATAN KELAB");
  const cPerKelab = find("PERINGKAT KELAB");
  const cJawSukan = find("JAWATAN SUKAN");
  const cPerSukan = find("PERINGKAT SUKAN");
  // Komponen markah T6 (pilihan)
  const cKomitmen = find("KOMITMEN");
  const cKhidmat = find("KHIDMAT");
  const cKehadiran = find("KEHADIRAN");

  const rows: NamelistRow[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // langkau header
    const get = (c?: number) => (c ? cellText(row.getCell(c).value) : "");
    const nama = get(cNama);
    const icRaw = cIc ? row.getCell(cIc).value : "";
    const noIc = padIC(icRaw);
    if (!nama && !noIc) return; // baris kosong

    const ralat: string[] = [];
    if (!/^\d{12}$/.test(noIc)) ralat.push(`No. IC tidak sah: "${cellText(icRaw)}"`);

    const jantinaRaw = get(cJantina).toUpperCase();
    const jantina = jantinaRaw.startsWith("P") ? "P" : jantinaRaw.startsWith("L") ? "L" : "";
    const num = (c?: number) => {
      const t = get(c).replace(/[^0-9.]/g, "");
      return t === "" ? null : parseFloat(t);
    };

    rows.push({
      kelas: get(cKelas),
      nama,
      noIc,
      jantina,
      kaum: get(cKaum),
      agama: get(cAgama),
      uniform: get(cUniform),
      kelab: get(cKelab),
      sukan: get(cSukan),
      jawatanUniform: get(cJawUniform),
      peringkatUniform: get(cPerUniform),
      jawatanKelab: get(cJawKelab),
      peringkatKelab: get(cPerKelab),
      jawatanSukan: get(cJawSukan),
      peringkatSukan: get(cPerSukan),
      komitmen: num(cKomitmen),
      khidmatSumbangan: num(cKhidmat),
      markahKehadiran: num(cKehadiran),
      ralat,
    });
  });
  return rows;
}

// ---------------------------------------------------------------------------
//  PELAJAR BAHARU (tanpa unit — pelajar daftar Kelab/Sukan/Uniform/Perkhidmatan
//  sendiri selepas log masuk kali pertama, tertakluk kelulusan guru penasihat).
// ---------------------------------------------------------------------------

export interface PelajarBaruRow {
  nama: string;
  kelasT6: string;
  noIc: string;
  ralat: string[];
}

export function parsePelajarBaruWorksheet(ws: ExcelJS.Worksheet): PelajarBaruRow[] {
  // Peta header -> indeks lajur (baris 1) supaya tahan susunan lajur berubah.
  const headerRow = ws.getRow(1);
  const idx: Record<string, number> = {};
  headerRow.eachCell((cell, col) => {
    idx[cellText(cell.value).toUpperCase().replace(/\s+/g, " ").trim()] = col;
  });
  const find = (...keys: string[]): number | undefined => {
    for (const k of keys) {
      const hit = Object.keys(idx).find((h) => h.includes(k));
      if (hit) return idx[hit];
    }
    return undefined;
  };
  const cNama = find("NAMA", "NAME", "MURID", "PELAJAR");
  const cKelas = find("KELAS");
  const cIc = find("KAD PENGENALAN", "MYKAD", "IC");

  const rows: PelajarBaruRow[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // langkau header
    const get = (c?: number) => (c ? cellText(row.getCell(c).value) : "");
    const nama = get(cNama);
    const icRaw = cIc ? row.getCell(cIc).value : "";
    const noIc = padIC(icRaw);
    if (!nama && !noIc) return; // baris kosong

    const ralat: string[] = [];
    if (!nama) ralat.push("Nama kosong");
    if (!/^\d{12}$/.test(noIc)) ralat.push(`No. IC tidak sah: "${cellText(icRaw)}"`);

    rows.push({ nama, kelasT6: get(cKelas), noIc, ralat });
  });
  return rows;
}

// ---------------------------------------------------------------------------
//  GURU (Google Form responses)
// ---------------------------------------------------------------------------

export interface GuruRow {
  email: string;
  nama: string;
  noIc: string;
  jawatan: string;
  kelab: string;
  sukan: string;
  badan: string;
  ralat: string[];
}

export function parseGuruWorksheet(ws: ExcelJS.Worksheet): GuruRow[] {
  // Bina peta header -> indeks lajur dari baris 1
  const headerRow = ws.getRow(1);
  const idx: Record<string, number> = {};
  headerRow.eachCell((cell, col) => {
    idx[cellText(cell.value).toUpperCase().replace(/\s+/g, " ").trim()] = col;
  });
  const find = (...keys: string[]): number | undefined => {
    for (const k of keys) {
      const hit = Object.keys(idx).find((h) => h.includes(k));
      if (hit) return idx[hit];
    }
    return undefined;
  };
  const cEmail = find("EMAIL");
  const cNama = find("NAMA", "NAME", "MURID", "PELAJAR");
  const cIc = find("KAD PENGENALAN", "MYKAD", "IC");
  const cJawatan = find("JAWATAN");
  const cKelab = find("KELAB");
  const cSukan = find("SUKAN");
  const cBadan = find("BADAN BERUNIFORM", "BADAN");

  const rows: GuruRow[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const get = (c?: number) => (c ? cellText(row.getCell(c).value) : "");
    const email = get(cEmail).toLowerCase();
    const nama = get(cNama);
    if (!email && !nama) return;
    const noIc = icToString(cIc ? row.getCell(cIc).value : "");
    const ralat: string[] = [];
    if (!email) ralat.push("Email kosong");
    rows.push({
      email,
      nama,
      noIc,
      jawatan: get(cJawatan),
      kelab: get(cKelab),
      sukan: get(cSukan),
      badan: get(cBadan),
      ralat,
    });
  });
  return rows;
}

// --- Helper: muat workbook dari path atau buffer ---
export async function loadWorkbookFromFile(path: string): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  return wb;
}
export async function loadWorkbookFromBuffer(buf: ArrayBuffer | Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as ExcelJS.Buffer);
  return wb;
}
