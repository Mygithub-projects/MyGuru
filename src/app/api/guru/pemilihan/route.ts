import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { bolehGuruAksesPelajar, pilihPelajarUntukPertandingan } from "@/lib/workflow";
import { pelajarIdsDalamSkop } from "@/lib/guru";
import { PERINGKAT } from "@/lib/enums";

// GET /api/guru/pemilihan — senarai pemilihan pertandingan/sukan (live).
// Pemilihan = rekod Aktiviti Luar peringkat luar sekolah, mengikut skop.
//   ?peringkat=Negeri  ?status=Pending
export async function GET(request: NextRequest) {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;

  const { searchParams } = new URL(request.url);
  const peringkat = searchParams.get("peringkat")?.trim();
  const status = searchParams.get("status")?.trim();

  const ids = guru ? await pelajarIdsDalamSkop(guru) : null; // null = seluruh sekolah
  const where: Prisma.AktivitiLuarWhereInput = {};
  if (ids !== null) where.pelajarId = { in: ids };
  if (peringkat) where.peringkat = peringkat;
  if (status) where.statusPengesahan = status;

  const recs = await prisma.aktivitiLuar.findMany({
    where,
    include: { pelajar: { select: { nama: true, kelasT6: true } } },
    orderBy: { createdAt: "desc" },
  });

  const byStatus: Record<string, number> = {};
  const byPeringkat: Record<string, number> = {};
  for (const r of recs) {
    byStatus[r.statusPengesahan] = (byStatus[r.statusPengesahan] ?? 0) + 1;
    byPeringkat[r.peringkat] = (byPeringkat[r.peringkat] ?? 0) + 1;
  }

  return ok(
    {
      skop: ids === null ? "seluruh-sekolah" : "unit-seliaan",
      jumlah: recs.length,
      ringkasan: { mengikutStatus: byStatus, mengikutPeringkat: byPeringkat },
      pemilihan: recs.map((r) => ({
        id: r.id,
        pelajar: r.pelajar.nama,
        kelas: r.pelajar.kelasT6,
        namaAktiviti: r.namaAktiviti,
        peringkat: r.peringkat,
        status: r.statusPengesahan,
        markahLuar: r.markahLuar,
        noSiriECert: r.noSiriECert,
        tarikh: r.tarikh,
      })),
    },
    "OK"
  );
}

const schema = z.object({
  namaAktiviti: z.string().min(2, "Nama pertandingan diperlukan").max(200),
  peringkat: z.string(),
  tarikh: z.string().optional(),
  pelajarIds: z.array(z.string()).min(1, "Pilih sekurang-kurangnya seorang pelajar"),
});

// POST /api/guru/pemilihan — guru memilih pelajar menyertai pertandingan/sukan.
export async function POST(request: NextRequest) {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return auth.response;
  const { guru } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const { namaAktiviti, peringkat, tarikh, pelajarIds } = parsed.data;
  if (!PERINGKAT.includes(peringkat as (typeof PERINGKAT)[number])) {
    return fail("Peringkat tidak sah", 422);
  }
  const tarikhVal = tarikh ? new Date(tarikh) : null;

  let dicipta = 0;
  let dilangkau = 0;
  // `guru` null bererti Admin (akses penuh, tiada had skop).
  for (const pid of [...new Set(pelajarIds)]) {
    if (guru && !(await bolehGuruAksesPelajar(guru, pid))) {
      dilangkau++;
      continue;
    }
    await pilihPelajarUntukPertandingan({ pelajarId: pid, namaAktiviti, peringkat, tarikh: tarikhVal });
    dicipta++;
  }

  if (dicipta === 0) {
    return fail("Tiada pelajar dipilih dalam skop seliaan anda", 403);
  }

  return ok(
    { dicipta, dilangkau },
    dilangkau
      ? `${dicipta} pelajar dipilih untuk "${namaAktiviti}" (${peringkat}). ${dilangkau} dilangkau (di luar unit seliaan).`
      : `${dicipta} pelajar dipilih untuk "${namaAktiviti}" (${peringkat}).`,
    201
  );
}
