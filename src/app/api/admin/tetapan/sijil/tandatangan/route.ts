import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, ok, fail } from "@/lib/api";

// Tandatangan pengesah e-Cert — disimpan sebagai data URL dalam TetapanSijil.tandatangan.
const MAKS_BAIT = 300 * 1024;

const schema = z.object({
  dataUrl: z.string().regex(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/, "Hanya fail PNG atau JPG dibenarkan"),
});

async function simpan(tandatangan: string | null) {
  try {
    await prisma.tetapanSijil.upsert({
      where: { id: "default" },
      update: { tandatangan },
      create: { id: "default", tandatangan },
    });
    return null;
  } catch (e) {
    if ((e as { code?: string }).code === "P2022") {
      return fail("Lajur tandatangan belum wujud — jalankan migrasi pangkalan data dahulu.", 503);
    }
    throw e;
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("Format tidak sah", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak sah", 422);

  const bait = Buffer.from(parsed.data.dataUrl.split(",")[1], "base64").length;
  if (bait > MAKS_BAIT) return fail("Saiz imej melebihi 300KB", 413);

  return (await simpan(parsed.data.dataUrl)) ?? ok(null, "Tandatangan pengesah disimpan");
}

export async function DELETE() {
  const auth = await requireRole("Admin");
  if ("response" in auth) return auth.response;
  return (await simpan(null)) ?? ok(null, "Tandatangan pengesah dibuang");
}
