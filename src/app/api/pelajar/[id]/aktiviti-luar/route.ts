import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, sekatBelumDisahkan, ok, fail } from "@/lib/api";
import { simpanFailDariForm } from "@/lib/upload";
import { KEDUDUKAN_AKTIVITI, PERINGKAT_LUAR } from "@/lib/enums";
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
  const namaAktiviti = String(form.get("namaAktiviti") ?? "").trim();
  const peringkat = String(form.get("peringkat") ?? "");
  const namaUnit = String(form.get("namaUnit") ?? "");
  const tarikh = String(form.get("tarikh") ?? "");
  const laporan = String(form.get("laporan") ?? "").trim();
  const kedudukan = String(form.get("kedudukan") ?? "");
  const guruPengiringId = String(form.get("guruPengiringId") ?? "");
  if (!namaAktiviti) return fail("Nama program/aktiviti diperlukan", 422);
  if (!PERINGKAT_LUAR.includes(peringkat as (typeof PERINGKAT_LUAR)[number])) {
    return fail("Peringkat tidak sah", 422);
  }
  if (!tarikh) return fail("Tarikh program/aktiviti diperlukan", 422);
  if (!laporan) return fail("Laporan ringkas diperlukan", 422);
  if (!KEDUDUKAN_AKTIVITI.includes(kedudukan as (typeof KEDUDUKAN_AKTIVITI)[number])) {
    return fail("Kedudukan/pencapaian diperlukan", 422);
  }
  // Guru pengiring — hanya guru ini boleh mengesahkan aktiviti ini.
  const pengiring = guruPengiringId
    ? await prisma.guru.findFirst({ where: { id: guruPengiringId, statusAktif: true }, select: { id: true, user: { select: { id: true } } } })
    : null;
  if (!pengiring) return fail("Sila pilih guru pengiring", 422);

  // Sahkan namaUnit terus dari Kokurikulum pelajar (skop pengesahan guru bergantung pada ini).
  const unitSah = await prisma.kokurikulum.findFirst({
    where: { pelajarId: id, namaUnitT6: namaUnit },
    select: { namaUnitT6: true },
  });
  if (!unitSah) return fail("Unit berkaitan diperlukan/tidak sah", 422);

  try {
    // Dua eviden wajib: surat pengiktirafan KPM & sijil.
    const fSurat = form.get("surat");
    const fSijil = form.get("sijil");
    if (!(fSurat instanceof File && fSurat.size > 0)) return fail("Surat pengiktirafan KPM diperlukan", 422);
    if (!(fSijil instanceof File && fSijil.size > 0)) return fail("Sijil diperlukan", 422);
    const surat = await simpanFailDariForm(form, "surat", "surat");
    const sijil = await simpanFailDariForm(form, "sijil", "sijil");
    if (!surat || !sijil) return fail("Kedua-dua eviden (surat KPM & sijil) diperlukan", 422);
    const rec = await prisma.aktivitiLuar.create({
      data: {
        pelajarId: id,
        namaAktiviti,
        namaUnit,
        peringkat,
        tarikh: new Date(tarikh),
        laporan,
        kedudukan,
        guruPengiringId: pengiring.id,
        lampiranSurat: surat,
        lampiranSijil: sijil,
        statusPengesahan: "Pending",
      },
    });
    if (pengiring.user) {
      await notify({
        userId: pengiring.user.id,
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
