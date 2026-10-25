import { prisma } from "./prisma";

export interface TetapanSijilData {
  institusi: string;
  tajukSijil: string;
  namaPenandatangan: string;
  jawatanPenandatangan: string;
  teksCop: string;
  /** Data URL tandatangan pengesah; null = tiada / lajur belum dimigrasi. */
  tandatangan: string | null;
}

/** Dapatkan tetapan sijil (cipta lalai jika belum ada). */
export async function getTetapanSijil(): Promise<TetapanSijilData> {
  const rec = await prisma.tetapanSijil.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      institusi: process.env.NEXT_PUBLIC_INSTITUSI || "KTE (Prauniversiti) Desa Mahkota",
    },
    // Pilih lajur secara eksplisit supaya sijil masih dijana sebelum migrasi tandatangan dijalankan.
    select: { institusi: true, tajukSijil: true, namaPenandatangan: true, jawatanPenandatangan: true, teksCop: true },
  });
  return { ...rec, tandatangan: await getTandatangan() };
}

async function getTandatangan(): Promise<string | null> {
  try {
    const r = await prisma.tetapanSijil.findUnique({ where: { id: "default" }, select: { tandatangan: true } });
    return r?.tandatangan ?? null;
  } catch (e) {
    // P2022 = lajur belum wujud (migrasi 20261025120000 belum dijalankan) → tiada tandatangan.
    if ((e as { code?: string }).code !== "P2022") console.error("[tetapan-sijil] tandatangan", e);
    return null;
  }
}

/**
 * Tandatangan hanya milik penandatangan Templat e-Cert — jangan lukis jika
 * program menetapkan penandatangan lain.
 */
export function tandatanganUntuk(tetapan: TetapanSijilData, namaPenandatangan: string | null | undefined): string | null {
  return !namaPenandatangan || namaPenandatangan === tetapan.namaPenandatangan ? tetapan.tandatangan : null;
}
