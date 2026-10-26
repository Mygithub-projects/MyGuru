import path from "node:path";
import type { NextRequest } from "next/server";
import type { Guru } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, fail } from "@/lib/api";
import { bolehGuruAksesPelajar, guruSeluruhSekolah, unitSeliaan } from "@/lib/workflow";
import { storage } from "@/lib/storage";
import { MIME } from "@/lib/upload";
import { NAMA_FAIL_SAH } from "@/lib/fail-url";

// Hidang fail muat naik PERIBADI (eviden, surat, sijil, lampiran laporan).
// Hanya Admin dan guru yang boleh mengesahkan rekod pemilik fail itu
// (peraturan sama seperti /api/pencapaian/[id]/sahkan): guru seluruh sekolah,
// atau guru penasihat unit berkenaan. Pelajar & pengguna tanpa sesi ditolak.

interface Pemilik {
  pelajarId?: string;
  namaUnit: string | null;
}

/** Cari rekod yang merujuk fail ini (nilai baru /api/fail/x atau lama /uploads/x). */
async function cariPemilik(nama: string): Promise<Pemilik | null> {
  const ada = { endsWith: `/${nama}` };
  const pilih = { pelajarId: true, namaUnit: true } as const;
  return (
    (await prisma.pencapaian.findFirst({ where: { lampiranEviden: ada }, select: pilih })) ??
    (await prisma.aktivitiLuar.findFirst({
      where: { OR: [{ lampiranSurat: ada }, { lampiranSijil: ada }] },
      select: pilih,
    })) ??
    (await prisma.laporanMingguan.findFirst({
      where: { lampiran: { contains: nama } },
      select: { namaUnit: true },
    })) ??
    (await prisma.laporanProjek.findFirst({
      where: { OR: [{ failKertasKerja: ada }, { failLaporanImpak: ada }] },
      select: { namaUnit: true },
    }))
  );
}

async function bolehAkses(guru: Guru | null, p: Pemilik): Promise<boolean> {
  if (!guru) return true; // Admin
  if (guruSeluruhSekolah(guru)) return true;
  if (p.namaUnit) return (await unitSeliaan(guru)).includes(p.namaUnit);
  return p.pelajarId ? bolehGuruAksesPelajar(guru, p.pelajarId) : false;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ nama: string }> }
) {
  const { nama } = await params;
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;

  if (!NAMA_FAIL_SAH.test(nama)) return fail("Fail tidak dijumpai", 404);
  const pemilik = await cariPemilik(nama);
  if (!pemilik) return fail("Fail tidak dijumpai", 404);
  if (!(await bolehAkses(auth.guru, pemilik))) {
    return fail("Fail ini di luar unit seliaan anda", 403);
  }

  const data = await storage().baca(nama);
  if (!data) return fail("Fail tidak dijumpai", 404);

  const ext = path.extname(nama);
  const bolehPapar = [".pdf", ".jpg", ".jpeg", ".png", ".webp"].includes(ext);
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Content-Disposition": `${bolehPapar ? "inline" : "attachment"}; filename="${nama}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
