// Pemalar "enum" peringkat-aplikasi (skema guna String untuk mudah-alih DB).

export const ROLES = ["Pelajar", "Guru", "Admin"] as const;
export type Role = (typeof ROLES)[number];

export const SUB_ROLES = ["Pelajar", "SU", "NSU"] as const;
export type SubRole = (typeof SUB_ROLES)[number];

// Hierarki jawatan kokurikulum guru (skop akses menaik)
export const JAWATAN_GURU = [
  "GuruPenasihat",
  "PenolongKetuaGP",
  "KetuaGP",
  "PenolongSU",
  "PemantauKUPP",
  "Penyelaras",
] as const;
export type JawatanGuru = (typeof JAWATAN_GURU)[number];

// Guru dengan skop seluruh sekolah (lihat SEMUA data pelajar).
// Peraturan RBAC: Penyelaras Kokurikulum & Pemantau KUPP lihat semua; PenolongSU
// dikekalkan seluruh sekolah. KetuaGP, PenolongKetuaGP & GuruPenasihat pula hanya
// lihat/urus pelajar dalam UNIT yang ditugaskan kepada mereka — lihat
// unitSeliaan()/bolehAksesUnit() di workflow.ts.
export const JAWATAN_GURU_SELURUH_SEKOLAH: JawatanGuru[] = [
  "Penyelaras",
  "PemantauKUPP",
  "PenolongSU",
];

export const JENIS_KOKO = ["Sukan", "Kelab", "Uniform", "Perkhidmatan"] as const;
export type JenisKoko = (typeof JENIS_KOKO)[number];

// Peranan guru dalam sesuatu unit (jadual GuruPenasihatKelab §3).
// Buat masa ini kedua-dua peranan mempunyai kuasa sama (lihat & sahkan).
export const PERANAN_PENASIHAT = ["Penasihat", "KetuaPenasihat"] as const;
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

// Pilihan jawatan pelajar yang DITETAPKAN oleh guru penasihat (spec guru §5).
// Markah dipetakan dalam MARKAH_JAWATAN (pajsk.ts): Ketua 10, Naib Ketua 8,
// Setiausaha 7, Penolong Setiausaha 6, AJK 5.
export const JAWATAN_PELAJAR = [
  "Ketua",
  "Naib Ketua",
  "Setiausaha",
  "Penolong Setiausaha",
  "AJK",
] as const;
export type JawatanPelajar = (typeof JAWATAN_PELAJAR)[number];

export const STATUS_SEMAKAN = ["Draft", "Pending", "Approved", "Kuiri"] as const;
export type StatusSemakan = (typeof STATUS_SEMAKAN)[number];

export const STATUS_PERTUKARAN = ["None", "Pending", "Approved", "Reject"] as const;
export type StatusPertukaran = (typeof STATUS_PERTUKARAN)[number];

// Status pengesahan butiran pelajar oleh Guru Penasihat/Ketua GP (skop unit).
export const STATUS_BUTIRAN = ["Pending", "Approved"] as const;
export type StatusButiran = (typeof STATUS_BUTIRAN)[number];

// Jawatan koko yang dibenarkan mengesahkan butiran pelajar — HANYA guru
// penasihat unit itu sendiri (bukan Penolong Ketua GP, bukan skop sekolah).
export const JAWATAN_BOLEH_SAHKAN_BUTIRAN: JawatanGuru[] = ["GuruPenasihat", "KetuaGP"];

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

export const JANTINA = ["L", "P"] as const;
export const KAUM = ["Melayu", "Cina", "India", "Lain-lain"] as const;
export const AGAMA = ["Islam", "Buddha", "Hindu", "Kristian", "Lain-lain"] as const;
