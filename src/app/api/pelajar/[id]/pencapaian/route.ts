import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, ok, fail } from "@/lib/api";
import { simpanFailDariForm } from "@/lib/upload";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;
  if (session.role === "Pelajar" && session.pelajarId !== id) {
    return fail("Anda hanya boleh menambah untuk akaun sendiri", 403);
  }

  const form = await request.formData();
  const namaPencapaian = String(form.get("namaPencapaian") ?? "").trim();
  const peringkat = String(form.get("peringkat") ?? "");
  if (!namaPencapaian) return fail("Nama pencapaian diperlukan", 422);

  let eviden: string | null = null;
  try {
    eviden = await simpanFailDariForm(form, "eviden", "eviden");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat muat naik", 400);
  }

  const rec = await prisma.pencapaian.create({
    data: {
      pelajarId: id,
      namaPencapaian,
      kategori: "biasa",
      peringkat: peringkat || null,
      lampiranEviden: eviden,
      statusSemakan: "Pending",
    },
  });
  return ok(rec, "Pencapaian dihantar untuk pengesahan guru", 201);
}
