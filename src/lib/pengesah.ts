// Nama pengesah laporan SU/NSU (dipapar pada PDF laporan yang disahkan).
import type { Guru } from "@prisma/client";
import { prisma } from "./prisma";
import type { SessionPayload } from "./auth-core";

/** Label pengesah semasa pengesahan: "NAMA GURU (Guru Penasihat)" atau "NAMA (Pentadbir)". */
export function labelPengesah(guru: Guru | null, session: SessionPayload): string {
  return guru ? `${guru.nama} (Guru Penasihat)` : `${session.nama} (Pentadbir)`;
}

/**
 * Teks "Disahkan oleh" untuk PDF. Rekod baharu menyimpan nama pengesah; rekod
 * lama (disahkan sebelum medan ini wujud) jatuh kepada guru penasihat unit.
 */
export async function teksDisahkanOleh(rec: {
  disahkanOleh: string | null;
  tarikhSahkan: Date | null;
  namaUnit: string | null;
}): Promise<string> {
  const tarikh = rec.tarikhSahkan ? ` · ${rec.tarikhSahkan.toLocaleDateString("ms-MY")}` : "";
  if (rec.disahkanOleh) return `${rec.disahkanOleh}${tarikh}`;
  if (rec.namaUnit) {
    const penasihat = await prisma.guruPenasihatKelab.findMany({
      where: { namaUnit: rec.namaUnit },
      select: { guru: { select: { nama: true } } },
      orderBy: { peranan: "asc" }, // KetuaPenasihat dahulu
    });
    if (penasihat.length) return `${penasihat.map((p) => p.guru.nama).join(", ")} (Guru Penasihat ${rec.namaUnit})`;
  }
  return "Guru Penasihat";
}
