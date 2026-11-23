import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, sekatBelumDisahkan, ok, fail } from "@/lib/api";
import { kohortPelajar } from "@/lib/kohort-pilihan";
import { notifyGuruUntukUnit } from "@/lib/notifikasi";
import { bacaAktivitiUnitDariForm } from "@/lib/aktiviti-unit";
import { janaOprPDF, simpanOpr, teksLaporanOpr } from "@/lib/opr";

// POST: SU/NSU unit menghantar satu aktiviti + senarai peserta (mana-mana unit)
// untuk pengesahan Ketua GP / Penolong Ketua GP unit itu. Eviden = PDF OPR
// yang dijana sistem (butiran, peserta & kedudukan, gambar).
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;
  const sekat = sekatBelumDisahkan(session);
  if (sekat) return sekat;
  const isSU = session.role === "Pelajar" && (session.subRole === "SU" || session.subRole === "NSU");
  if (!isSU || !session.pelajarId) return fail("Hanya SU/NSU boleh menghantar aktiviti unit", 403);

  const form = await request.formData();
  const r = await bacaAktivitiUnitDariForm(form, { pelajarId: session.pelajarId, subRole: session.subRole });
  if ("ralat" in r) return fail(r.ralat, r.status ?? 422);
  const { opr, namaUnit, jenisKoko, peringkat, peserta } = r.data;

  let eviden: string;
  try {
    eviden = await simpanOpr(await janaOprPDF(opr));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat menjana OPR", 400);
  }

  const rec = await prisma.aktivitiUnit.create({
    data: {
      namaAktiviti: opr.namaProgram,
      peringkat,
      tarikh: new Date(opr.tarikh),
      namaUnit,
      jenisKoko,
      kohort: await kohortPelajar(session.pelajarId),
      laporan: teksLaporanOpr(opr),
      lampiranEviden: eviden,
      setiausahaId: session.pelajarId,
      peserta: { create: peserta.map((x) => ({ pelajarId: x.pelajarId, kedudukan: x.kedudukan })) },
    },
  });
  await notifyGuruUntukUnit(namaUnit, {
    tajuk: "Aktiviti unit menunggu pengesahan",
    mesej: `"${opr.namaProgram}" (${peserta.length} peserta) dihantar oleh SU/NSU ${namaUnit}.`,
    jenis: "info",
    pautan: "/guru",
  }).catch(() => null);
  return ok(rec, `Aktiviti dihantar (${peserta.length} peserta) — menunggu pengesahan Ketua GP / Penolong Ketua GP`, 201);
}
