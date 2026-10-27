import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, ok, fail } from "@/lib/api";
import { simpanFailDariForm } from "@/lib/upload";
import { PERINGKAT_LUAR } from "@/lib/enums";

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
  const namaAktiviti = String(form.get("namaAktiviti") ?? "").trim();
  const peringkat = String(form.get("peringkat") ?? "");
  const namaUnit = String(form.get("namaUnit") ?? "");
  const tarikh = String(form.get("tarikh") ?? "");
  const laporan = String(form.get("laporan") ?? "").trim();
  if (!namaAktiviti) return fail("Nama program/aktiviti diperlukan", 422);
  if (!PERINGKAT_LUAR.includes(peringkat as (typeof PERINGKAT_LUAR)[number])) {
    return fail("Peringkat tidak sah", 422);
  }
  if (!tarikh) return fail("Tarikh program/aktiviti diperlukan", 422);
  if (!laporan) return fail("Laporan ringkas diperlukan", 422);

  // Sahkan namaUnit terus dari Kokurikulum pelajar (skop pengesahan guru bergantung pada ini).
  const unitSah = await prisma.kokurikulum.findFirst({
    where: { pelajarId: id, namaUnitT6: namaUnit },
    select: { namaUnitT6: true },
  });
  if (!unitSah) return fail("Unit berkaitan diperlukan/tidak sah", 422);

  try {
    // Satu fail eviden sahaja — disimpan di lampiranSijil.
    const eviden = await simpanFailDariForm(form, "eviden", "eviden");
    if (!eviden) return fail("Eviden diperlukan untuk pengesahan guru", 422);
    const rec = await prisma.aktivitiLuar.create({
      data: {
        pelajarId: id,
        namaAktiviti,
        namaUnit,
        peringkat,
        tarikh: new Date(tarikh),
        laporan,
        lampiranSijil: eviden,
        statusPengesahan: "Pending",
      },
    });
    return ok(rec, "Aktiviti luar dihantar untuk pengesahan guru", 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 400);
  }
}
