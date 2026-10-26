// ===========================================================================
//  Skor SATU unit/bidang pelajar (/100) — sumber tunggal untuk kiraSemulaT6
//  (markah keseluruhan), slip pelajar & Borang Rumusan. Tulen (tanpa DB):
//  pemanggil menyerahkan rekod yang SUDAH ditapis (hadir / diluluskan).
// ===========================================================================
import type { AktivitiLuar, Kokurikulum, LaporanProjek, Pencapaian } from "@prisma/client";
import {
  bidangDariJenisKoko,
  JUMLAH_PERJUMPAAN_WAJIB,
  kiraSkor,
  markahJawatan,
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
}

export interface SkorUnit {
  unit: string;
  /** Aktiviti dihadiri dalam bahagian ini / jumlah penuh bahagian (paparan). */
  hadir: number;
  jumlahAktiviti: number;
  /** Kehadiran GABUNGAN KP + SP + BU — asas markah kehadiran (had 15 perjumpaan). */
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
  // Markah kehadiran = gabungan semua bahagian (KPM: maks 15 perjumpaan).
  const hadirGabung = p.kehadiran.filter((h) => BIDANG_KEHADIRAN.includes(h.jenisKoko)).length;
  // Pencapaian unit: tertinggi antara pencapaian & aktiviti luar yang diluluskan.
  const pcp = terbaik(
    [
      ...p.pencapaian.filter((c) => c.kategori !== "ekstra" && padan(c.namaUnit))
        .map((c) => ({ tahap: [c.kedudukan, c.peringkat].filter(Boolean).join(" ") || c.namaPencapaian, markah: c.markah })),
      ...p.aktivitiLuar.filter((x) => padan(x.namaUnit))
        .map((x) => ({ tahap: x.peringkat, markah: x.markahLuar })),
    ],
    (c) => c.markah,
  );
  // Slip memisahkan projek ikut jawatan & ikut peringkat — ambil terbaik bagi setiap satu.
  const projek = p.laporanProjek.filter((pr) => padan(pr.namaUnit) || (!pr.namaUnit && pr.jenisKoko === jenis));
  const pjJ = terbaik(projek, (pr) => markahProjekJawatan(pr.jawatanProjek));
  const pjP = terbaik(projek, (pr) => markahProjekPeringkat(pr.peringkatProjek));

  const s: SkorUnit = {
    unit,
    hadir,
    jumlahAktiviti: jk.bidang,
    hadirGabung,
    jumlahGabung: jk.gabung,
    perjumpaan: perjumpaanPajsk(hadirGabung, jk.gabung),
    mKehadiran: markahKehadiran(hadirGabung, jk.gabung),
    jawatan: k.jawatanT6 ?? "",
    mJawatan: k.jawatanT6 ? markahJawatan(k.jawatanT6, bidangDariJenisKoko(jenis)) : 0,
    peringkat: k.peringkatT6 ?? "",
    mPenglibatan: markahPenglibatan(k.peringkatT6),
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
