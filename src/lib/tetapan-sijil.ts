import { prisma } from "./prisma";

export interface TetapanSijilData {
  institusi: string;
  tajukSijil: string;
  namaPenandatangan: string;
  jawatanPenandatangan: string;
  teksCop: string;
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
  });
  return {
    institusi: rec.institusi,
    tajukSijil: rec.tajukSijil,
    namaPenandatangan: rec.namaPenandatangan,
    jawatanPenandatangan: rec.jawatanPenandatangan,
    teksCop: rec.teksCop,
  };
}
