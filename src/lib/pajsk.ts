// ===========================================================================
//  Enjin Pengiraan Markah PAJSK  (Spesifikasi Kemaskini — Seksyen 1)
// ---------------------------------------------------------------------------
//  Struktur markah keseluruhan (aspek pentaksiran, jumlah = 100):
//    1. Kehadiran        — 50   (§1.2, bundar ke BAWAH)
//    2. Jawatan          — 10   (§1.3, dua jadual: Uniform vs Kelab/Sukan)
//    3. Penglibatan      — 10   (§1.4, ikut peringkat tertinggi)
//    4. Pencapaian       — 10   (§1.5, peringkat × kedudukan)
//    5. Projek (Jawatan) — 10   (§1.6)
//    6. Projek (Peringkat)—10   (§1.7)
//    ------------------------------------------
//                          100
//    7. Ekstra Kurikulum — 10   (§1.8, BONUS, berasingan daripada 100,
//                                MAX antara (a) Perkhidmatan & (b) Anugerah)
//    + Gred akhir A–E    (§1.9)
//
//  PENTING (§1.2): semua pembundaran markah = FLOOR (bundar ke BAWAH), guna
//  Math.floor(x*100)/100 — JANGAN guna toFixed()/Math.round yang membundarkan
//  ke atas.
//
//  Formula lama `(hadir/12)×40` dan struktur 7-komponen (komitmen/khidmat)
//  telah DIGANTIKAN SEPENUHNYA oleh model ini.
// ===========================================================================

import type { Peringkat } from "./enums";
import { getDict, type Locale } from "./i18n";

/** Markah penuh teras (tanpa bonus ekstra kurikulum). */
export const MARKAH_PENUH_DEFAULT = 100;

/** Jumlah perjumpaan mingguan wajib sepanjang pengajian (§1.2). */
export const JUMLAH_PERJUMPAAN_WAJIB = 30;

/** Markah penuh komponen kehadiran (§1.1). */
export const MARKAH_KEHADIRAN_PENUH = 50;

// ---------------------------------------------------------------------------
//  Pembundar — sentiasa ke BAWAH (floor/truncate), 2 titik perpuluhan (§1.2)
// ---------------------------------------------------------------------------

/**
 * Bundar ke BAWAH pada `dp` titik perpuluhan. floorTo(76.666,2) -> 76.66.
 * Epsilon kecil (1e-6 pada skala) membetulkan hanyutan titik-terapung binari
 * (cth 59.33/100*100 = 59.32999…) tanpa menjejaskan ketepatan 2dp sebenar.
 */
export function floorTo(nilai: number, dp = 2): number {
  if (!Number.isFinite(nilai)) return 0;
  const f = 10 ** dp;
  return Math.floor(nilai * f + 1e-6) / f;
}

// ===========================================================================
//  1.2  KEHADIRAN — 50 markah (bundar ke BAWAH)
// ===========================================================================

/**
 * Peratus kehadiran = FLOOR((hadir / 30) × 100, 2dp). Dibundar ke BAWAH.
 * `hadir` dihadkan pada julat [0, jumlahPerjumpaan].
 */
export function peratusKehadiran(hadir: number, jumlahPerjumpaan = JUMLAH_PERJUMPAAN_WAJIB): number {
  if (jumlahPerjumpaan <= 0) return 0;
  const h = Math.max(0, Math.min(hadir, jumlahPerjumpaan));
  return floorTo((h / jumlahPerjumpaan) * 100, 2);
}

/**
 * Markah kehadiran (skala 50) = FLOOR(peratus_kehadiran × 0.5, 2dp).
 * Contoh: 23/30 → 76.66% → 76.66 × 0.5 = 38.33 (bukan 38.34).
 */
export function markahKehadiran(hadir: number, jumlahPerjumpaan = JUMLAH_PERJUMPAAN_WAJIB): number {
  return floorTo(peratusKehadiran(hadir, jumlahPerjumpaan) * 0.5, 2);
}

// ===========================================================================
//  1.3  JAWATAN — 10 markah (dua jadual berasingan)
// ---------------------------------------------------------------------------
//  Padanan ikut kata kunci (huruf besar). Corak lebih SPESIFIK didahulukan
//  supaya "Penolong Setiausaha" tidak tersilap padan "Setiausaha" dahulu.
// ===========================================================================

export type BidangJawatan = "Uniform" | "KelabSukan";

/** (a) Pasukan Badan Beruniform (§1.3a). */
export const MARKAH_JAWATAN_UNIFORM: { pattern: RegExp; markah: number }[] = [
  { pattern: /PEGAWAI WARAN\s*(II|2)|TIMBALAN PENGERUSI|BINTARA KANAN|STAF SARJAN|SARJAN MEJAR|KETUA TRUP|KETUA PESURUHJAYA/, markah: 8 },
  { pattern: /PEGAWAI WARAN\s*(I|1)\b|SUB.?INSPEKTOR|DRUM MAJOR|PENGERUSI/, markah: 10 },
  { pattern: /PENOLONG SETIAUSAHA|PENOLONG BENDAHARI|LANS KOPERAL|KOPERAL|PENOLONG KETUA PATROL|KETUA PATROL|LASKAR KANAN/, markah: 5 },
  { pattern: /SETIAUSAHA|BENDAHARI|PENOLONG TRUP|BINTARA MUDA|KETUA PLATUN|SARJAN/, markah: 7 },
  { pattern: /AJK|PRA.?PERSETIAAN|AHLI AKTIF/, markah: 4 },
  { pattern: /AHLI BIASA|AHLI/, markah: 2 },
];

/** (b) Kelab/Persatuan dan Sukan/Permainan (§1.3b). */
export const MARKAH_JAWATAN_KELABSUKAN: { pattern: RegExp; markah: number }[] = [
  { pattern: /NAIB PENGERUSI|TIMBALAN PENGERUSI|NAIB KETUA|NAIB PRESIDEN|NAIB KAPTEN/, markah: 8 },
  { pattern: /PENGERUSI|PRESIDEN|KAPTEN|KETUA PASUKAN|KETUA RUMAH|KETUA/, markah: 10 },
  { pattern: /PENOLONG SETIAUSAHA|PENOLONG BENDAHARI/, markah: 6 },
  { pattern: /SETIAUSAHA|BENDAHARI/, markah: 7 },
  { pattern: /AHLI JAWATANKUASA|AJK/, markah: 5 },
  { pattern: /AHLI AKTIF/, markah: 4 },
  { pattern: /AHLI BIASA|AHLI/, markah: 2 },
];

/** Pilih jadual jawatan mengikut jenis bidang (jenisKoko). */
export function bidangDariJenisKoko(jenisKoko?: string | null): BidangJawatan {
  return String(jenisKoko).toLowerCase() === "uniform" ? "Uniform" : "KelabSukan";
}

/**
 * Markah jawatan (0–10). Jika teks mengandungi nilai dalam kurungan (data
 * import lama, cth "BENDAHARI (6)") nilai itu digunakan untuk keserasian.
 * Jika tidak, padan jadual (a) Uniform atau (b) Kelab/Sukan mengikut `bidang`.
 * `bidang` boleh diberi terus atau diperoleh dari jenisKoko.
 */
export function markahJawatan(
  teks?: string | null,
  bidang: BidangJawatan | string = "KelabSukan"
): number {
  const dlmKurungan = petikMarkahKurungan(teks);
  if (dlmKurungan !== null) return dlmKurungan;
  const t = buangKurungan(teks).toUpperCase();
  if (!t) return 0;
  const jadual =
    bidangDariJenisKoko(bidang) === "Uniform" ? MARKAH_JAWATAN_UNIFORM : MARKAH_JAWATAN_KELABSUKAN;
  for (const { pattern, markah } of jadual) {
    if (pattern.test(t)) return markah;
  }
  return 0;
}

// ===========================================================================
//  1.4  PENGLIBATAN — 10 markah (ikut peringkat tertinggi)
// ===========================================================================

/** Kebangsaan/Antarabangsa 10, Negeri 8, Daerah/Zon 6, Sekolah 4. */
export function markahPenglibatan(peringkat?: string | null): number {
  switch (normalizePeringkat(peringkat)) {
    case "Antarabangsa":
    case "Kebangsaan":
      return 10;
    case "Negeri":
      return 8;
    case "Zon/Daerah":
    case "Daerah":
      return 6;
    case "Sekolah":
      return 4;
    default:
      return 0;
  }
}

// ===========================================================================
//  1.5  PENCAPAIAN — 10 markah (peringkat × kedudukan)
// ---------------------------------------------------------------------------
//  Peringkat | Johan | Naib Johan | Ketiga
//  Kebangsaan |  10   |     9      |   8
//  Negeri     |   8   |     7      |   6
//  Daerah     |   6   |     5      |   4
//  Sekolah    |   4   |     3      |   2
// ===========================================================================

export const KEDUDUKAN = ["Johan", "Naib Johan", "Ketiga"] as const;
export type Kedudukan = (typeof KEDUDUKAN)[number];

/** Markah Johan (tertinggi) untuk setiap peringkat. Naib Johan −1, Ketiga −2. */
function asasPencapaian(peringkat?: string | null): number {
  switch (normalizePeringkat(peringkat)) {
    case "Antarabangsa":
    case "Kebangsaan":
      return 10;
    case "Negeri":
      return 8;
    case "Zon/Daerah":
    case "Daerah":
      return 6;
    case "Sekolah":
      return 4;
    default:
      return 0;
  }
}

export function normalizeKedudukan(teks?: string | null): Kedudukan | null {
  if (!teks) return null;
  const t = buangKurungan(teks).toUpperCase();
  if (/NAIB\s*(JOHAN|JUARA)|KEDUA|TEMPAT\s*(KE)?[-\s]*2\b|2ND|SECOND/.test(t)) return "Naib Johan";
  if (/KETIGA|KE\s*TIGA|TEMPAT\s*(KE)?[-\s]*3\b|3RD|THIRD/.test(t)) return "Ketiga";
  if (/JOHAN|JUARA|PERTAMA|TEMPAT\s*(KE)?[-\s]*1\b|1ST|FIRST|EMAS|GOLD/.test(t)) return "Johan";
  return null;
}

/**
 * Markah pencapaian (0–10) ikut peringkat + kedudukan. Jika kedudukan tidak
 * dikenali, dianggap tiada pencapaian bertaraf (return 0) — guru boleh laras.
 */
export function markahPencapaian(peringkat?: string | null, kedudukan?: string | null): number {
  const asas = asasPencapaian(peringkat);
  if (asas === 0) return 0;
  const k = normalizeKedudukan(kedudukan);
  if (!k) return 0;
  const offset = k === "Johan" ? 0 : k === "Naib Johan" ? 1 : 2;
  return Math.max(0, asas - offset);
}

// ===========================================================================
//  1.6  PROJEK (JAWATAN) — 10 markah
// ===========================================================================

export const MARKAH_PROJEK_JAWATAN: { pattern: RegExp; markah: number }[] = [
  { pattern: /PENOLONG SETIAUSAHA|PENOLONG BENDAHARI/, markah: 7 },
  { pattern: /TIMBALAN PENGERUSI|NAIB PENGERUSI|SETIAUSAHA/, markah: 9 },
  { pattern: /PENGURUS PROJEK|PENGERUSI/, markah: 10 },
  { pattern: /BENDAHARI/, markah: 8 },
  { pattern: /AHLI JAWATANKUASA|AJK/, markah: 6 },
  { pattern: /AHLI/, markah: 5 },
];

export function markahProjekJawatan(teks?: string | null): number {
  const dlmKurungan = petikMarkahKurungan(teks);
  if (dlmKurungan !== null) return dlmKurungan;
  const t = buangKurungan(teks).toUpperCase();
  if (!t) return 0;
  for (const { pattern, markah } of MARKAH_PROJEK_JAWATAN) {
    if (pattern.test(t)) return markah;
  }
  return 0;
}

// ===========================================================================
//  1.7  PROJEK (PERINGKAT) — 10 markah
// ---------------------------------------------------------------------------
//  Negeri (dan ke atas) 10, Daerah/Komuniti 8, Sekolah 6.
// ===========================================================================

export function markahProjekPeringkat(peringkat?: string | null): number {
  const t = buangKurungan(peringkat).toUpperCase();
  if (/KOMUNITI/.test(t)) return 8;
  switch (normalizePeringkat(peringkat)) {
    case "Antarabangsa":
    case "Kebangsaan":
    case "Negeri":
      return 10;
    case "Zon/Daerah":
    case "Daerah":
      return 8;
    case "Sekolah":
      return 6;
    default:
      return 0;
  }
}

// ===========================================================================
//  1.8  EKSTRA KURIKULUM — 10 markah (BONUS) = MAX((a), (b))
// ===========================================================================

/** (a) Bidang Perkhidmatan (§1.8a). */
export const MARKAH_EKSTRA_PERKHIDMATAN: { pattern: RegExp; markah: number }[] = [
  { pattern: /PENOLONG KETUA MURID|TIMBALAN PENGERUSI/, markah: 8 },
  { pattern: /KETUA MURID|PENGERUSI/, markah: 10 },
  { pattern: /PENOLONG KETUA ASRAMA|PENGAWAS PUSAT SUMBER|LEMBAGA PENGARAH KOPERASI/, markah: 6 },
  { pattern: /PENGAWAS|KETUA ASRAMA|BADAR|KETUA PRS|BADAN PERKHIDMATAN/, markah: 7 },
  { pattern: /BENDAHARI|SETIAUSAHA|KETUA BIRO|PENGAWAS KOPERASI|KETUA KELAS|KETUA TINGKATAN/, markah: 5 },
  { pattern: /AJK KECIL|KETUA BILIK|KETUA DORM|PENOLONG KETUA KELAS/, markah: 3 },
];

/** (b) Anugerah Khas (§1.8b). */
export const MARKAH_EKSTRA_ANUGERAH: { pattern: RegExp; markah: number }[] = [
  { pattern: /ARP\s*EMAS|PENGAKAP RAJA|PANDU PUTERI RAJA/, markah: 10 },
  { pattern: /ARP\s*PERAK/, markah: 7 },
  { pattern: /ARP\s*GANGSA/, markah: 5 },
  { pattern: /SUKAN.*KEBANGSAAN|ANTARABANGSA.*EMAS|LAIN.*KEBANGSAAN/, markah: 5 },
  { pattern: /SUKAN.*NEGERI|ANTARABANGSA.*PERAK|LAIN.*NEGERI/, markah: 4 },
  { pattern: /SUKAN.*(ZON|DAERAH|BAHAGIAN)|ANTARABANGSA.*GANGSA|LAIN.*(ZON|DAERAH|BAHAGIAN)/, markah: 3 },
  { pattern: /SUKAN.*SEKOLAH|ANTARABANGSA.*PENYERTAAN|LAIN.*PENYERTAAN/, markah: 2 },
];

function padanJadual(teks: string, jadual: { pattern: RegExp; markah: number }[]): number {
  for (const { pattern, markah } of jadual) if (pattern.test(teks)) return markah;
  return 0;
}

/** Nilai ekstra satu item = MAX antara jadual (a) Perkhidmatan & (b) Anugerah. */
export function nilaiEkstra(teks?: string | null): number {
  const dlmKurungan = petikMarkahKurungan(teks);
  if (dlmKurungan !== null) return Math.min(dlmKurungan, 10);
  const t = buangKurungan(teks).toUpperCase();
  if (!t) return 0;
  return Math.max(
    padanJadual(t, MARKAH_EKSTRA_PERKHIDMATAN),
    padanJadual(t, MARKAH_EKSTRA_ANUGERAH)
  );
}

/**
 * Markah Ekstra Kurikulum keseluruhan (bonus, maks 10) = nilai TERTINGGI
 * merentas semua item ekstra pelajar. (Keputusan: MAX antara (a) & (b).)
 */
export function markahEkstra(item: (string | null | undefined)[]): number {
  return Math.min(10, item.reduce((m, t) => Math.max(m, nilaiEkstra(t)), 0));
}

// ===========================================================================
//  1.9  GRED PENCAPAIAN (skala akhir /100)
// ===========================================================================

export type Gred = "A" | "B" | "C" | "D" | "E";

export function gred(markah: number): Gred {
  if (markah >= 80) return "A";
  if (markah >= 60) return "B";
  if (markah >= 40) return "C";
  if (markah >= 20) return "D";
  return "E";
}

// ---------------------------------------------------------------------------
//  Penghurai (parsers) untuk format fail PAJSK (kekal untuk import lama)
// ---------------------------------------------------------------------------

/** Petik nombor terakhir dalam kurungan. "NEGERI (14)" -> 14 ; "12 (40)" -> 40 */
export function petikMarkahKurungan(teks?: string | null): number | null {
  if (!teks) return null;
  const matches = String(teks).match(/\((\d+(?:\.\d+)?)\)/g);
  if (!matches || matches.length === 0) return null;
  const last = matches[matches.length - 1];
  const num = last.replace(/[()]/g, "");
  return parseFloat(num);
}

/** Jumlahkan SEMUA nombor dalam kurungan. */
export function jumlahMarkahKurungan(teks?: string | null): number {
  if (!teks) return 0;
  const matches = String(teks).match(/\((\d+(?:\.\d+)?)\)/g);
  if (!matches) return 0;
  return matches.reduce((s, m) => s + parseFloat(m.replace(/[()]/g, "")), 0);
}

/** "12 (40)" -> { hadir: 12, markahFail: 40 } */
export function huraiKehadiran(teks?: string | null): { hadir: number; markahFail: number | null } {
  if (!teks) return { hadir: 0, markahFail: null };
  const s = String(teks).trim();
  const hadirMatch = s.match(/^(\d+)/);
  const hadir = hadirMatch ? parseInt(hadirMatch[1], 10) : 0;
  return { hadir, markahFail: petikMarkahKurungan(s) };
}

/** Buang label, normalkan teks. "SILAT (SR)" -> "SILAT" */
export function buangKurungan(teks?: string | null): string {
  if (!teks) return "";
  return String(teks).replace(/\s*\([^)]*\)\s*/g, " ").trim();
}

/** Cuba padan teks peringkat ke enum standard. */
export function normalizePeringkat(teks?: string | null): Peringkat | null {
  if (!teks) return null;
  const t = buangKurungan(teks).toUpperCase();
  if (/ANTARABANGSA/.test(t)) return "Antarabangsa";
  if (/KEBANGSAAN/.test(t)) return "Kebangsaan";
  if (/NEGERI/.test(t)) return "Negeri";
  if (/ZON|DAERAH/.test(t)) return "Zon/Daerah";
  if (/SEKOLAH/.test(t)) return "Sekolah";
  return null;
}

/**
 * Markah penglibatan/pencapaian bagi aktiviti luar ikut peringkat.
 * Kini merujuk skala PENGLIBATAN baharu (§1.4): Keb/Ant 10, Neg 8, Dae/Zon 6, Sek 4.
 */
export function markahAktivitiLuar(peringkat: string): number {
  return markahPenglibatan(peringkat);
}

/**
 * Cadangan markah pencapaian automatik ikut peringkat (penglibatan asas).
 * Guru boleh laras + tetapkan kedudukan untuk markah pencapaian penuh.
 */
export function cadangMarkahPencapaian(peringkat?: string | null): number {
  return markahPenglibatan(peringkat ?? "");
}

/** Markah peringkat (kompat lama) — kini = markah penglibatan. */
export function markahPeringkat(teks?: string | null): number {
  const dlmKurungan = petikMarkahKurungan(teks);
  if (dlmKurungan !== null) return dlmKurungan;
  return markahPenglibatan(teks);
}

// ===========================================================================
//  Pengiraan skor terkumpul — model 100 markah + bonus ekstra (§1.1)
// ===========================================================================

export interface KomponenSkor {
  /** Markah kehadiran (0–50) — sudah dikira oleh modul Kehadiran. */
  markahKehadiran?: number;
  /** Markah jawatan tertinggi (0–10). */
  markahJawatan?: number;
  /** Markah penglibatan (0–10). */
  markahPenglibatan?: number;
  /** Markah pencapaian (0–10). */
  markahPencapaian?: number;
  /** Markah projek — jawatan (0–10). */
  markahProjekJawatan?: number;
  /** Markah projek — peringkat (0–10). */
  markahProjekPeringkat?: number;
  /** Markah ekstra kurikulum (0–10, bonus). */
  markahEkstra?: number;
}

export interface HasilSkor {
  kehadiran: number;
  jawatan: number;
  penglibatan: number;
  pencapaian: number;
  projekJawatan: number;
  projekPeringkat: number;
  ekstra: number;
  /** Jumlah teras (maks 100, tanpa bonus). */
  jumlahTeras: number;
  /** Jumlah teras + bonus ekstra (maks 110). */
  jumlahDenganBonus: number;
  /** Peratus (= jumlah teras kerana markah penuh = 100), bundar ke bawah. */
  peratus: number;
  gred: Gred;
  markahPenuh: number;
}

const had = (n: number | undefined, maks: number) => Math.min(Math.max(n ?? 0, 0), maks);

export function kiraSkor(k: KomponenSkor, markahPenuh = MARKAH_PENUH_DEFAULT): HasilSkor {
  const kehadiran = had(k.markahKehadiran, MARKAH_KEHADIRAN_PENUH);
  const jawatan = had(k.markahJawatan, 10);
  const penglibatan = had(k.markahPenglibatan, 10);
  const pencapaian = had(k.markahPencapaian, 10);
  const projekJawatan = had(k.markahProjekJawatan, 10);
  const projekPeringkat = had(k.markahProjekPeringkat, 10);
  const ekstra = had(k.markahEkstra, 10);

  const jumlahTeras = floorTo(
    kehadiran + jawatan + penglibatan + pencapaian + projekJawatan + projekPeringkat,
    2
  );
  const jumlahDenganBonus = floorTo(jumlahTeras + ekstra, 2);
  const peratus = markahPenuh > 0 ? floorTo((jumlahTeras / markahPenuh) * 100, 2) : 0;

  return {
    kehadiran,
    jawatan,
    penglibatan,
    pencapaian,
    projekJawatan,
    projekPeringkat,
    ekstra,
    jumlahTeras,
    jumlahDenganBonus,
    peratus,
    gred: gred(jumlahTeras),
    markahPenuh,
  };
}

// ---------------------------------------------------------------------------
//  Utiliti
// ---------------------------------------------------------------------------

/** Beza dua nilai (dibundar 2dp). Pulang null jika salah satu tiada. */
export function delta(a?: number | null, b?: number | null): number | null {
  if (a == null || b == null) return null;
  return Math.round((b - a) * 100) / 100;
}

/** Status pilihan unit T6 pelajar (aliran pendaftaran/pertukaran unit). */
export function statusPilihanT6(k: {
  namaUnitT5?: string | null;
  namaUnitT6?: string | null;
  statusPertukaran?: string | null;
}): "Belum Pilih" | "Mohon Tukar" | "Disahkan" | "Kekal" {
  if (k.statusPertukaran === "Pending") return "Mohon Tukar";
  if (!k.namaUnitT6) return "Belum Pilih";
  if (k.statusPertukaran === "Approved") return "Disahkan";
  if (k.namaUnitT5 && buangKurungan(k.namaUnitT5).toUpperCase() === buangKurungan(k.namaUnitT6).toUpperCase())
    return "Kekal";
  return "Disahkan";
}

/** Label dwibahasa untuk keluaran statusPilihanT6() — status itu sendiri ialah
 *  kod dalaman (kekal BM, dipadan warna dalam StatusBadge); fungsi ini terjemah
 *  untuk paparan sahaja. */
export function labelStatusPilihanT6(status: string, locale: Locale = "ms"): string {
  const c = getDict(locale).common;
  const map: Record<string, string> = {
    "Belum Pilih": c.statusBelumPilih,
    "Mohon Tukar": c.statusMohonTukar,
    Disahkan: c.disahkan,
    Kekal: c.statusKekal,
  };
  return map[status] ?? status;
}
