import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, ok, fail } from "@/lib/api";
import { simpanFailDariForm } from "@/lib/upload";
import { PERINGKAT_KOLEJ } from "@/lib/enums";

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
  const namaUnit = String(form.get("namaUnit") ?? "");
  const tarikh = String(form.get("tarikh") ?? "");
  const laporan = String(form.get("laporan") ?? "").trim();
  if (!namaPencapaian) return fail("Nama program/aktiviti diperlukan", 422);
  if (!tarikh) return fail("Tarikh program/aktiviti diperlukan", 422);
  if (!laporan) return fail("Laporan ringkas diperlukan", 422);

  // Sahkan namaUnit terus dari Kokurikulum pelajar (skop pengesahan guru bergantung pada ini).
  const unitSah = await prisma.kokurikulum.findFirst({
    where: { pelajarId: id, namaUnitT6: namaUnit },
    select: { namaUnitT6: true },
  });
  if (!unitSah) return fail("Unit berkaitan diperlukan/tidak sah", 422);

  let eviden: string | null = null;
  try {
    eviden = await simpanFailDariForm(form, "eviden", "eviden");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat muat naik", 400);
  }
  if (!eviden) return fail("Eviden diperlukan untuk pengesahan guru", 422);

  const rec = await prisma.pencapaian.create({
    data: {
      pelajarId: id,
      namaPencapaian,
      kategori: "biasa",
      namaUnit,
      // Aktiviti Peringkat Kolej — peringkat sentiasa Sekolah.
      peringkat: PERINGKAT_KOLEJ,
      tarikh: new Date(tarikh),
      laporan,
      lampiranEviden: eviden,
      statusSemakan: "Pending",
    },
  });
  return ok(rec, "Aktiviti peringkat kolej dihantar untuk pengesahan guru", 201);
}
