// Pemalar "enum" peringkat-aplikasi (skema guna String untuk mudah-alih DB).

export const ROLES = ["Pelajar", "Guru", "Admin"] as const;
export type Role = (typeof ROLES)[number];

export const SUB_ROLES = ["Pelajar", "SU", "NSU"] as const;
export type SubRole = (typeof SUB_ROLES)[number];

// Hierarki jawatan kokurikulum guru (skop akses menaik)
export const JAWATAN_GURU = [
  "GuruPenasihat",
  "GuruPemantau",
  "PenolongKetuaGP",
  "KetuaGP",
  "PenolongSU",
  "PemantauKUPP",
  "Penyelaras",
  "KetuaUnitKoko",
] as const;
export type JawatanGuru = (typeof JAWATAN_GURU)[number];

// Hanya Ketua Unit Kokurikulum, KUPP/Pemantau & Penyelaras Kokurikulum boleh mengesahkan kehadiran guru.
// Guru Pemantau (skop unit) turut dibenarkan atas keputusan pengguna 2026-11-26.
export const JAWATAN_SAHKAN_KEHADIRAN_GURU: readonly string[] = ["KetuaUnitKoko", "PemantauKUPP", "Penyelaras", "GuruPemantau"];

// Guru dengan skop seluruh sekolah (lihat SEMUA data pelajar).
// Peraturan RBAC: Ketua Unit Kokurikulum, Penyelaras Kokurikulum & Pemantau KUPP lihat semua; PenolongSU
// dikekalkan seluruh sekolah. KetuaGP, PenolongKetuaGP & GuruPenasihat pula hanya
// lihat/urus pelajar dalam UNIT yang ditugaskan kepada mereka — lihat
// unitSeliaan()/bolehAksesUnit() di workflow.ts.
export const JAWATAN_GURU_SELURUH_SEKOLAH: JawatanGuru[] = [
  "KetuaUnitKoko",
  "Penyelaras",
  "PemantauKUPP",
  "PenolongSU",
];

export const JENIS_KOKO = ["Sukan", "Kelab", "Uniform", "Perkhidmatan"] as const;
export type JenisKoko = (typeof JENIS_KOKO)[number];

// Peranan guru dalam sesuatu unit (jadual GuruPenasihatKelab §3).
// Penasihat/KetuaPenasihat/PenolongKetuaGP: lihat & urus. "Pemantau": LIHAT SAHAJA —
// unit dikira dalam unitSeliaan() (bacaan) tetapi TIDAK dalam unitUrus() (tindakan).
export const PERANAN_PENASIHAT = ["Penasihat", "KetuaPenasihat", "PenolongKetuaGP", "Pemantau"] as const;
export const PERANAN_PEMANTAU = "Pemantau";
export const MESEJ_PEMANTAU = "Anda Guru Pemantau bagi unit ini — paparan sahaja, tiada tindakan dibenarkan.";
export type PerananPenasihat = (typeof PERANAN_PENASIHAT)[number];

// Pilihan jawatan (label dikenali oleh parser markahJawatan di pajsk.ts)
export const JAWATAN_PILIHAN = [
  "Pengerusi",
  "Naib Pengerusi",
  "Ketua Pasukan",
  "Setiausaha",
  "Kapten",
  "Naib Setiausaha",
  "Bendahari",
  "Ahli Jawatankuasa",
  "Koperal",
  "Ahli Aktif",
] as const;

// Pilihan jawatan pelajar yang DITETAPKAN oleh guru penasihat — ikut Jadual B
// (Markah Jawatan, maks 10). Markah dikira oleh markahJawatan() dalam pajsk.ts.
// Kelab/Persatuan & Sukan/Permainan: Pengerusi/Presiden/Kapten 10, Naib Pengerusi 8,
// Setiausaha/Bendahari 7, Penolong SU/Bendahari 6, AJK 5, Ahli Aktif 4, Ahli Biasa 2.
export const JAWATAN_KELAB_SUKAN = [
  "Pengerusi", "Presiden", "Kapten Pasukan", "Ketua Pasukan", "Ketua Rumah",
  "Naib Pengerusi",
  "Setiausaha", "Bendahari",
  "Penolong Setiausaha", "Penolong Bendahari",
  "AJK",
  "Ahli Aktif",
  "Ahli Biasa",
] as const;

// Pasukan Badan Beruniform: 10 / 8 / 7 / 5 / 4 / 2 (lihat MARKAH_JAWATAN_UNIFORM).
export const JAWATAN_UNIFORM = [
  "Pengerusi", "Pegawai Waran I", "Sub-Inspektor", "Drum Major",
  "Naib Pengerusi", "Pegawai Waran II", "Bintara Kanan", "Staf Sarjan", "Sarjan Mejar", "Ketua Trup",
  "Setiausaha", "Bendahari", "Sarjan", "Penolong Trup", "Bintara Muda", "Ketua Platun",
  "Penolong Setiausaha", "Penolong Bendahari", "Koperal", "Lans Koperal",
  "Ketua Patrol", "Penolong Ketua Patrol", "Laskar Kanan", "AJK",
  "Pra-Persetiaan", "Ahli Aktif",
  "Ahli Biasa",
] as const;

/** Semua jawatan bidang (Kelab/Sukan/Uniform) yang sah. */
export const JAWATAN_PELAJAR = [...new Set([...JAWATAN_KELAB_SUKAN, ...JAWATAN_UNIFORM])] as readonly string[];
export type JawatanPelajar = (typeof JAWATAN_KELAB_SUKAN)[number] | (typeof JAWATAN_UNIFORM)[number];

/** Senarai pilihan jawatan ikut jenis bidang (Perkhidmatan → Jadual 1 ekstra). */
export function pilihanJawatan(jenisKoko: string): readonly string[] {
  if (jenisKoko === "Perkhidmatan") return JAWATAN_PERKHIDMATAN;
  return jenisKoko === "Uniform" ? JAWATAN_UNIFORM : JAWATAN_KELAB_SUKAN;
}

/**
 * Pilihan jawatan Unit Perkhidmatan — ikut "Perkara" Jadual 1 Panduan KPM
 * (skor ekstra dalam kurungan pada label UI). Guru memilih baris yang tepat,
 * cth. Pengerusi Majlis/Ketua Murid (10) vs Pengerusi Badan Perkhidmatan (7).
 */
export const JAWATAN_PERKHIDMATAN = [
  "Ketua Murid",
  "Pengerusi",
  "Penolong Ketua Murid",
  "Timbalan Pengerusi",
  "Pengerusi Badan Perkhidmatan",
  "Pengurusan Utama",
  "Pengawas",
  "Ketua Asrama",
  "Ketua PRS",
  "Penolong Ketua Asrama",
  "Pengawas Pusat Sumber",
  "Ahli Lembaga Pengarah Koperasi",
  "AJK Utama",
  "Setiausaha",
  "Bendahari",
  "Ketua Biro",
  "Pengawas Koperasi",
  "Ketua Kelas",
  "Ketua Tingkatan",
  "AJK Kecil Biro",
  "Ketua Bilik",
  "Ketua Dorm",
  "Penolong Ketua Kelas",
  "Penolong Ketua Bilik",
  "Ahli",
] as const;

/** Nama lama → nama semasa, supaya rekod lama dipapar sebagai pilihan yang setara. */
export const JAWATAN_PELAJAR_LAMA: Record<string, JawatanPelajar> = {
  Ketua: "Pengerusi",
  "Naib Ketua": "Naib Pengerusi",
  "Naib Setiausaha": "Penolong Setiausaha",
  "Naib Bendahari": "Penolong Bendahari",
};

export const STATUS_SEMAKAN = ["Draft", "Pending", "Approved", "Kuiri"] as const;
export type StatusSemakan = (typeof STATUS_SEMAKAN)[number];

export const STATUS_PERTUKARAN = ["None", "Pending", "Approved", "Reject"] as const;
export type StatusPertukaran = (typeof STATUS_PERTUKARAN)[number];

// Status pengesahan butiran pelajar oleh Ketua GP/Penolong Ketua GP (skop unit).
export const STATUS_BUTIRAN = ["Pending", "Approved"] as const;
export type StatusButiran = (typeof STATUS_BUTIRAN)[number];

// Peranan dalam unit (GuruPenasihatKelab.peranan) yang dibenarkan mengesahkan
// butiran pelajar — HANYA Ketua GP (K) & Penolong Ketua GP (P) bagi unit pelajar
// itu sendiri. Guru Penasihat biasa boleh melihat sahaja; skop sekolah tidak.
export const PERANAN_BOLEH_SAHKAN_BUTIRAN = ["KetuaPenasihat", "PenolongKetuaGP"] as const;

// Peringkat penyertaan -> julat markah rujukan (spec 5.3 / 5.5)
export const PERINGKAT = [
  "Sekolah",
  "Daerah",
  "Zon/Daerah",
  "Negeri",
  "Kebangsaan",
  "Antarabangsa",
] as const;
export type Peringkat = (typeof PERINGKAT)[number];

// Aktiviti Unit (dihantar SU/NSU) — peringkat ikut Jadual D/E & kedudukan peserta.
export const PERINGKAT_AKTIVITI_UNIT = ["Sekolah", "Daerah", "Negeri", "Kebangsaan"] as const;
export const KEDUDUKAN_AKTIVITI = ["Penyertaan", "Johan", "Naib Johan", "Ketiga"] as const;
export type KedudukanAktiviti = (typeof KEDUDUKAN_AKTIVITI)[number];

// Borang pelajar: Aktiviti Peringkat Kolej dikunci pada "Sekolah"; Aktiviti Luar
// ikut senarai peringkat KPM di luar sekolah.
export const PERINGKAT_KOLEJ = "Sekolah";
export const PERINGKAT_LUAR = ["Zon/Daerah", "Daerah", "Negeri", "Kebangsaan", "Antarabangsa"] as const;

export const JANTINA = ["L", "P"] as const;
export const KAUM = ["Melayu", "Cina", "India", "Lain-lain"] as const;
export const AGAMA = ["Islam", "Buddha", "Hindu", "Kristian", "Lain-lain"] as const;

// ---------------------------------------------------------------------------
//  Ekstra Kurikulum — Anugerah Khas (dokumen "MARKAH EKSTRA KURI", tab ANUGERAH
//  KHAS KURI). Pelajar hantar program; Ketua Unit Kokurikulum memilih perkara di
//  bawah semasa mengesahkan, dan markah = skor perkara itu. Markah Ekstra
//  keseluruhan = MAX(jawatan Unit Perkhidmatan, anugerah diluluskan), had 10.
// ---------------------------------------------------------------------------
export const ANUGERAH_KHAS: readonly { perkara: string; skor: number }[] = [
  { perkara: "ANUGERAH REMAJA PERDANA (ANJURAN KBS) (EMAS)", skor: 10 },
  { perkara: "ANUGERAH REMAJA PERDANA (ANJURAN KBS) (PERAK)", skor: 7 },
  { perkara: "ANUGERAH REMAJA PERDANA (ANJURAN KBS) (GANGSA)", skor: 5 },
  { perkara: "PENGAKAP RAJA / PANDU PUTERI RAJA", skor: 10 },
  { perkara: "ANUGERAH KHAS SUKAN (KEBANGSAAN)", skor: 5 },
  { perkara: "ANUGERAH KHAS SUKAN (NEGERI)", skor: 4 },
  { perkara: "ANUGERAH KHAS SUKAN (ZON/DAERAH/BAHAGIAN)", skor: 3 },
  { perkara: "ANUGERAH KHAS SUKAN (SEKOLAH)", skor: 2 },
  { perkara: "PENYERTAAN PERINGKAT ANTARABANGSA (EMAS)", skor: 5 },
  { perkara: "PENYERTAAN PERINGKAT ANTARABANGSA (PERAK)", skor: 4 },
  { perkara: "PENYERTAAN PERINGKAT ANTARABANGSA (GANGSA)", skor: 3 },
  { perkara: "PENYERTAAN PERINGKAT ANTARABANGSA (PENYERTAAN)", skor: 2 },
  { perkara: "ANUGERAH-ANUGERAH LAIN (KEBANGSAAN)", skor: 5 },
  { perkara: "ANUGERAH-ANUGERAH LAIN (NEGERI)", skor: 4 },
  { perkara: "ANUGERAH-ANUGERAH LAIN (ZON/DAERAH/BAHAGIAN)", skor: 3 },
  { perkara: "ANUGERAH-ANUGERAH LAIN (PENYERTAAN)", skor: 2 },
];
/** Peringkat yang pelajar pilih semasa menghantar program Ekstra Kurikulum. */
export const PERINGKAT_EKSTRA = ["Sekolah", "Zon/Daerah/Bahagian", "Negeri", "Kebangsaan", "Antarabangsa"] as const;
/** Hanya jawatan ini (dan Admin) boleh mengesahkan Ekstra Kurikulum. */
export const JAWATAN_SAHKAN_EKSTRA: readonly string[] = ["KetuaUnitKoko"];
