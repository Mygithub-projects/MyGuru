// ===========================================================================
//  Skor SATU unit/bidang pelajar (/100) — sumber tunggal untuk kiraSemulaT6
//  (markah keseluruhan), slip pelajar & Borang Rumusan. Tulen (tanpa DB):
//  pemanggil menyerahkan rekod yang SUDAH ditapis (hadir / diluluskan).
// ===========================================================================
import type { AktivitiLuar, Kokurikulum, LaporanProjek, Pencapaian } from "@prisma/client";
import {
  JUMLAH_PERJUMPAAN_WAJIB,
  kiraSkor,
  markahJawatanUnit,
  markahKehadiran,
  perjumpaanPajsk,
  markahPenglibatan,
  markahProjekJawatan,
  markahProjekPeringkat,
  nilaiEkstra,
  type Gred,
} from "./pajsk";

export interface RekodPelajar {
  /** Kehadiran yang HADIR sahaja. */
  kehadiran: { jenisKoko: string }[];
  /** Rekod yang DILULUSKAN sahaja. */
  pencapaian: Pencapaian[];
  aktivitiLuar: AktivitiLuar[];
  laporanProjek: LaporanProjek[];
  /**
   * Program Kolej (Admin) & Aktiviti Unit (SU) yang disertai — menyumbang markah
   * penglibatan. Tanpa jenisKoko → semua unit bidang; dengan jenisKoko → unit
   * bidang itu sahaja.
   */
  programKolej?: ProgramPenglibatan[];
  /** Pencapaian dari Aktiviti Unit (SU) yang disahkan — dikredit ikut bidang. */
  pencapaianBidang?: PencapaianBidang[];
}

export interface ProgramPenglibatan { nama: string; peringkat: string; jenisKoko?: string; }
export interface PencapaianBidang { jenisKoko: string; tahap: string; markah: number; }

/**
 * Penglibatan (§1.4) satu unit: tertinggi antara peringkat unit itu dan
 * peringkat Program Kolej yang disertai. Unit Perkhidmatan tidak terjejas
 * (bukan unit bidang).
 */
export function penglibatanUnit(
  k: Pick<Kokurikulum, "peringkatT6" | "jenisKoko">,
  program: ProgramPenglibatan[] = [],
): { peringkat: string; markah: number } {
  let terbaik = { peringkat: k.peringkatT6 ?? "", markah: markahPenglibatan(k.peringkatT6) };
  if (k.jenisKoko === "Perkhidmatan") return terbaik;
  for (const pr of program) {
    if (pr.jenisKoko && pr.jenisKoko !== k.jenisKoko) continue;
    const m = markahPenglibatan(pr.peringkat);
    if (m > terbaik.markah) terbaik = { peringkat: `${pr.peringkat === "Sekolah" ? "Kolej" : pr.peringkat} (${pr.nama})`, markah: m };
  }
  return terbaik;
}

export interface SkorUnit {
  unit: string;
  /** Aktiviti dihadiri dalam bahagian ini / jumlah penuh bahagian (paparan). */
  hadir: number;
  jumlahAktiviti: number;
  /** Kehadiran GABUNGAN KP + SP + BU — paparan sahaja (markah dikira ikut unit). */
  hadirGabung: number;
  jumlahGabung: number;
  perjumpaan: number;
  mKehadiran: number;
  jawatan: string;
  mJawatan: number;
  peringkat: string;
  mPenglibatan: number;
  pcpTahap: string;
  pcpMarkah: number;
  pjJawatan: string;
  pjNamaJ: string;
  pjMJ: number;
  pjTahap: string;
  pjNamaP: string;
  pjMP: number;
  /** Jumlah /100 (Sukan/Kelab/Uniform). Unit Perkhidmatan: null (ekstra). */
  jumlah: number | null;
  gred: Gred | null;
}

const terbaik = <T>(arr: T[], skor: (x: T) => number) =>
  arr.reduce<T | null>((m, x) => (m === null || skor(x) > skor(m) ? x : m), null);

/** Jumlah aktiviti penuh: bahagian ini (paparan) & gabungan semua bahagian (markah). */
export interface JumlahKehadiran {
  bidang: number;
  gabung: number;
}

const BIDANG_KEHADIRAN = ["Kelab", "Sukan", "Uniform"];

export function skorUnit(
  p: RekodPelajar,
  k: Kokurikulum,
  jk: JumlahKehadiran = { bidang: JUMLAH_PERJUMPAAN_WAJIB, gabung: JUMLAH_PERJUMPAAN_WAJIB },
): SkorUnit {
  const unit = k.namaUnitT6 ?? "";
  const jenis = k.jenisKoko;
  const padan = (u: string | null) => !!unit && u === unit;

  const hadir = p.kehadiran.filter((h) => h.jenisKoko === jenis).length;
  // Markah kehadiran IKUT UNIT (seperti Borang Rumusan Markah): hadir unit ini
  // ÷ 2 = perjumpaan, maks 15 → /15 × 50. Gabungan hanya untuk paparan.
  const hadirGabung = p.kehadiran.filter((h) => BIDANG_KEHADIRAN.includes(h.jenisKoko)).length;
  // Pencapaian unit: tertinggi antara pencapaian & aktiviti luar yang diluluskan.
  const pcp = terbaik(
    [
      ...p.pencapaian.filter((c) => c.kategori !== "ekstra" && padan(c.namaUnit))
        .map((c) => ({ tahap: [c.kedudukan, c.peringkat].filter(Boolean).join(" ") || c.namaPencapaian, markah: c.markah })),
      ...p.aktivitiLuar.filter((x) => padan(x.namaUnit))
        .map((x) => ({ tahap: x.kedudukan ? `${x.kedudukan} ${x.peringkat} (${x.namaAktiviti})` : x.peringkat, markah: x.markahLuar })),
      ...(unit ? (p.pencapaianBidang ?? []).filter((c) => c.jenisKoko === jenis) : []),
    ],
    (c) => c.markah,
  );
  // Slip memisahkan projek ikut jawatan & ikut peringkat — ambil terbaik bagi setiap satu.
  const projek = p.laporanProjek.filter((pr) => padan(pr.namaUnit) || (!pr.namaUnit && pr.jenisKoko === jenis));
  const pjJ = terbaik(projek, (pr) => markahProjekJawatan(pr.jawatanProjek));
  const pjP = terbaik(projek, (pr) => markahProjekPeringkat(pr.peringkatProjek));

  // Penglibatan: tertinggi antara peringkat unit, Program Kolej/Aktiviti Unit,
  // dan Aktiviti Luar yang disahkan bagi unit ini (Jadual D).
  const pglb = penglibatanUnit(k, [
    ...(p.programKolej ?? []),
    ...(jenis === "Perkhidmatan" ? [] : p.aktivitiLuar.filter((x) => padan(x.namaUnit)).map((x) => ({ nama: x.namaAktiviti, peringkat: x.peringkat }))),
  ]);
  const s: SkorUnit = {
    unit,
    hadir,
    jumlahAktiviti: jk.bidang,
    hadirGabung,
    jumlahGabung: jk.gabung,
    perjumpaan: perjumpaanPajsk(hadir, jk.bidang),
    mKehadiran: markahKehadiran(hadir, jk.bidang),
    // Ahli bidang tanpa jawatan dipaparkan sebagai "Ahli Biasa" (Jadual B: 2).
    jawatan: k.jawatanT6 || (jenis !== "Perkhidmatan" && k.namaUnitT6 ? "Ahli Biasa" : ""),
    mJawatan: markahJawatanUnit(k.jawatanT6, jenis, !!k.namaUnitT6),
    peringkat: pglb.peringkat,
    mPenglibatan: pglb.markah,
    pcpTahap: pcp?.tahap ?? "",
    pcpMarkah: pcp?.markah ?? 0,
    pjJawatan: pjJ?.jawatanProjek ?? "",
    pjNamaJ: pjJ?.namaProjek ?? "",
    pjMJ: pjJ ? markahProjekJawatan(pjJ.jawatanProjek) : 0,
    pjTahap: pjP?.peringkatProjek ?? "",
    pjNamaP: pjP?.namaProjek ?? "",
    pjMP: pjP ? markahProjekPeringkat(pjP.peringkatProjek) : 0,
    jumlah: null,
    gred: null,
  };
  if (jenis === "Perkhidmatan") {
    s.mJawatan = nilaiEkstra(s.jawatan);
  } else {
    const skor = kiraSkor({
      markahKehadiran: s.mKehadiran,
      markahJawatan: s.mJawatan,
      markahPenglibatan: s.mPenglibatan,
      markahPencapaian: s.pcpMarkah,
      markahProjekJawatan: s.pjMJ,
      markahProjekPeringkat: s.pjMP,
    });
    s.jumlah = skor.jumlahTeras;
    s.gred = skor.gred;
  }
  return s;
}

/** Item ekstra kurikulum: jawatan Unit Perkhidmatan + nama anugerah khas yang diluluskan. */
export function itemEkstra(p: RekodPelajar, kokurikulum: Kokurikulum[]): string[] {
  const up = kokurikulum.find((k) => k.jenisKoko === "Perkhidmatan" && k.namaUnitT6);
  return [
    ...(up?.jawatanT6 ? [up.jawatanT6] : []),
    ...p.pencapaian.filter((c) => c.kategori === "ekstra").map((c) => c.namaPencapaian),
  ];
}
