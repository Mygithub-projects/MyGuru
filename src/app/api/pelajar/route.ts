import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok } from "@/lib/api";
import { pelajarIdsDalamSkop } from "@/lib/guru";

// GET /api/pelajar — senarai rekod pelajar (live), mengikut skop peranan.
//   ?kelas=6AK1  ?q=ahmad  ?limit=100  ?offset=0
// Admin / guru seluruh sekolah: semua; guru unit: pelajar dalam unit seliaan.
export async function GET(request: NextRequest) {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;

  const { searchParams } = new URL(request.url);
  const kelas = searchParams.get("kelas")?.trim();
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "500", 10) || 500, 1), 1000);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);

  const ids = guru ? await pelajarIdsDalamSkop(guru) : null; // null = seluruh sekolah
  const where: Prisma.PelajarWhereInput = { statusAktif: true };
  if (ids !== null) where.id = { in: ids };
  if (kelas) where.kelasT6 = kelas;
  if (q) where.OR = [{ nama: { contains: q } }, { noIc: { contains: q } }];

  const [total, pelajar] = await Promise.all([
    prisma.pelajar.count({ where }),
    prisma.pelajar.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: [{ kelasT6: "asc" }, { nama: "asc" }],
      include: {
        kokurikulum: {
          select: {
            jenisKoko: true,
            namaUnitT6: true,
            jawatanT6: true,
            peringkatT6: true,
            markahJawatanT6: true, markahPeringkatT6: true,
            statusPertukaran: true,
          },
        },
      },
    }),
  ]);

  const data = pelajar.map((p) => ({
    id: p.id,
    nama: p.nama,
    noIc: p.noIc,
    kelasT6: p.kelasT6,
    jantina: p.jantina,
    kaum: p.kaum,
    agama: p.agama,
    pajsk: {
      t6: { markah: p.markahPajskT6, peratus: p.peratusPajskT6 },
      gred: p.gredPajskT6,
      markahKehadiran: p.markahKehadiran,
      markahPenglibatan: p.markahPenglibatan,
      markahPencapaian: p.markahPencapaian,
      markahProjekJawatan: p.markahProjekJawatan,
      markahProjekPeringkat: p.markahProjekPeringkat,
      markahEkstra: p.markahEkstra,
    },
    kokurikulum: p.kokurikulum,
  }));

  return ok({ total, limit, offset, count: data.length, pelajar: data }, "OK");
}
