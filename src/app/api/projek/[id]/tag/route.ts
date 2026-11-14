import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuruOrAdmin, ok, fail } from "@/lib/api";
import { bolehUrusProjek } from "@/lib/projek-akses";
import { notifyPelajar } from "@/lib/notifikasi";
import { LABEL_PERANAN, PERANAN_PELAPOR, PERANAN_PROJEK } from "@/lib/projek-jawatan";

const schema = z.object({
  pelajarId: z.string().min(1),
  peranan: z.enum(PERANAN_PROJEK),
});

async function semak(id: string) {
  const auth = await requireGuruOrAdmin();
  if ("response" in auth) return { response: auth.response };
  const projek = await prisma.projek.findUnique({ where: { id } });
  if (!projek) return { response: fail("Projek tidak dijumpai", 404) };
  if (!(await bolehUrusProjek(auth.guru, auth.session.userId, projek)))
    return { response: fail("Projek ini di luar skop anda", 403) };
  return { projek };
}

// POST: tetapkan AJK teras projek (Pengerusi / Naib Pengerusi / SU / NSU) atau tukar peranannya.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await semak(id);
  if ("response" in s) return s.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);
  const { pelajarId, peranan } = parsed.data;

  const pelajar = await prisma.pelajar.findUnique({ where: { id: pelajarId }, select: { kohort: true } });
  if (!pelajar) return fail("Pelajar tidak dijumpai", 404);
  if (s.projek.kohort && pelajar.kohort !== s.projek.kohort) return fail("Pelajar bukan dari kohort projek ini", 422);

  const rec = await prisma.projekTag.upsert({
    where: { projekId_pelajarId: { projekId: id, pelajarId } },
    create: { projekId: id, pelajarId, peranan },
    update: { peranan },
  });
  const pelapor = PERANAN_PELAPOR.includes(peranan);
  await notifyPelajar(pelajarId, {
    tajuk: `Anda dilantik ${LABEL_PERANAN[peranan]} projek`,
    mesej: pelapor
      ? `Anda boleh menghantar Laporan Projek (OPR) bagi "${s.projek.nama}".`
      : `Projek "${s.projek.nama}". Markah jawatan diberi selepas laporan projek disahkan guru penasihat.`,
    jenis: "info",
    pautan: "/pelajar/laporan",
  });
  return ok(rec, "Pelajar di-tag");
}

// DELETE ?pelajarId=… : buang tag.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await semak(id);
  if ("response" in s) return s.response;
  const pelajarId = request.nextUrl.searchParams.get("pelajarId") ?? "";
  await prisma.projekTag.deleteMany({ where: { projekId: id, pelajarId } });
  return ok(null, "Tag dibuang");
}

const schemaSemua = z.object({
  ajk: z.array(z.object({ pelajarId: z.string().min(1), peranan: z.enum(PERANAN_PROJEK) })).max(50),
});

// PUT: simpan SELURUH senarai AJK teras sekali gus (butang "Simpan AJK").
// Menggantikan tag sedia ada; notifikasi hanya kepada yang baharu / bertukar peranan.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await semak(id);
  if ("response" in s) return s.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schemaSemua.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const ajk = new Map(parsed.data.ajk.map((x) => [x.pelajarId, x.peranan]));
  if (![...ajk.values()].some((r) => PERANAN_PELAPOR.includes(r)))
    return fail("Tetapkan sekurang-kurangnya seorang SU atau NSU (pengisi Laporan Projek)", 422);

  if (ajk.size) {
    const sah = await prisma.pelajar.count({
      where: { id: { in: [...ajk.keys()] }, ...(s.projek.kohort ? { kohort: s.projek.kohort } : {}) },
    });
    if (sah !== ajk.size) return fail("Sebahagian pelajar tidak sah atau bukan dari kohort projek", 422);
  }

  const lama = new Map(
    (await prisma.projekTag.findMany({ where: { projekId: id }, select: { pelajarId: true, peranan: true } }))
      .map((x) => [x.pelajarId, x.peranan]),
  );

  await prisma.$transaction([
    prisma.projekTag.deleteMany({ where: { projekId: id, pelajarId: { notIn: [...ajk.keys()] } } }),
    ...[...ajk].map(([pelajarId, peranan]) =>
      prisma.projekTag.upsert({
        where: { projekId_pelajarId: { projekId: id, pelajarId } },
        create: { projekId: id, pelajarId, peranan },
        update: { peranan },
      }),
    ),
  ]);

  for (const [pelajarId, peranan] of ajk) {
    if (lama.get(pelajarId) === peranan) continue;
    await notifyPelajar(pelajarId, {
      tajuk: `Anda dilantik ${LABEL_PERANAN[peranan]} projek`,
      mesej: PERANAN_PELAPOR.includes(peranan)
        ? `Anda boleh menghantar Laporan Projek (OPR) bagi "${s.projek.nama}".`
        : `Projek "${s.projek.nama}". Markah jawatan diberi selepas laporan projek disahkan guru penasihat.`,
      jenis: "info",
      pautan: "/pelajar/laporan",
    });
  }
  return ok(null, "AJK projek disimpan");
}
