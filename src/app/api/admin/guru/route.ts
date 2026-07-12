// src/app/api/admin/guru/route.ts
// Tambah guru baharu (Admin sahaja) — cipta rekod Guru + akaun User log masuk.
// Username = email; kata laluan lalai ditetapkan; pengguna mesti tukar semasa
// log masuk pertama (mustChangePw). Selari dengan jalankanImportGuru (import-run.ts).

import type { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { hashPassword, normalizeIC } from "@/lib/auth";
import { janaKataLaluan } from "@/lib/password";
import { JAWATAN_GURU, JENIS_KOKO, PERANAN_PENASIHAT } from "@/lib/enums";
import { syncPenasihatKelab, penasihatDariMedanLama } from "@/lib/workflow";

const penasihatItem = z.object({
  namaUnit: z.string().trim().min(1).max(120),
  jenisKoko: z.enum(JENIS_KOKO),
  peranan: z.enum(PERANAN_PENASIHAT).default("Penasihat"),
});

const schema = z.object({
  nama: z.string().trim().min(2, "Nama terlalu pendek").max(120),
  email: z.string().trim().email("Email tidak sah").max(160),
  noIc: z.string().trim().optional(),
  jawatanKoko: z.enum(JAWATAN_GURU),
  penasihatKelab: z.array(penasihatItem).optional(),
  kelabDiselia: z.string().max(120).nullish(),
  sukanDiselia: z.string().max(120).nullish(),
  badanDiselia: z.string().max(120).nullish(),
});

const bersih = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

export async function POST(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const d = parsed.data;
  const email = d.email.toLowerCase();
  const noIc = d.noIc ? normalizeIC(d.noIc) : "";
  if (noIc && !/^\d{12}$/.test(noIc)) return fail("No. IC mesti 12 digit", 422);

  // Semakan duplikasi (email guru, No. IC guru, atau username akaun).
  const dupGuru = await prisma.guru.findFirst({
    where: { OR: [{ email }, ...(noIc ? [{ noIc }] : [])] },
    select: { id: true },
  });
  if (dupGuru) return fail("Guru dengan email atau No. IC ini sudah wujud", 409);
  const dupUser = await prisma.user.findUnique({ where: { username: email }, select: { id: true } });
  if (dupUser) return fail("Akaun dengan email ini sudah wujud", 409);

  const kataLaluan = janaKataLaluan();
  const passwordHash = await hashPassword(kataLaluan);
  try {
    const guru = await prisma.guru.create({
      data: {
        nama: d.nama,
        noIc: noIc || `NA-${email}`,
        email,
        jawatanKoko: d.jawatanKoko,
        kelabDiselia: bersih(d.kelabDiselia),
        sukanDiselia: bersih(d.sukanDiselia),
        badanDiselia: bersih(d.badanDiselia),
      },
    });
    await prisma.user.create({
      data: { username: email, email, passwordHash, role: "Guru", guruId: guru.id, mustChangePw: true },
    });
    await syncPenasihatKelab(guru.id, d.penasihatKelab ?? penasihatDariMedanLama(d));
    return ok(
      { id: guru.id, username: email, kataLaluan },
      "Guru berjaya ditambah. Salin kata laluan ini sekarang — ia dipaparkan sekali sahaja.",
      201
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("Rekod berganda (email/No. IC sudah digunakan)", 409);
    }
    return fail("Ralat mencipta guru", 500);
  }
}
