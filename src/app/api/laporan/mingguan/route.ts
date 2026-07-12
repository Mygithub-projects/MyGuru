import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, ok, fail } from "@/lib/api";
import { simpanFailDariForm } from "@/lib/upload";

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const { session } = auth;

  const boleh =
    session.role === "Pelajar" && (session.subRole === "SU" || session.subRole === "NSU");
  if (!boleh) return fail("Hanya SU/NSU boleh menghantar laporan mingguan", 403);
  if (!session.pelajarId) return fail("Profil pelajar tidak dijumpai", 403);

  const form = await request.formData();
  const aktiviti = String(form.get("aktiviti") ?? "").trim();
  const tarikh = String(form.get("tarikh") ?? "");
  const masa = String(form.get("masa") ?? "");
  const jenisKoko = String(form.get("jenisKoko") ?? "");
  const namaUnit = String(form.get("namaUnit") ?? "");
  const sesiId = String(form.get("sesiId") ?? "") || null;
  const hantar = form.get("hantar") === "true"; // true = Pending, false = Draft

  if (!aktiviti || !tarikh) return fail("Tarikh & aktiviti diperlukan", 422);

  let lampiran: string | null = null;
  try {
    lampiran = await simpanFailDariForm(form, "lampiran", "laporan");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ralat muat naik", 400);
  }

  const rec = await prisma.laporanMingguan.create({
    data: {
      jenisKoko: jenisKoko || "Kelab",
      namaUnit: namaUnit || null,
      tarikh: new Date(tarikh),
      masa: masa || null,
      aktiviti,
      lampiran,
      sesiId,
      setiausahaId: session.pelajarId,
      statusSemakan: hantar ? "Pending" : "Draft",
    },
  });
  return ok(rec, hantar ? "Laporan dihantar untuk semakan" : "Draf laporan disimpan", 201);
}
