import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { kiraSemulaLatar } from "@/lib/program-kolej";

const schema = z.object({ pelajarIds: z.array(z.string().min(1)).max(2000) });

// PUT: simpan SELURUH senarai pelajar terlibat (gantikan). Markah penglibatan
// pelajar yang ditambah / dibuang dikira semula di latar belakang.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  const program = await prisma.programKolej.findUnique({ where: { id } });
  if (!program) return fail("Program tidak dijumpai", 404);

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);
  const baru = new Set(parsed.data.pelajarIds);

  if (baru.size) {
    const sah = await prisma.pelajar.count({
      where: { id: { in: [...baru] }, ...(program.kohort ? { kohort: program.kohort } : {}) },
    });
    if (sah !== baru.size) return fail("Sebahagian pelajar tidak sah atau bukan dari kohort program", 422);
  }

  const lama = new Set(
    (await prisma.programKolejPeserta.findMany({ where: { programId: id }, select: { pelajarId: true } })).map((x) => x.pelajarId),
  );
  const tambah = [...baru].filter((x) => !lama.has(x));
  const buang = [...lama].filter((x) => !baru.has(x));

  await prisma.$transaction([
    prisma.programKolejPeserta.deleteMany({ where: { programId: id, pelajarId: { in: buang } } }),
    prisma.programKolejPeserta.createMany({ data: tambah.map((pelajarId) => ({ programId: id, pelajarId })), skipDuplicates: true }),
  ]);
  kiraSemulaLatar([...tambah, ...buang], "peserta program");
  return ok({ jumlah: baru.size, tambah: tambah.length, buang: buang.length },
    `Disimpan: ${baru.size} pelajar (+${tambah.length} / -${buang.length}). Markah dikira semula.`);
}
