// Kebenaran mengurus Projek pelbagai unit (dipisah dari projek.ts untuk elak import kitaran dengan workflow.ts).
import type { Guru } from "@prisma/client";
import { guruSeluruhSekolah, unitSeliaan } from "./workflow";

/**
 * Boleh urus projek (ubah unit, tetapkan AJK, padam): HANYA guru pencipta
 * projek (dan Admin). Guru lain yang terlibat melihat sahaja.
 */
export async function bolehUrusProjek(
  guru: Guru | null,
  userId: string,
  projek: { dibuatOlehId: string | null },
): Promise<boolean> {
  if (!guru) return true; // Admin
  return projek.dibuatOlehId === userId;
}

/**
 * Boleh lihat projek: pencipta, guru berskop seluruh sekolah, atau guru
 * penasihat salah satu unit projek (semua yang terlibat).
 */
export async function bolehLihatProjek(
  guru: Guru | null,
  userId: string,
  projek: { units: string[]; dibuatOlehId: string | null },
): Promise<boolean> {
  if (!guru) return true; // Admin
  if (guruSeluruhSekolah(guru) || projek.dibuatOlehId === userId) return true;
  const units = await unitSeliaan(guru);
  return projek.units.some((u) => units.includes(u));
}
