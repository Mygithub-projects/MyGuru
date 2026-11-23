import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, sekatBelumDisahkan, ok, fail } from "@/lib/api";
import { simpanFailDariForm } from "@/lib/upload";
import { unitSeliaanSU } from "@/lib/pelajar";
import { kohortPelajar } from "@/lib/kohort-pilihan";
import { notifyGuruUntukUnit } from "@/lib/notifikasi";
import { KEDUDUKAN_AKTIVITI, PERINGKAT_AKTIVITI_UNIT } from "@/lib/enums";

const pesertaSchema = z
  .array(z.object({ pelajarId: z.string().min(1), kedudukan: z.enum(KEDUDUKAN_AKTIVITI) }))
  .min(1, "Sekurang-kurangnya seorang peserta diperlukan")
  .max(300);

// POST: SU/NSU unit menghantar satu aktiviti + senarai peserta (mana-mana unit)
// untuk pengesahan Ketua GP / Penolong Ketua GP unit itu.
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;
  const sekat = sekatBelumDisahkan(session);
  if (sekat) return sekat;
  const isSU = session.role === "Pelajar" && (session.subRole === "SU" || session.subRole === "NSU");
  if (!isSU || !session.pelajarId) return fail("Hanya SU/NSU boleh menghantar aktiviti unit", 403);

  const form = await request.formData();
  const namaAktiviti = String(form.get("namaAktiviti") ?? "").trim();
  const peringkat = String(form.get("peringkat") ?? "");
  const tarikh = String(form.get("tarikh") ?? "");
  const namaUnit = String(form.get("namaUnit") ?? "");
  const laporan = String(form.get("laporan") ?? "").trim();
  if (!namaAktiviti) return fail("Nama program/aktiviti diperlukan", 422);
  if (!PERINGKAT_AKTIVITI_UNIT.includes(peringkat as (typeof PERINGKAT_AKTIVITI_UNIT)[number])) return fail("Peringkat tidak sah", 422);
  if (!tarikh || Number.isNaN(new Date(tarikh).getTime())) return fail("Tarikh program/aktiviti diperlukan", 422);
  if (!laporan) return fail("Laporan ringkas diperlukan", 422);

  // Unit mesti unit di mana pelajar ini SU/NSU; bidang diambil dari rekod (bukan klien).
  const unitSU = await unitSeliaanSU(session.pelajarId, session.subRole);
  if (!unitSU.includes(namaUnit)) return fail("Anda hanya boleh menghantar untuk unit di mana anda SU/NSU", 403);
  const koko = await prisma.kokurikulum.findFirst({
    where: { pelajarId: session.pelajarId, namaUnitT6: namaUnit },
    select: { jenisKoko: true },
  });
  if (!koko || koko.jenisKoko === "Perkhidmatan") {
    return fail("Aktiviti unit hanya untuk unit Kelab, Sukan atau Badan Beruniform", 422);
  }

  let peserta: z.infer<typeof pesertaSchema>;
  try {
    const p = pesertaSchema.safeParse(JSON.parse(String(form.get("peserta") ?? "[]")));
    if (!p.success) return fail(p.error.issues[0]?.message ?? "Senarai peserta tidak sah", 422);
    peserta = p.data;
  } catch {
    return fail("Senarai peserta tidak sah", 422);
  }
  const ids = [...new Set(peserta.map((x) => x.pelajarId))];
  if (ids.length !== peserta.length) return fail("Peserta berulang dalam senarai", 422);
  const wujud = await prisma.pelajar.count({ where: { id: { in: ids }, statusAktif: true } });
  if (wujud !== ids.length) return fail("Sebahagian peserta tidak dijumpai atau tidak aktif", 422);

  let eviden: string | null = null;
  try {
    eviden = await simpanFailDariForm(form, "eviden", "eviden");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat muat naik", 400);
  }
  if (!eviden) return fail("Eviden diperlukan untuk pengesahan guru", 422);

  const rec = await prisma.aktivitiUnit.create({
    data: {
      namaAktiviti,
      peringkat,
      tarikh: new Date(tarikh),
      namaUnit,
      jenisKoko: koko.jenisKoko,
      kohort: await kohortPelajar(session.pelajarId),
      laporan,
      lampiranEviden: eviden,
      setiausahaId: session.pelajarId,
      peserta: { create: peserta.map((x) => ({ pelajarId: x.pelajarId, kedudukan: x.kedudukan })) },
    },
  });
  await notifyGuruUntukUnit(namaUnit, {
    tajuk: "Aktiviti unit menunggu pengesahan",
    mesej: `"${namaAktiviti}" (${peserta.length} peserta) dihantar oleh SU/NSU ${namaUnit}.`,
    jenis: "info",
    pautan: "/guru",
  }).catch(() => null);
  return ok(rec, `Aktiviti dihantar (${peserta.length} peserta) — menunggu pengesahan Ketua GP / Penolong Ketua GP`, 201);
}
