import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, sekatBelumDisahkan, ok, fail } from "@/lib/api";
import { simpanFailDariForm } from "@/lib/upload";
import { PERINGKAT_EKSTRA } from "@/lib/enums";

// POST /api/pelajar/[id]/ekstra — pelajar menghantar program Ekstra Kurikulum
// (Anugerah Khas). Disahkan HANYA oleh Ketua Unit Kokurikulum / Admin melalui
// /api/ekstra/[id]/sahkan, yang memilih perkara & markah.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;
  if (session.role !== "Pelajar" || session.pelajarId !== id) {
    return fail("Anda hanya boleh menghantar untuk akaun sendiri", 403);
  }
  const sekat = sekatBelumDisahkan(session);
  if (sekat) return sekat;

  const form = await request.formData();
  const namaPencapaian = String(form.get("namaPencapaian") ?? "").trim();
  const peringkat = String(form.get("peringkat") ?? "").trim();
  const tarikh = String(form.get("tarikh") ?? "").trim();
  const tempat = String(form.get("tempat") ?? "").trim();
  if (!namaPencapaian) return fail("Nama program/aktiviti diperlukan", 422);
  if (namaPencapaian.length > 200) return fail("Nama program terlalu panjang", 422);
  if (!(PERINGKAT_EKSTRA as readonly string[]).includes(peringkat)) return fail("Peringkat tidak sah", 422);
  const t = new Date(tarikh);
  if (!tarikh || Number.isNaN(t.getTime())) return fail("Tarikh program diperlukan", 422);
  if (!tempat) return fail("Tempat diperlukan", 422);
  if (tempat.length > 200) return fail("Tempat terlalu panjang", 422);

  let eviden: string | null = null;
  try {
    eviden = await simpanFailDariForm(form, "eviden", "eviden");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat muat naik", 400);
  }
  if (!eviden) return fail("Sijil (eviden) diperlukan", 422);

  const rec = await prisma.pencapaian.create({
    data: {
      pelajarId: id,
      namaPencapaian,
      kategori: "ekstra",
      peringkat,
      tarikh: t,
      tempat,
      lampiranEviden: eviden,
      statusSemakan: "Pending",
    },
  });
  return ok(rec, "Ekstra Kurikulum dihantar untuk pengesahan Ketua Unit Kokurikulum", 201);
}
