import type { JawatanGuru } from "./enums";

/** Petakan teks jawatan bebas dari borang guru ke enum JawatanGuru. */
export function mapJawatanGuru(teks?: string | null): JawatanGuru {
  const t = (teks || "").toUpperCase();
  if (/PENYELARAS/.test(t)) return "Penyelaras";
  if (/PEMANTAU|KUPP/.test(t)) return "PemantauKUPP";
  if (/PENOLONG\s+SETIAUSAHA|PEN\.?\s*SU/.test(t)) return "PenolongSU";
  if (/PENOLONG\s+KETUA/.test(t)) return "PenolongKetuaGP";
  if (/KETUA\s+GURU\s+PENASIHAT|KETUA\s+GP/.test(t)) return "KetuaGP";
  return "GuruPenasihat";
}
