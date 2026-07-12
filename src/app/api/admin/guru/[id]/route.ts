import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { JAWATAN_GURU, JENIS_KOKO, PERANAN_PENASIHAT } from "@/lib/enums";
import { syncPenasihatKelab, penasihatDariMedanLama } from "@/lib/workflow";

const penasihatItem = z.object({
  namaUnit: z.string().trim().min(1).max(120),
  jenisKoko: z.enum(JENIS_KOKO),
  peranan: z.enum(PERANAN_PENASIHAT).default("Penasihat"),
});

const schema = z.object({
  jawatanKoko: z.enum(JAWATAN_GURU).optional(),
  // §3: penugasan unit (banyak-ke-banyak). Jika diberi, ia SUMBER KEBENARAN.
  penasihatKelab: z.array(penasihatItem).optional(),
  // Medan lama (deprecated) — masih diterima untuk keserasian.
  kelabDiselia: z.string().max(120).nullish(),
  sukanDiselia: z.string().max(120).nullish(),
  badanDiselia: z.string().max(120).nullish(),
  statusAktif: z.boolean().optional(),
});

const bersih = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const d = parsed.data;
  const updated = await prisma.guru.update({
    where: { id },
    data: {
      jawatanKoko: d.jawatanKoko ?? undefined,
      kelabDiselia: "kelabDiselia" in d ? bersih(d.kelabDiselia) : undefined,
      sukanDiselia: "sukanDiselia" in d ? bersih(d.sukanDiselia) : undefined,
      badanDiselia: "badanDiselia" in d ? bersih(d.badanDiselia) : undefined,
      statusAktif: d.statusAktif ?? undefined,
    },
  });

  // Selaraskan jadual pautan (sumber kebenaran skop akses §3).
  if (d.penasihatKelab) {
    await syncPenasihatKelab(id, d.penasihatKelab);
  } else if ("kelabDiselia" in d || "sukanDiselia" in d || "badanDiselia" in d) {
    await syncPenasihatKelab(id, penasihatDariMedanLama(d));
  }
  return ok({ id: updated.id }, "Maklumat guru dikemas kini");
}

// Padam guru (Admin sahaja). Akaun User dipadam eksplisit; rujukan guru pada
// LogPertukaran (guruId) & Kokurikulum (guruLulusId) ditetapkan NULL secara
// automatik kerana relasi itu opsional.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  const guru = await prisma.guru.findUnique({ where: { id }, select: { id: true, nama: true } });
  if (!guru) return fail("Guru tidak dijumpai", 404);

  try {
    await prisma.$transaction([
      prisma.user.deleteMany({ where: { guruId: id } }),
      prisma.guru.delete({ where: { id } }),
    ]);
    return ok({ id }, `Guru "${guru.nama}" dan akaun berkaitan telah dipadam.`);
  } catch {
    return fail("Ralat memadam guru", 500);
  }
}
