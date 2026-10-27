import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, ok, fail } from "@/lib/api";
import { simpanFailDariForm } from "@/lib/upload";
import { PERINGKAT } from "@/lib/enums";

// POST: laporan mingguan SU/NSU — templat sama seperti borang aktiviti:
// Nama Program/Aktiviti, Peringkat, Tarikh, Unit, Laporan ringkas, Eviden.
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const boleh =
    session.role === "Pelajar" && (session.subRole === "SU" || session.subRole === "NSU");
  if (!boleh) return fail("Hanya SU/NSU boleh menghantar laporan mingguan", 403);
  if (!session.pelajarId) return fail("Profil pelajar tidak dijumpai", 403);

  const form = await request.formData();
  const namaProgram = String(form.get("namaProgram") ?? "").trim();
  const peringkat = String(form.get("peringkat") ?? "");
  const tarikh = String(form.get("tarikh") ?? "");
  const namaUnit = String(form.get("namaUnit") ?? "");
  const laporan = String(form.get("laporan") ?? "").trim();
  const sesiId = String(form.get("sesiId") ?? "") || null;

  if (!namaProgram) return fail("Nama program/aktiviti diperlukan", 422);
  if (!PERINGKAT.includes(peringkat as (typeof PERINGKAT)[number])) return fail("Peringkat tidak sah", 422);
  if (!tarikh) return fail("Tarikh program/aktiviti diperlukan", 422);
  if (!laporan) return fail("Laporan ringkas diperlukan", 422);

  // jenisKoko diambil dari Kokurikulum pelajar (jangan percaya klien).
  const unit = await prisma.kokurikulum.findFirst({
    where: { pelajarId: session.pelajarId, namaUnitT6: namaUnit },
    select: { jenisKoko: true },
  });
  if (!unit) return fail("Unit berkaitan diperlukan/tidak sah", 422);

  let lampiran: string | null = null;
  try {
    lampiran = await simpanFailDariForm(form, "eviden", "laporan");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat muat naik", 400);
  }
  if (!lampiran) return fail("Eviden diperlukan untuk semakan guru", 422);

  const rec = await prisma.laporanMingguan.create({
    data: {
      jenisKoko: unit.jenisKoko,
      namaUnit,
      tarikh: new Date(tarikh),
      namaProgram,
      peringkat,
      aktiviti: laporan,
      lampiran,
      sesiId,
      setiausahaId: session.pelajarId,
      statusSemakan: "Pending",
    },
  });
  return ok(rec, "Laporan dihantar untuk semakan", 201);
}
