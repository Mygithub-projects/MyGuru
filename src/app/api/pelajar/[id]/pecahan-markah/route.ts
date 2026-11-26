import type { NextRequest } from "next/server";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { bolehGuruUrusPelajar } from "@/lib/workflow";
import { getPelajarProfil } from "@/lib/pelajar";

// GET /api/pelajar/[id]/pecahan-markah — pecahan markah PAJSK T6 seorang pelajar
// (sumber sama dengan halaman Admin & slip). Guru: pelajar dalam skop seliaannya sahaja.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  if (auth.guru && !(await bolehGuruUrusPelajar(auth.guru, id))) {
    return fail("Pelajar ini di luar skop seliaan anda", 403);
  }

  const profil = await getPelajarProfil(id);
  if (!profil) return fail("Pelajar tidak dijumpai", 404);
  return ok({
    keseluruhan: profil.pelajar.markahPajskT6,
    gred: profil.pelajar.gredPajskT6,
    markah: profil.markah,
    bidang: profil.penyertaan.map((p) => ({
      jenisKoko: p.jenisKoko,
      namaUnit: p.namaUnit,
      dikira: p.dikira,
      ekstra: p.ekstra,
      jumlah: p.skor.jumlah,
      kehadiran: p.skor.mKehadiran,
      jawatan: p.skor.mJawatan,
      penglibatan: p.skor.mPenglibatan,
      pencapaian: p.skor.pcpMarkah,
      projekJawatan: p.skor.pjMJ,
      projekPeringkat: p.skor.pjMP,
    })),
  });
}
