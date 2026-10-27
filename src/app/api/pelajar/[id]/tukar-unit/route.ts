import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession, ok, fail } from "@/lib/api";
import { mohonPertukaran } from "@/lib/workflow";
import { JENIS_KOKO } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { JENIS_DAFTAR } from "@/lib/had-unit";

const schema = z.object({
  jenisKoko: z.enum(JENIS_KOKO),
  unitBaru: z.string().min(2, "Nama unit baru diperlukan"),
  sebab: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  // Pelajar hanya boleh memohon untuk dirinya; Admin boleh bagi sesiapa.
  if (session.role === "Pelajar" && session.pelajarId !== id) {
    return fail("Anda hanya boleh memohon pertukaran untuk akaun sendiri", 403);
  }
  if (session.role === "Guru") {
    return fail("Guru tidak memohon pertukaran; gunakan kelulusan", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Format permintaan tidak sah", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  // Pelajar: SP/KP/BU didaftar melalui borang pendaftaran berkuota; pertukaran
  // unit tidak lagi dibenarkan (Admin masih boleh kemas kini unit pelajar).
  if (session.role === "Pelajar") {
    if ((JENIS_DAFTAR as readonly string[]).includes(parsed.data.jenisKoko)) {
      return fail("Gunakan borang Pendaftaran Unit Kokurikulum untuk SP/KP/BU", 403);
    }
    const sedia = await prisma.kokurikulum.findUnique({
      where: { pelajarId_jenisKoko: { pelajarId: id, jenisKoko: parsed.data.jenisKoko } },
      select: { namaUnitT6: true },
    });
    if (sedia?.namaUnitT6) return fail("Pertukaran unit tidak dibenarkan. Sila hubungi pentadbir.", 403);
  }

  try {
    const log = await mohonPertukaran({ pelajarId: id, ...parsed.data });
    return ok(log, "Permohonan pertukaran dihantar — menunggu kelulusan guru", 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat memproses permohonan", 400);
  }
}
