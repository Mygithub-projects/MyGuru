// src/app/api/admin/pelajar/route.ts
// Tambah pelajar baharu (Admin sahaja) — cipta rekod Pelajar + akaun User log masuk.
// Username = No. IC; kata laluan lalai ditetapkan; mustChangePw = true.
// Selari dengan jalankanImportPajsk (import-run.ts) untuk pelajar tunggal.

import type { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";
import { hashPassword, normalizeIC, isValidIC } from "@/lib/auth";
import { janaKataLaluan } from "@/lib/password";
import { JANTINA, KAUM, AGAMA, SUB_ROLES } from "@/lib/enums";

const schema = z.object({
  nama: z.string().trim().min(2, "Nama terlalu pendek").max(120),
  noIc: z.string().trim().min(1, "No. IC diperlukan"),
  kelasT6: z.string().trim().max(60).nullish(),
  jantina: z.enum(JANTINA).or(z.literal("")).nullish(),
  kaum: z.enum(KAUM).or(z.literal("")).nullish(),
  agama: z.enum(AGAMA).or(z.literal("")).nullish(),
  email: z.string().trim().email("Email tidak sah").max(160).or(z.literal("")).nullish(),
  noTel: z.string().trim().max(30).nullish(),
  subRole: z.enum(SUB_ROLES).default("Pelajar"),
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
  const noIc = normalizeIC(d.noIc);
  if (!isValidIC(noIc)) return fail("No. IC mesti 12 digit", 422);

  // Semakan duplikasi (No. IC pelajar atau username akaun).
  const dupPelajar = await prisma.pelajar.findUnique({ where: { noIc }, select: { id: true } });
  if (dupPelajar) return fail("Pelajar dengan No. IC ini sudah wujud", 409);
  const dupUser = await prisma.user.findUnique({ where: { username: noIc }, select: { id: true } });
  if (dupUser) return fail("Akaun dengan No. IC ini sudah wujud", 409);

  const kataLaluan = janaKataLaluan();
  const passwordHash = await hashPassword(kataLaluan);
  try {
    const pelajar = await prisma.pelajar.create({
      data: {
        nama: d.nama,
        noIc,
        kelasT6: bersih(d.kelasT6) ?? "T6 (Sesi 2026)",
        jantina: bersih(d.jantina),
        kaum: bersih(d.kaum),
        agama: bersih(d.agama),
        email: bersih(d.email),
        noTel: bersih(d.noTel),
        subRole: d.subRole,
      },
    });
    await prisma.user.create({
      data: { username: noIc, passwordHash, role: "Pelajar", pelajarId: pelajar.id, mustChangePw: true },
    });
    return ok(
      { id: pelajar.id, username: noIc, kataLaluan },
      "Pelajar berjaya ditambah. Salin kata laluan ini sekarang — ia dipaparkan sekali sahaja.",
      201
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("Rekod berganda (No. IC sudah digunakan)", 409);
    }
    return fail("Ralat mencipta pelajar", 500);
  }
}
