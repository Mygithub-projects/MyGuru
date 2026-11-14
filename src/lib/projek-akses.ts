// Kebenaran mengurus Projek pelbagai unit (dipisah dari projek.ts untuk elak import kitaran dengan workflow.ts).
import type { Guru } from "@prisma/client";
import { guruSeluruhSekolah, unitSeliaan } from "./workflow";

/**
 * Boleh urus projek (edit, tag SU/NSU, padam): Admin, guru berskop seluruh
 * sekolah, pencipta projek, atau guru penasihat salah satu unit projek.
 */
export async function bolehUrusProjek(
  guru: Guru | null,
  userId: string,
  projek: { units: string[]; dibuatOlehId: string | null },
): Promise<boolean> {
  if (!guru) return true; // Admin
  if (guruSeluruhSekolah(guru) || projek.dibuatOlehId === userId) return true;
  const units = await unitSeliaan(guru);
  return projek.units.some((u) => units.includes(u));
}
