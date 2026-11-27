import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, sekatBelumDisahkan, ok, fail } from "@/lib/api";
import { simpanFailDariForm } from "@/lib/upload";
import { bacaAktivitiLuarDariForm } from "@/lib/aktiviti-luar";
import { janaOprPDF, simpanOpr, teksLaporanOpr } from "@/lib/opr";
import { notify } from "@/lib/notifikasi";

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
  const sekat = sekatBelumDisahkan(session);
  if (sekat) return sekat;

  const form = await request.formData();
  // Borang OPR: butiran + gambar → OPR (PDF) disimpan sebagai eviden laporan.
  const r = await bacaAktivitiLuarDariForm(form, id);
  if ("ralat" in r) return fail(r.ralat, 422);
  const { opr, namaAktiviti, peringkat, namaUnit, tarikh, kedudukan, pengiring } = r.data;

  try {
    // Dua eviden wajib: surat pengiktirafan KPM & sijil.
    const fSurat = form.get("surat");
    const fSijil = form.get("sijil");
    if (!(fSurat instanceof File && fSurat.size > 0)) return fail("Surat pengiktirafan KPM diperlukan", 422);
    if (!(fSijil instanceof File && fSijil.size > 0)) return fail("Sijil diperlukan", 422);
    const surat = await simpanFailDariForm(form, "surat", "surat");
    const sijil = await simpanFailDariForm(form, "sijil", "sijil");
    if (!surat || !sijil) return fail("Kedua-dua eviden (surat KPM & sijil) diperlukan", 422);
    const lampiranOpr = await simpanOpr(await janaOprPDF(opr));
    const rec = await prisma.aktivitiLuar.create({
      data: {
        pelajarId: id,
        namaAktiviti,
        namaUnit,
        peringkat,
        tarikh: new Date(tarikh),
        laporan: teksLaporanOpr(opr),
        kedudukan,
        guruPengiringId: pengiring.id,
        lampiranSurat: surat,
        lampiranSijil: sijil,
        lampiranOpr,
        statusPengesahan: "Pending",
      },
    });
    if (pengiring.userId) {
      await notify({
        userId: pengiring.userId,
        tajuk: "Aktiviti luar menunggu pengesahan anda",
        mesej: `"${namaAktiviti}" (${peringkat}, ${kedudukan}) — anda dipilih sebagai guru pengiring.`,
        jenis: "info",
        pautan: "/guru",
      }).catch(() => null);
    }
    return ok(rec, "Aktiviti luar dihantar untuk pengesahan guru pengiring", 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat", 400);
  }
}
