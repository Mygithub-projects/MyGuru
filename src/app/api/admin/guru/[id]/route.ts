import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { JAWATAN_GURU, JENIS_KOKO, PERANAN_PENASIHAT } from "@/lib/enums";
import { syncPenasihatKelab, penasihatDariMedanLama } from "@/lib/workflow";
import { hashPassword } from "@/lib/auth";

const penasihatItem = z.object({
  namaUnit: z.string().trim().min(1).max(120),
  jenisKoko: z.enum(JENIS_KOKO),
  peranan: z.enum(PERANAN_PENASIHAT).default("Penasihat"),
});

const schema = z.object({
  // Butiran akaun — dibetulkan oleh admin.
  nama: z.string().trim().min(3, "Nama terlalu pendek").max(150).optional(),
  email: z.string().trim().toLowerCase().email("Email tidak sah").optional(),
  kataLaluan: z.string().min(6, "Kata laluan sekurang-kurangnya 6 aksara").max(100).optional(),
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
  const guru = await prisma.guru.findUnique({ where: { id }, select: { email: true } });
  if (!guru) return fail("Guru tidak dijumpai", 404);
  const akaun = await prisma.user.findFirst({ where: { guruId: id }, select: { id: true, username: true } });

  // Email guru juga email & (jika belum di-reset ke IC) username log masuk.
  const tukarEmail = d.email !== undefined && d.email !== guru.email;
  if (tukarEmail) {
    const bentrok = await prisma.user.findFirst({
      where: { OR: [{ email: d.email }, { username: d.email }], NOT: { guruId: id } },
      select: { id: true },
    });
    const bentrokGuru = await prisma.guru.findFirst({ where: { email: d.email, NOT: { id } }, select: { id: true } });
    if (bentrok || bentrokGuru) return fail(`Email ${d.email} sudah digunakan oleh akaun lain`, 409);
  }
  if (d.kataLaluan && !akaun) return fail("Guru ini tiada akaun log masuk", 404);

  const updated = await prisma.guru.update({
    where: { id },
    data: {
      nama: d.nama ?? undefined,
      email: tukarEmail ? d.email : undefined,
      jawatanKoko: d.jawatanKoko ?? undefined,
      kelabDiselia: "kelabDiselia" in d ? bersih(d.kelabDiselia) : undefined,
      sukanDiselia: "sukanDiselia" in d ? bersih(d.sukanDiselia) : undefined,
      badanDiselia: "badanDiselia" in d ? bersih(d.badanDiselia) : undefined,
      statusAktif: d.statusAktif ?? undefined,
    },
  });

  if (akaun && (tukarEmail || d.kataLaluan)) {
    await prisma.user.update({
      where: { id: akaun.id },
      data: {
        ...(tukarEmail ? { email: d.email, ...(akaun.username === guru.email ? { username: d.email } : {}) } : {}),
        // Kata laluan yang ditetapkan admin — guru dipaksa tukar semasa log masuk.
        ...(d.kataLaluan ? { passwordHash: await hashPassword(d.kataLaluan), mustChangePw: true } : {}),
      },
    });
  }

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
