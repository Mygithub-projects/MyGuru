// Jawatan dalam projek — selamat untuk komponen klien (tiada import pelayan).
// Nilai mesti sepadan dengan MARKAH_PROJEK_JAWATAN / markahProjekJawatan (src/lib/pajsk.ts).
export const JAWATAN_PROJEK = [
  "Pengurus Projek", "Pengerusi", "Timbalan Pengerusi", "Naib Pengerusi", "Setiausaha", "Naib Setiausaha",
  "Bendahari", "Penolong Setiausaha", "Penolong Bendahari", "Ahli Jawatankuasa", "Ahli",
] as const;

/**
 * Jawatan teras yang DITETAPKAN guru penasihat semasa tag (ProjekTag.peranan).
 * Hanya SU / NSU boleh mengisi Laporan Projek; jawatan lain diisi SU/NSU.
 */
export const PERANAN_PROJEK = ["Pengerusi", "NaibPengerusi", "SU", "NSU"] as const;
export type PerananProjek = (typeof PERANAN_PROJEK)[number];
export const PERANAN_PELAPOR: readonly string[] = ["SU", "NSU"];

export const LABEL_PERANAN: Record<string, string> = {
  Pengerusi: "Pengerusi",
  NaibPengerusi: "Naib Pengerusi",
  SU: "Setiausaha (SU)",
  NSU: "Naib Setiausaha (NSU)",
};

/** Jawatan (untuk markah) bagi setiap peranan yang ditetapkan guru. */
export const JAWATAN_PERANAN: Record<string, string> = {
  Pengerusi: "Pengerusi",
  NaibPengerusi: "Naib Pengerusi",
  SU: "Setiausaha",
  NSU: "Naib Setiausaha",
};

/** Jawatan yang boleh diberi oleh SU/NSU kepada peserta lain (jawatan teras milik guru). */
export const JAWATAN_PESERTA = [
  "Bendahari", "Penolong Setiausaha", "Penolong Bendahari", "Ahli Jawatankuasa", "Ahli",
] as const;
