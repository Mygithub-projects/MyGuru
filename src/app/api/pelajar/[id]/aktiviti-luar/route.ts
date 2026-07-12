import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, ok, fail } from "@/lib/api";
import { simpanFailDariForm } from "@/lib/upload";
import { PERINGKAT } from "@/lib/enums";

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
  const tarikh = String(form.get("tarikh") ?? "");
  if (!namaAktiviti) return fail("Nama aktiviti diperlukan", 422);
  if (!PERINGKAT.includes(peringkat as (typeof PERINGKAT)[number])) {
    return fail("Peringkat tidak sah", 422);
  }

  try {
    const surat = await simpanFailDariForm(form, "surat", "surat");
    const sijil = await simpanFailDariForm(form, "sijil", "sijil");
    const rec = await prisma.aktivitiLuar.create({
      data: {
        pelajarId: id,
        namaAktiviti,
        peringkat,
        tarikh: tarikh ? new Date(tarikh) : null,
        lampiranSurat: surat,
        lampiranSijil: sijil,
        statusPengesahan: "Pending",
      },
    });
    return ok(rec, "Aktiviti luar dihantar untuk pengesahan guru", 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 400);
  }
}
